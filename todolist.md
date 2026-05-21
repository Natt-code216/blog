# 项目迭代 TodoList

> 目标：在不改动前端视觉样式的前提下，把这个 React + Strapi 个人博客项目搭建完善起来。
> 起始日期：2026-05-22

## 阶段 0 · 准备

- [x] **0.1** 将工作区当前未提交的改动 push 到 GitHub (`origin/main`)
- [x] **0.2** 通读项目结构，理解项目意图：
  - 前端 (React 18 + TypeScript + Vite) 渲染 Hero / Essays / Tutorials / Tools / Footer 五个板块
  - 后端 (Strapi 5) 提供 essay / tutorial / tool / comment 四个 collection
  - 前端通过 `src/services/api.ts` 调用 `http://localhost:1337/api`
- [x] **0.3** 建立任务清单（本文件）

## 阶段 1 · 启动与连通性

- [x] **1.1** 检查端口占用（前端 5173 / 后端 1337），若占用则先释放
- [x] **1.2** 安装 / 校验前后端依赖
- [x] **1.3** 后台启动 Strapi (`backend/`)，观察 boot 是否成功
- [x] **1.4** 后台启动 Vite 前端，观察启动日志
- [x] **1.5** 创建 `.env` （前端 `VITE_API_URL`、后端必要密钥），保留 `.env.example` 作为模板

## 阶段 2 · 内容补全（不改样式）

- [x] **2.1** 编写教程文字稿（`docs/tutorials/`）：
  - `01-react-vite-setup.md`：React + Vite 项目初始化全流程
  - `02-strapi-headless-cms.md`：Strapi 5 Headless CMS 接入指南
  - `03-frontend-backend-integration.md`：前后端联调实战
- [x] **2.2** 准备示例随笔 markdown（`docs/essays/`）三篇
- [x] **2.3** 准备工具卡片说明（`docs/tools/`）
- [x] **2.4** 编写 Strapi 种子数据脚本 `backend/scripts/seed.js`，一键灌入示例数据

## 阶段 3 · 工程化完善（不改前端 UI）

- [x] **3.1** 新增 `scripts/check-ports.mjs`，启动前自动检查 5173/1337 端口
- [x] **3.2** 在根 `package.json` 增加 `dev:all` / `check:ports` 脚本
- [x] **3.3** 完善 `.env.example` 内容（前端 + 后端区分说明）
- [x] **3.4** 修正 `useApiFetch` 的依赖问题（已是 ref 模式，OK）
- [x] **3.5** 在 `src/services/api.ts` 中增加错误处理 & 健康检查方法（仅内部，不影响 UI）
- [x] **3.6** 增加 `.gitignore` 中的 `*.log` / `.env` 规则确认

## 阶段 4 · 文档化

- [x] **4.1** 重写 `README.md`，加入"迭代记录"章节
- [x] **4.2** 补全 `docs/frontend/QUICKSTART.md` 与 `docs/frontend/COMPONENTS.md`
- [x] **4.3** 在 `docs/README.md` 加入教程文字稿索引

## 阶段 5 · 未来规划（不在本轮实施）

- [ ] 单元测试（vitest + react-testing-library）
- [ ] GitHub Actions CI（lint + build）
- [ ] 文章详情页 + 路由
- [ ] 全站搜索
- [ ] 评论提交表单
- [ ] 暗/亮主题切换
- [ ] Sitemap + SEO
- [ ] Vercel / Netlify 部署配置

---

## 约束与原则

1. **绝不改动前端视觉样式**：CSS Module 文件保持不变。
2. 所有新增脚本 / 工具都放在 `scripts/` 或 `docs/`，不污染 `src/`。
3. 启动服务前必须检查端口可用性。
4. 所有变更最后由 README.md 的"迭代记录"章节统一记录。
