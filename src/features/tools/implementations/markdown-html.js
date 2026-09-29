import '../workbench/init';
import './markdown-html.css';
import { renderMarkdown } from '../../../utils/renderMarkdown';
import { copyText, downloadBlob, showStatus } from './text-ui';

const input = document.getElementById('input');
const preview = document.getElementById('preview');
const status = document.getElementById('status');
// Preview and exported HTML use the same sanitizer; inline style cannot override the workbench theme.
function getHTML() {
  return renderMarkdown(input.value);
}
function render() {
  preview.innerHTML = getHTML();
  showStatus(status);
}
document.getElementById('copy').addEventListener('click', () => copyText(getHTML(), status));
document.getElementById('download').addEventListener('click', () => {
  const html = getHTML();
  if (!html.trim()) { showStatus(status, '没有可下载的内容', 'error'); return; }
  const doc = `<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>导出文档</title>\n</head>\n<body>\n${html}\n</body>\n</html>`;
  downloadBlob(new Blob([doc], { type: 'text/html;charset=utf-8' }), 'document.html');
  showStatus(status, '已开始下载 document.html', 'success');
});
document.getElementById('clear').addEventListener('click', () => {
  input.value = ''; render(); input.focus();
});
input.addEventListener('input', render);
input.value = '# 你好世界\n\n这是一段 **Markdown** 示例。\n\n- 列表项一\n- 列表项二\n\n```js\nconst x = 42;\n```\n';
render();
