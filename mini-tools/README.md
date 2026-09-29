# 工具页面入口

这里是 Vite 多页面应用的 HTML 入口，发布地址保持 `/mini-tools/*.html`。

- 修改具体工具逻辑或局部样式：`src/features/tools/implementations/`。
- 修改所有工具的布局、导航和表单：`src/features/tools/workbench/`。
- 修改全站配色：`src/styles/tokens.css`；主题行为：`src/app/theme.ts`。
- 新增工具登记：`src/services/toolCatalog.ts`，首页、搜索、工具目录共享该目录。

在仓库根运行 `pnpm dev`；生产运行 `pnpm build`，发布整个 `dist/`。源码包含模块依赖，不能通过双击 HTML 或只复制本文件夹使用。

完整说明见 [工具开发文档](../docs/tools/README.md)。
