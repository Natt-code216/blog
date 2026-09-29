import '../workbench/init';
import './json-formatter.css';
import { copyText, showStatus } from './text-ui';

const input = document.getElementById('input');
const output = document.getElementById('output');
const status = document.getElementById('status');

function transform(mode) {
  output.value = '';
  try {
    if (!input.value.trim()) throw new Error('请输入 JSON 内容');
    const value = JSON.parse(input.value);
    if (mode !== 'validate') output.value = JSON.stringify(value, null, mode === 'format' ? 2 : undefined);
    showStatus(status, { format: '格式化成功', minify: '压缩成功', validate: 'JSON 有效 ✓' }[mode], 'success');
  } catch (error) {
    showStatus(status, `校验失败：${error.message}`, 'error');
  }
}
['format', 'minify', 'validate'].forEach(mode => document.getElementById(mode).addEventListener('click', () => transform(mode)));
document.getElementById('copy').addEventListener('click', () => copyText(output.value, status));
document.getElementById('clear').addEventListener('click', () => {
  input.value = ''; output.value = ''; showStatus(status); input.focus();
});
input.addEventListener('input', () => { output.value = ''; showStatus(status); });
