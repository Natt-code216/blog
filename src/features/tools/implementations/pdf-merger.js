import '../workbench/init';
import './pdf-merger.css';
import { PDFDocument } from 'pdf-lib';
import { actionButton, bindFileDrop, downloadBlob, isPdf, showMessage } from './file-utils';
import { pdfReadError } from './pdf-utils';

const input = document.getElementById('input');
const list = document.getElementById('list');
const merge = document.getElementById('merge');
const message = document.getElementById('msg');
let files = [];
let busy = false;
let operation = 0;

function updateControls() {
  input.disabled = busy;
  merge.disabled = busy || files.length < 2;
  document.getElementById('drop').setAttribute('aria-busy', String(busy));
  list.querySelectorAll('button').forEach(button => {
    const index = Number(button.dataset.index);
    button.disabled = busy || (button.dataset.action === 'up' && index === 0)
      || (button.dataset.action === 'down' && index === files.length - 1);
  });
}

function render() {
  list.replaceChildren();
  files.forEach((file, index) => {
    const item = document.createElement('li');
    item.className = 'pdf-file-item';
    const info = document.createElement('div');
    info.className = 'pdf-file-info';
    const name = document.createElement('span');
    name.className = 'pdf-file-name';
    name.textContent = `${index + 1}. ${file.name}`;
    const pages = document.createElement('span');
    pages.className = 'pdf-file-pages';
    pages.textContent = `${file.pages} 页`;
    info.append(name, pages);
    const actions = document.createElement('div');
    actions.className = 'pdf-file-actions';
    actions.append(
      actionButton(`上移 ${file.name}`, '↑', 'up', index),
      actionButton(`下移 ${file.name}`, '↓', 'down', index),
      actionButton(`移除 ${file.name}`, '×', 'remove', index),
    );
    item.append(info, actions);
    list.append(item);
  });
  updateControls();
}

async function addFiles(selected) {
  if (busy || !selected.length) return;
  const token = ++operation;
  busy = true;
  updateControls();
  showMessage(message, '正在读取 PDF…');
  const errors = [];
  for (const file of selected) {
    if (!isPdf(file)) { errors.push(`${file.name}：请选择 PDF 文件`); continue; }
    try {
      const buffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buffer);
      if (token !== operation) return;
      files.push({ name: file.name, buffer, pages: pdf.getPageCount() });
    } catch (error) { errors.push(`${file.name}：${pdfReadError(error)}`); }
    if (token !== operation) return;
  }
  if (token !== operation) return;
  busy = false;
  render();
  showMessage(message, errors.length ? errors.join('；') : `已选择 ${files.length} 个 PDF，可用箭头调整合并顺序。`, errors.length ? 'error' : '');
}

bindFileDrop(document.getElementById('drop'), input, addFiles);
list.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || busy) return;
  const index = Number(button.dataset.index);
  const action = button.dataset.action;
  if (action === 'up' && index > 0) [files[index - 1], files[index]] = [files[index], files[index - 1]];
  if (action === 'down' && index < files.length - 1) [files[index + 1], files[index]] = [files[index], files[index + 1]];
  if (action === 'remove') files.splice(index, 1);
  render();
  const next = action === 'up' ? index - 1 : action === 'down' ? index + 1 : Math.min(index, files.length - 1);
  list.querySelector(`[data-index="${next}"][data-action="${action}"]`)?.focus();
});

document.getElementById('clear').addEventListener('click', () => {
  operation++;
  busy = false;
  files = [];
  input.value = '';
  render();
  showMessage(message, '已清空文件');
});

merge.addEventListener('click', async () => {
  if (busy || files.length < 2) return;
  const token = ++operation;
  const selected = [...files];
  busy = true;
  updateControls();
  showMessage(message, '正在合并 PDF…');
  try {
    const output = await PDFDocument.create();
    for (const file of selected) {
      const pdf = await PDFDocument.load(file.buffer);
      const pages = await output.copyPages(pdf, pdf.getPageIndices());
      if (token !== operation) return;
      pages.forEach(page => output.addPage(page));
    }
    const bytes = await output.save();
    if (token !== operation) return;
    downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'merged.pdf');
    showMessage(message, `已合并 ${selected.length} 个文件，共 ${output.getPageCount()} 页，开始下载 merged.pdf`, 'success');
  } catch (error) {
    if (token === operation) showMessage(message, `合并失败：${pdfReadError(error)}`, 'error');
  } finally {
    if (token === operation) { busy = false; updateControls(); }
  }
});
