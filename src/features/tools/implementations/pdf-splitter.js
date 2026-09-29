import '../workbench/init';
import './pdf-splitter.css';
import { PDFDocument } from 'pdf-lib';
import { bindFileDrop, downloadBlob, isPdf, showMessage } from './file-utils';
import { parsePageRange, pdfReadError } from './pdf-utils';

const input = document.getElementById('input');
const info = document.getElementById('info');
const range = document.getElementById('range');
const split = document.getElementById('split');
const message = document.getElementById('msg');
let current = null;
let busy = false;
let operation = 0;

function updateControls() {
  input.disabled = busy;
  range.disabled = busy;
  split.disabled = busy || !current;
  info.hidden = !current;
  document.getElementById('drop').setAttribute('aria-busy', String(busy));
}

async function loadFiles(files) {
  if (busy || !files.length) return;
  if (files.length !== 1 || !isPdf(files[0])) {
    showMessage(message, '请一次选择一个 PDF 文件。', 'error');
    return;
  }
  const file = files[0];
  const token = ++operation;
  current = null;
  busy = true;
  updateControls();
  showMessage(message, '正在读取 PDF…');
  try {
    const buffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(buffer);
    if (token !== operation) return;
    current = { name: file.name, buffer, pages: pdf.getPageCount() };
    document.getElementById('fname').textContent = file.name;
    document.getElementById('fpages').textContent = String(current.pages);
    range.value = '';
    range.placeholder = current.pages > 1 ? `例如：1-${current.pages}` : '例如：1';
    showMessage(message, '文件已就绪，请填写需要提取的页码。');
  } catch (error) {
    if (token === operation) showMessage(message, pdfReadError(error), 'error');
  } finally {
    if (token === operation) { busy = false; updateControls(); }
  }
}

bindFileDrop(document.getElementById('drop'), input, loadFiles);
document.getElementById('clear').addEventListener('click', () => {
  operation++;
  busy = false;
  current = null;
  input.value = '';
  range.value = '';
  updateControls();
  showMessage(message, '已清空文件');
});

split.addEventListener('click', async () => {
  if (busy || !current) return;
  let indices;
  try { indices = parsePageRange(range.value, current.pages); }
  catch (error) { showMessage(message, error.message, 'error'); range.focus(); return; }
  const token = ++operation;
  const selected = current;
  busy = true;
  updateControls();
  showMessage(message, '正在提取页面…');
  try {
    const source = await PDFDocument.load(selected.buffer);
    const output = await PDFDocument.create();
    const pages = await output.copyPages(source, indices);
    if (token !== operation) return;
    pages.forEach(page => output.addPage(page));
    const bytes = await output.save();
    if (token !== operation) return;
    downloadBlob(new Blob([bytes], { type: 'application/pdf' }), `${selected.name.replace(/\.pdf$/i, '')}-split.pdf`);
    showMessage(message, `已提取 ${indices.length} 页，开始下载`, 'success');
  } catch (error) {
    if (token === operation) showMessage(message, `拆分失败：${pdfReadError(error)}`, 'error');
  } finally {
    if (token === operation) { busy = false; updateControls(); }
  }
});
