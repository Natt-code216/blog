import '../workbench/init';
import './csv-json.css';
import { csvToObjects, objectsToCSV } from './text-helpers';
import { copyText, downloadBlob, showStatus } from './text-ui';

const input = document.getElementById('input');
const output = document.getElementById('output');
const status = document.getElementById('status');
let outputType = 'json';

function convert(type) {
  output.value = '';
  try {
    if (!input.value.trim()) throw new Error('请输入需要转换的内容');
    const data = type === 'json' ? csvToObjects(input.value) : JSON.parse(input.value);
    const result = type === 'json' ? JSON.stringify(data, null, 2) : objectsToCSV(data);
    output.value = result;
    outputType = type;
    showStatus(status, `转换成功（${data.length} 条记录）`, 'success');
  } catch (error) { showStatus(status, `转换失败：${error.message}`, 'error'); }
}
document.getElementById('csv-to-json').addEventListener('click', () => convert('json'));
document.getElementById('json-to-csv').addEventListener('click', () => convert('csv'));
document.getElementById('copy').addEventListener('click', () => copyText(output.value, status));
document.getElementById('download').addEventListener('click', () => {
  if (!output.value) { showStatus(status, '没有可下载的内容', 'error'); return; }
  const mime = outputType === 'csv' ? 'text/csv' : 'application/json';
  downloadBlob(new Blob([output.value], { type: `${mime};charset=utf-8` }), `output.${outputType}`);
  showStatus(status, '已开始下载', 'success');
});
document.getElementById('clear').addEventListener('click', () => {
  input.value = ''; output.value = ''; showStatus(status); input.focus();
});
input.addEventListener('input', () => { output.value = ''; showStatus(status); });
