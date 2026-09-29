# 历史内容脚本

- `sync-content-2026-09.mjs`：对应远端归档的 `content/tutorials/{slug}/index.md` 与 `chapters/` 结构；当前结构不使用它。
- `lint-content-2026-09.mjs`：校验同一旧结构的 frontmatter 和字数；当前结构不使用它。

当前本地预览使用 `backend/scripts/seed-local-content.mjs`，先运行 `pnpm tutorials:check` 校验章节，再按 [后端说明](../../../backend/README.md#本地内容预览)选择同步命令。
