import '../workbench/init';
import './image-compressor.css';
import JSZip from 'jszip';
import { bindFileDrop, canvasBlob, decodeImage, downloadBlob, formatSize, isSupportedImage, reserveFilename, showMessage } from './file-utils';

const fileInput = document.getElementById('file');
const list = document.getElementById('list');
const format = document.getElementById('fmt');
const quality = document.getElementById('q');
const maxWidth = document.getElementById('mw');
const run = document.getElementById('run');
const all = document.getElementById('all');
const message = document.getElementById('msg');
let items = [];
let busy = false;
let operation = 0;

function updateControls() {
  fileInput.disabled = busy;
  format.disabled = busy;
  quality.disabled = busy || format.value === 'image/png';
  maxWidth.disabled = busy;
  run.disabled = busy || !items.length;
  all.disabled = busy || !items.some(item => item.result);
  list.querySelectorAll('button').forEach(button => {
    button.disabled = busy || (button.dataset.action === 'download' && !items[Number(button.dataset.index)]?.result);
  });
  document.getElementById('drop').setAttribute('aria-busy', String(busy));
}

function render() {
  list.replaceChildren();
  items.forEach((item, index) => {
    const card = document.createElement('li');
    card.className = 'compression-item';
    const image = document.createElement('img');
    image.src = item.url;
    image.alt = item.file.name;
    const info = document.createElement('div');
    info.className = 'compression-info';
    const name = document.createElement('p');
    name.className = 'compression-name';
    name.textContent = item.file.name;
    const meta = document.createElement('p');
    meta.className = 'compression-meta';
    meta.textContent = `原始 ${formatSize(item.file.size)}`;
    if (item.error) {
      meta.classList.add('error');
      meta.textContent += ` · ${item.error}`;
    } else if (item.result) {
      const difference = item.file.size ? (1 - item.result.blob.size / item.file.size) * 100 : 0;
      meta.textContent = `${item.result.width} × ${item.result.height} · ${formatSize(item.file.size)} → ${formatSize(item.result.blob.size)} · ${difference >= 0 ? `减少 ${difference.toFixed(1)}%` : `增加 ${Math.abs(difference).toFixed(1)}%`}`;
      if (difference >= 0) meta.classList.add('success');
    }
    info.append(name, meta);
    const actions = document.createElement('div');
    actions.className = 'compression-actions';
    for (const [action, text] of [['download', '下载'], ['remove', '移除']]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-secondary';
      button.textContent = text;
      button.dataset.action = action;
      button.dataset.index = String(index);
      button.setAttribute('aria-label', `${text} ${item.file.name}`);
      actions.append(button);
    }
    card.append(image, info, actions);
    list.append(card);
  });
  updateControls();
}

bindFileDrop(document.getElementById('drop'), fileInput, files => {
  if (busy) return;
  const unsupported = [];
  for (const file of files) {
    if (!isSupportedImage(file)) { unsupported.push(file.name); continue; }
    items.push({ file, url: URL.createObjectURL(file), result: null, error: '' });
  }
  render();
  showMessage(message, unsupported.length ? `未添加 ${unsupported.join('、')}：仅支持 JPG、PNG 和 WebP。` : `已选择 ${items.length} 张图片`, unsupported.length ? 'error' : '');
});

function settingsChanged() {
  document.getElementById('qv').textContent = `${Math.round(Number(quality.value) * 100)}%`;
  document.getElementById('format-hint').textContent = format.value === 'image/png'
    ? 'PNG 保留透明度，使用无损编码；质量滑块不影响 PNG，可以缩小宽度来减小文件。'
    : format.value === 'image/jpeg'
      ? 'JPG 的透明区域使用白色背景。质量越低，通常文件越小。'
      : 'WebP 保留透明度。质量越低，通常文件越小。';
  const hadResults = items.some(item => item.result);
  items.forEach(item => { item.result = null; item.error = ''; });
  render();
  if (hadResults) showMessage(message, '参数已变更，请重新压缩图片。');
}
format.addEventListener('change', settingsChanged);
quality.addEventListener('input', settingsChanged);
maxWidth.addEventListener('input', settingsChanged);

list.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || busy) return;
  const index = Number(button.dataset.index);
  const item = items[index];
  if (!item) return;
  if (button.dataset.action === 'download' && item.result) downloadBlob(item.result.blob, item.result.name);
  if (button.dataset.action === 'remove') {
    URL.revokeObjectURL(item.url);
    items.splice(index, 1);
    render();
    showMessage(message, `已移除 ${item.file.name}`);
    (list.querySelector(`[data-index="${Math.min(index, items.length - 1)}"][data-action="remove"]`) || fileInput).focus();
  }
});

async function compress(item, settings) {
  const image = await decodeImage(item.url);
  const width = settings.maxWidth ? Math.min(settings.maxWidth, image.naturalWidth) : image.naturalWidth;
  const height = Math.max(1, Math.round(image.naturalHeight * width / image.naturalWidth));
  if (width > 16384 || height > 16384 || width * height > 67_108_864) throw new Error('输出图片过大，请设置更小的最大宽度');
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('此浏览器无法处理图片');
  if (settings.format === 'image/jpeg') {
    // JPEG has no alpha channel; use the documented white background.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(image, 0, 0, width, height);
  const blob = await canvasBlob(canvas, settings.format, settings.quality);
  const extension = settings.format.split('/')[1].replace('jpeg', 'jpg');
  const name = `${item.file.name.replace(/\.[^.]+$/, '')}_compressed.${extension}`;
  return { blob, name, width, height };
}

run.addEventListener('click', async () => {
  if (busy || !items.length || !maxWidth.reportValidity()) return;
  const token = ++operation;
  const selected = [...items];
  const settings = { format: format.value, quality: Number(quality.value), maxWidth: maxWidth.value === '' ? null : Number(maxWidth.value) };
  const usedNames = new Set();
  busy = true;
  items.forEach(item => { item.result = null; item.error = ''; });
  render();
  let completed = 0;
  for (const [index, item] of selected.entries()) {
    if (token !== operation) return;
    showMessage(message, `正在处理 ${index + 1} / ${selected.length}：${item.file.name}`);
    try {
      const result = await compress(item, settings);
      if (token !== operation) return;
      result.name = reserveFilename(result.name, usedNames);
      item.result = result;
      completed++;
    } catch (error) {
      if (token !== operation) return;
      item.error = error.message || '图片无法读取，请检查文件';
    }
    render();
  }
  if (token !== operation) return;
  busy = false;
  updateControls();
  const failed = selected.length - completed;
  showMessage(message, `完成 ${completed} / ${selected.length} 张${failed ? `，${failed} 张失败；ZIP 仅包含成功结果，请查看下方原因。` : '，可单独下载或打包下载。'}`, failed ? 'error' : 'success');
});

all.addEventListener('click', async () => {
  if (busy) return;
  const results = items.flatMap(item => item.result ? [item.result] : []);
  if (!results.length) return;
  const token = ++operation;
  busy = true;
  updateControls();
  showMessage(message, '正在打包压缩结果…');
  try {
    const zip = new JSZip();
    const names = new Set();
    results.forEach(result => zip.file(reserveFilename(result.name, names), result.blob));
    const blob = await zip.generateAsync({ type: 'blob' });
    if (token !== operation) return;
    downloadBlob(blob, 'images.zip');
    showMessage(message, `已打包 ${results.length} 张图片，开始下载 images.zip`, 'success');
  } catch (error) {
    if (token === operation) showMessage(message, `打包失败：${error.message}`, 'error');
  } finally {
    if (token === operation) { busy = false; updateControls(); }
  }
});

document.getElementById('clear').addEventListener('click', () => {
  operation++;
  busy = false;
  items.forEach(item => URL.revokeObjectURL(item.url));
  items = [];
  fileInput.value = '';
  render();
  showMessage(message, '已清空图片');
});

window.addEventListener('pagehide', event => {
  if (!event.persisted) items.forEach(item => URL.revokeObjectURL(item.url));
});
