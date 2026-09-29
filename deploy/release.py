#!/usr/bin/env python3
"""Build a clean Git revision and publish an immutable, checksummed release."""
import datetime
import hashlib
import json
import os
from pathlib import Path
import shlex
import shutil
import subprocess
import tarfile
import tempfile

ROOT = Path(__file__).resolve().parent.parent
os.chdir(ROOT)
NODE = shutil.which('node')
if not NODE:
    bundled = Path.home() / '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node'
    if bundled.exists():
        NODE = str(bundled)
if not NODE:
    raise SystemExit('Install Node.js 24 before publishing.')
os.environ['PATH'] = str(Path(NODE).parent) + os.pathsep + os.environ['PATH']
HOST = os.environ.get('BLOG_SSH_HOST', 'root@102.134.52.187')
SSH = ['ssh', '-o', 'ControlMaster=auto', '-o', 'ControlPersist=900',
       '-o', 'ControlPath=/tmp/blog-offerready-ssh-%C', HOST]

def run(args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)

def output(args):
    return subprocess.check_output(args, text=True).strip()

def ensure_clean():
    if output(['git', 'status', '--porcelain']):
        raise SystemExit('Commit local changes before publishing; each release must match one Git commit.')

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

ensure_clean()
commit = output(['git', 'rev-parse', 'HEAD'])
stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
release = f'{stamp}-{commit[:8]}'
print(f'Preparing release {release}', flush=True)
run([NODE, 'node_modules/typescript/bin/tsc', '--noEmit'])
run([NODE, 'node_modules/vitest/vitest.mjs', 'run'])
env = {**os.environ, 'VITE_API_URL': '/cms/api'}
run([NODE, 'node_modules/vite/bin/vite.js', 'build'], env=env)
run([NODE, 'scripts/verify-build.mjs'])
run([NODE, 'node_modules/@strapi/strapi/bin/strapi.js', 'build'], cwd=ROOT / 'backend', env={
    **os.environ, 'NODE_ENV': 'production', 'PUBLIC_URL': 'https://www.blog.offerready.cn/cms',
    'TRUST_PROXY': 'true', 'STRAPI_TELEMETRY_DISABLED': 'true',
})
ensure_clean()
if output(['git', 'rev-parse', 'HEAD']) != commit:
    raise SystemExit('Git HEAD changed during build; refusing a mixed release.')
with tempfile.TemporaryDirectory(prefix='blog-release-') as tmp:
    tmp = Path(tmp)
    stage = tmp / 'stage'
    stage.mkdir()
    source = tmp / 'source.tar'
    run(['git', 'archive', '--format=tar', '-o', str(source), commit])
    run(['tar', '-xf', str(source), '-C', str(stage)])
    shutil.copytree(ROOT / 'dist', stage / 'frontend')
    shutil.copytree(ROOT / 'backend/dist', stage / 'backend/dist')
    run(['git', 'archive', '--format=tar.gz', '-o', str(stage / 'source.tar.gz'), commit])
    content = json.loads(output([NODE, 'backend/scripts/seed-production-content.mjs', '--manifest']))
    (stage / 'content-manifest.json').write_text(json.dumps(content, ensure_ascii=False, indent=2))
    schema_files = sorted((stage / 'backend/src').rglob('schema.json'))
    schema_hash = hashlib.sha256(''.join(
        f'{p.relative_to(stage)}:{sha(p)}\n' for p in schema_files).encode()).hexdigest()
    manifest = {'release': release, 'gitCommit': commit, 'gitTree': output(['git', 'rev-parse', 'HEAD^{tree}']),
                'builtAt': stamp, 'node': output([NODE, '--version']), 'schemaHash': schema_hash,
                'backendLockSha256': sha(stage / 'backend/package-lock.json')}
    for p in [stage / 'release.json', stage / 'frontend/version.json']:
        p.write_text(json.dumps(manifest, indent=2) + '\n')
    # Generate the sitemap from the exact repository content being released.
    from xml.sax.saxutils import escape
    paths = ['/', '/collection', '/mini-tools/index.html']
    paths += [f'/essays/{x["slug"]}' for x in content['essays']]
    paths += [f'/tutorials/{x["slug"]}' for x in content['tutorials']]
    (stage / 'frontend/sitemap.xml').write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + ''.join(f'<url><loc>{escape("https://www.blog.offerready.cn" + p)}</loc></url>\n' for p in paths)
        + '</urlset>\n')
    paths = sorted(p for p in stage.rglob('*') if p.is_file())
    (stage / 'SHA256SUMS').write_text(''.join(f'{sha(p)}  {p.relative_to(stage)}\n' for p in paths))
    archive = tmp / f'{release}.tar.gz'
    with tarfile.open(archive, 'w:gz') as tar:
        for p in stage.iterdir():
            tar.add(p, arcname=p.name)
    run(SSH + ['mkdir -p /opt/blog/incoming'])
    run(['scp', '-o', 'ControlPath=/tmp/blog-offerready-ssh-%C', str(archive),
         f'{HOST}:/opt/blog/incoming/{release}.tar.gz'])
    command = f'bash -s -- publish {shlex.quote(release)} {sha(archive)}'
    with open(ROOT / 'deploy/server-release.sh', 'rb') as script:
        run(SSH + [command], stdin=script)
    # Only successful releases receive a tag. No GitHub push is performed here.
    run(['git', 'tag', '-a', f'deploy/{release}', commit, '-m', f'Published https://www.blog.offerready.cn — {release}'])
    print(f'Published {release}; Git tag: deploy/{release}', flush=True)
