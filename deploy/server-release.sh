#!/usr/bin/env bash
# Run on the server: bash deploy/server-release.sh publish ID ARCHIVE_SHA256
# Code rollback: bash /opt/blog/current/deploy/server-release.sh rollback ID
# Full rollback: ... restore ID /opt/blog/shared/backups/PUBLISH_EVENT
set -Eeuo pipefail
main_pid=$BASHPID
export PATH=/opt/blog-node/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
action=${1:?publish, rollback, restore or status required}
base=/opt/blog
if [[ "$action" == status ]]; then
    readlink -f "$base/current"
    cat "$base/current/release.json" 2>/dev/null || true
    systemctl show blog -p ActiveState -p NRestarts
    exit 0
fi
[[ "$action" == publish || "$action" == rollback || "$action" == restore ]]
release=${2:?release ID required}
[[ "$release" =~ ^[A-Za-z0-9][A-Za-z0-9._-]+$ ]]
exec 9>"$base/shared/release.lock"
flock -n 9 || { echo 'Another release is running'; exit 1; }
target="$base/releases/$release"
previous=$(readlink -f "$base/current")
[[ "$previous" == "$base/releases/"* && -d "$previous" ]]
[[ "$target" != "$previous" ]]
if [[ "$action" == publish ]]; then
    digest=${3:?archive checksum required}
    [[ "$digest" =~ ^[a-f0-9]{64}$ ]]
    [[ ! -e "$target" ]]
    printf '%s  %s\n' "$digest" "$base/incoming/$release.tar.gz" | sha256sum -c -
    mkdir "$target"
    tar -xzf "$base/incoming/$release.tar.gz" -C "$target"
    (cd "$target" && sha256sum -c SHA256SUMS > /dev/null)
    chown -R blog:blog "$target"
    # Reuse a copy of dependencies only if the lockfile and runtime match.
    if cmp -s "$target/backend/package-lock.json" "$previous/backend/package-lock.json" \
       && [[ -d "$previous/backend/node_modules" ]] \
       && [[ -f "$previous/backend/.runtime-node-version" ]] \
       && [[ "$(cat "$previous/backend/.runtime-node-version")" == "$(node --version)" ]]; then
        cp -a --reflink=auto "$previous/backend/node_modules" "$target/backend/node_modules"
    else
        (cd "$target/backend" && runuser -u blog -- env PATH="$PATH" NODE_OPTIONS=--max-old-space-size=384 \
            npm ci --omit=dev --no-audit --no-fund --cache "$base/shared/npm-cache")
    fi
    node --version > "$target/backend/.runtime-node-version"
    ln -s "$base/shared/backend.env" "$target/backend/.env"
    # Only an empty tracked uploads directory is allowed in a release.
    if [[ -d "$target/backend/public/uploads" ]]; then
        test -z "$(find "$target/backend/public/uploads" -type f ! -name .gitkeep -print -quit)"
        rm -f "$target/backend/public/uploads/.gitkeep"
        rmdir "$target/backend/public/uploads"
    fi
    ln -s "$base/shared/uploads" "$target/backend/public/uploads"
    chown -R blog:blog "$target"
else
    [[ -d "$target/backend/node_modules" && -f "$target/frontend/index.html" ]]
    if [[ "$action" == restore ]]; then
        restore_backup=$(realpath "${3:?backup directory required}")
        [[ "$restore_backup" == "$base/shared/backups/"* ]]
        [[ "$(cat "$restore_backup/previous-release")" == "$target" ]]
        [[ "$(cat "$restore_backup/target-release")" == "$previous" ]]
        runuser -u postgres -- pg_restore --list < "$restore_backup/database.dump" >/dev/null
    else
    # Code-only rollback is permitted only with identical content schemas.
    diff -r "$previous/backend/src/api" "$target/backend/src/api" >/dev/null || {
        echo 'Backend API schema/code changed: inspect the database backup before rollback.'; exit 1;
    }
    fi
fi
event="$(date -u +%Y%m%dT%H%M%SZ)-$action-$release"
backup="$base/shared/backups/$event"
install -d -m 700 "$backup"
cp /etc/nginx/sites-available/blog "$backup/nginx.conf"
cp /etc/systemd/system/blog.service "$backup/blog.service"
printf '%s\n' "$previous" > "$backup/previous-release"
printf '%s\n' "$target" > "$backup/target-release"
stopped=0
database_ready=0
recover() {
    # ERR is inherited by subshells; recovery belongs only to the parent process.
    [[ "$BASHPID" == "$main_pid" ]] || exit 1
    trap - ERR
    echo "Release failed; recovering $previous (backup: $backup)" >&2
    if [[ "$stopped" == 1 ]]; then
        systemctl stop blog || true
        if [[ "$database_ready" == 1 && "$action" != rollback ]]; then
            if ! runuser -u postgres -- pg_restore --clean --if-exists --exit-on-error -d blog < "$backup/database.dump"; then
                echo 'Database recovery failed; service remains stopped. Inspect backup.' >&2
                exit 1
            fi
            tar -xzf "$backup/uploads.tar.gz" -C "$base/shared"
        fi
        ln -s "$previous" "$base/.current-recovery"
        mv -Tf "$base/.current-recovery" "$base/current"
        cp "$backup/nginx.conf" /etc/nginx/sites-available/blog
        cp "$backup/blog.service" /etc/systemd/system/blog.service
        systemctl daemon-reload
        systemctl start blog
        nginx -t && systemctl reload nginx
    fi
    printf '%s FAILED %s previous=%s backup=%s\n' "$(date -u +%FT%TZ)" "$release" "$previous" "$backup" >> "$base/shared/releases.log"
    exit 1
}
trap recover ERR
systemctl stop blog
stopped=1
tar -czf "$backup/uploads.tar.gz" -C "$base/shared" uploads
runuser -u postgres -- pg_dump -Fc blog > "$backup/database.dump"
runuser -u postgres -- pg_restore --list < "$backup/database.dump" > "$backup/database-contents.txt"
database_ready=1
if [[ "$action" == restore ]]; then
    runuser -u postgres -- pg_restore --clean --if-exists --exit-on-error -d blog < "$restore_backup/database.dump"
    tar -xzf "$restore_backup/uploads.tar.gz" -C "$base/shared"
fi
if [[ "$action" == publish ]]; then
    (cd "$target/backend" && runuser -u blog -- bash -c '
        set -a; source /opt/blog/shared/backend.env; set +a
        export PATH=/opt/blog-node/bin:/usr/bin:/bin NODE_OPTIONS=--max-old-space-size=384
        node scripts/seed-production-content.mjs --sync
    ')
fi
cp "$target/deploy/nginx-blog.conf" /etc/nginx/sites-available/blog
cp "$target/deploy/blog.service" /etc/systemd/system/blog.service
nginx -t
ln -s "$target" "$base/.current-next"
mv -Tf "$base/.current-next" "$base/current"
systemctl daemon-reload
systemctl start blog
for attempt in $(seq 1 30); do
    if curl -fsS http://127.0.0.1:1337/_health >/dev/null 2>&1; then break; fi
    sleep 2
done
curl -fsS http://127.0.0.1:1337/_health >/dev/null
systemctl reload nginx
if [[ "$action" == publish ]]; then
    python3 "$target/deploy/verify-release.py" "$target"
fi
ln -s "$previous" "$base/.previous-next"
mv -Tf "$base/.previous-next" "$base/previous"
printf '%s %s %s previous=%s backup=%s\n' "$(date -u +%FT%TZ)" "$action" "$release" "$previous" "$backup" >> "$base/shared/releases.log"
trap - ERR
echo "Published: $target"
echo "Previous: $previous"
echo "Backup: $backup"
