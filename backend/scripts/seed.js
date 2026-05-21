#!/usr/bin/env node
/**
 * Strapi 种子数据脚本
 *
 * 用法（确保 Strapi 已经在运行）：
 *   node backend/scripts/seed.js
 *
 * 通过公开的 REST API 创建示例 essay / tutorial / tool 数据。
 * 注意：默认情况下 Public 角色没有 create 权限，所以脚本会用 API_TOKEN 调用。
 * 在 Strapi Admin → Settings → API Tokens 创建一个 Full Access Token，
 * 然后通过环境变量传入：
 *   STRAPI_TOKEN=xxxx node backend/scripts/seed.js
 */

const API = process.env.STRAPI_URL || 'http://localhost:1337/api';
const TOKEN = process.env.STRAPI_TOKEN || '';

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
    body: JSON.stringify({ data: body }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} -> ${res.status} ${text}`);
  }
  return res.json();
}

const tutorials = [
  {
    title: '从零搭建 React + Vite + TypeScript 项目',
    description: '第一章，讲清楚为什么选 Vite、怎么组织目录、CSS Module 怎么用。',
    level: 'A_level',
    status: 'A更新中',
    chapters: 1,
    icon: 'code',
    slug: 'react-vite-setup',
    published: true,
  },
  {
    title: '用 Strapi 5 搭建 Headless CMS 后端',
    description: '介绍 Strapi 5 的 collection、权限、API 调用与上传。',
    level: 'B_level',
    status: 'A更新中',
    chapters: 2,
    icon: 'layers',
    slug: 'strapi-headless-cms',
    published: true,
  },
  {
    title: '前后端联调与数据加载状态',
    description: '环境变量、Service 层、Hook 与组件解耦。',
    level: 'B_level',
    status: 'A更新中',
    chapters: 3,
    icon: 'zap',
    slug: 'frontend-backend-integration',
    published: true,
  },
];

const essays = [
  {
    title: '关于"克制"',
    excerpt: '极简的本质不是"少"，而是"恰好"。',
    category: 'ESSAY',
    date: '2026-05-22',
    slug: 'on-minimalism',
    published: true,
  },
  {
    title: '手艺与代码',
    excerpt: '写代码这件事，越久越觉得像传统手艺。',
    category: 'THOUGHTS',
    date: '2026-05-20',
    slug: 'craftsmanship-and-code',
    published: true,
  },
  {
    title: '工具与心智',
    excerpt: '工具是放大器而非创造者。',
    category: 'LIFESTYLE',
    date: '2026-05-18',
    slug: 'on-tools',
    published: true,
  },
];

const tools = [
  {
    title: 'Analytics Dashboard',
    description: '个人数据可视化面板，看见日常的轨迹。',
    icon: 'barChart',
    url: '#',
    slug: 'analytics-dashboard',
  },
  {
    title: 'Color Palette',
    description: '配色方案生成器，给设计找一个起点。',
    icon: 'droplet',
    url: '#',
    slug: 'color-palette',
  },
  {
    title: 'Markdown Editor',
    description: '带预览的 Markdown 写作工具。',
    icon: 'fileText',
    url: '#',
    slug: 'markdown-editor',
  },
  {
    title: 'Search Engine',
    description: '站内搜索（规划中）。',
    icon: 'search',
    url: '#',
    slug: 'search-engine',
  },
];

async function main() {
  if (!TOKEN) {
    console.log('[warn] 未设置 STRAPI_TOKEN，写操作可能因权限不足失败。');
    console.log('       请在 Admin → Settings → API Tokens 创建 Full Access token。');
  }

  console.log('Seeding tutorials...');
  for (const t of tutorials) {
    try { await post('/tutorials', t); console.log('  +', t.title); }
    catch (e) { console.log('  -', t.title, e.message); }
  }

  console.log('Seeding essays...');
  for (const e of essays) {
    try { await post('/essays', e); console.log('  +', e.title); }
    catch (err) { console.log('  -', e.title, err.message); }
  }

  console.log('Seeding tools...');
  for (const t of tools) {
    try { await post('/tools', t); console.log('  +', t.title); }
    catch (e) { console.log('  -', t.title, e.message); }
  }

  console.log('Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
