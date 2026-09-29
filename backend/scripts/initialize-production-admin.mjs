#!/usr/bin/env node
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const backendDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

async function main() {
  if (process.argv[2] !== '--initialize' || process.env.DATABASE_NAME !== 'blog'
    || process.env.DATABASE_CLIENT !== 'postgres') throw new Error('Production initialization only.');
  process.chdir(backendDir);
  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({ appDir: backendDir, distDir: join(backendDir, 'dist') }).load();
  try {
    if (await app.db.query('admin::user').count()) {
      console.log('An administrator already exists; no changes made.');
      return;
    }
    const email = process.env.BLOG_ADMIN_EMAIL || 'admin@offerready.cn';
    const password = `Blog9!${randomBytes(24).toString('base64url')}`;
    const credentialsPath = '/opt/blog/shared/admin-credentials.local';
    writeFileSync(credentialsPath, JSON.stringify({
      url: 'https://www.blog.offerready.cn/cms/admin', email, password,
    }, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
    const role = await app.admin.services.role.getSuperAdmin();
    await app.admin.services.user.create({ email, password, firstname: 'Blog',
      lastname: 'Admin', isActive: true, roles: [role.id], registrationToken: null });
    console.log(`Administrator created. Credentials saved to ${credentialsPath}`);
  } finally {
    await app.destroy();
  }
}
// Strapi plugins may leave background timers after destroy; the one-shot CLI can exit.
main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
