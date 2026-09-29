import '../workbench/init';
import './image-to-pdf.css';
import { PDFDocument } from 'pdf-lib';
import { actionButton, bindFileDrop, canvasBlob, decodeImage, downloadBlob, isSupportedImage, showMessage } from './file-utils';
import { imagePageLayout } from './pdf-utils';

const input = document.getElementById('input');
const grid = document.getElementById('grid');
const generate = document.getElementById('gen');
const message = document.getElementById('msg');
const size = document.getElementById('size');
const orientation = document.getElementById('orient');
const margin = document.getElementById('margin');
let items = [];
let busy = false;
let operation = 0;

function updateControls() {
  input.disabled = busy;
  size.disabled = busy;
  orientation.disabled = busy || size.value === 'original';
  margin.disabled = busy;
  generate.disabled = busy || !items.length;
  grid.querySelectorAll('button').forEach(button => {
    const index = Number(button.dataset.index);
    button.disabled = busy || (button.dataset.action === 'up' && index === 0)
      || (button.dataset.action === 'down' && index === items.length - 1);
  });
  document.getElementById('drop').setAttribute('aria-busy', String(busy));
}

function render() {
  grid.replaceChildren();
  items.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'image-thumb';
    const image = document.createElement('img');
    image.src = item.url;
    image.alt = `第 ${index + 1} 页：${item.name}`;
    const name = document.createElement('p');
    name.className = 'image-name';
    name.textContent = `${index + 1}. ${item.name}`;
    name.title = item.name;
    const actions = document.createElement('div');
    actions.className = 'image-actions';
    actions.append(
      actionButton(`上移 ${item.name}`, '↑', 'up', index),
      actionButton(`下移 ${item.name}`, '↓', 'down', index),
      actionButton(`移除 ${item.name}`, '×', 'remove', index),
    );
    card.append(image, name, actions);
    grid.append(card);
  });
  updateControls();
}

async function addFiles(files) {
  if (busy || !files.length) return;
  const token = ++operation;
  busy = true;
  updateControls();
  showMessage(message, '正在读取图片…');
  const errors = [];
  for (const file of files) {
    if (!isSupportedImage(file)) { errors.push(`${file.name}：仅支持 JPG、PNG 和 WebP`); continue; }
    const url = URL.createObjectURL(file);
    try {
      const [buffer] = await Promise.all([file.arrayBuffer(), decodeImage(url)]);
      if (token !== operation) { URL.revokeObjectURL(url); return; }
      const type = file.type || (/\.png$/i.test(file.name) ? 'image/png' : /\.webp$/i.test(file.name) ? 'image/webp' : 'image/jpeg');
      items.push({ name: file.name, buffer, type, url });
    } catch {
      URL.revokeObjectURL(url);
      errors.push(`${file.name}：无法读取图片`);
    }
    if (token !== operation) return;
  }
  if (token !== operation) return;
  busy = false;
  render();
  showMessage(message, errors.length ? errors.join('；') : `已选择 ${items.length} 张图片`, errors.length ? 'error' : '');
}

bindFileDrop(document.getElementById('drop'), input, addFiles);
size.addEventListener('change', updateControls);
grid.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || busy) return;
  const index = Number(button.dataset.index);
  const action = button.dataset.action;
  if (action === 'up' && index > 0) [items[index - 1], items[index]] = [items[index], items[index - 1]];
  if (action === 'down' && index < items.length - 1) [items[index + 1], items[index]] = [items[index], items[index + 1]];
  if (action === 'remove') URL.revokeObjectURL(items.splice(index, 1)[0].url);
  render();
  const nextIndex = action === 'up' ? index - 1 : action === 'down' ? index + 1 : Math.min(index, items.length - 1);
  grid.querySelector(`[data-index="${nextIndex}"][data-action="${action}"]`)?.focus();
});

document.getElementById('clear').addEventListener('click', () => {
  operation++;
  busy = false;
  items.forEach(item => URL.revokeObjectURL(item.url));
  items = [];
  input.value = '';
  render();
  showMessage(message, '已清空图片');
});

generate.addEventListener('click', async () => {
  if (busy || !items.length) return;
  if (!margin.reportValidity()) return;
  const token = ++operation;
  const settings = { size: size.value, orientation: orientation.value, margin: Number(margin.value) };
  const selected = [...items];
  busy = true;
  updateControls();
  showMessage(message, '正在生成 PDF…');
  try {
    const pdf = await PDFDocument.create();
    for (const item of selected) {
      let image;
      if (item.type === 'image/png') image = await pdf.embedPng(item.buffer);
      else if (item.type === 'image/jpeg') image = await pdf.embedJpg(item.buffer);
      else {
        const decoded = await decodeImage(item.url);
        if (token !== operation) return;
        const canvas = document.createElement('canvas');
        canvas.width = decoded.naturalWidth;
        canvas.height = decoded.naturalHeight;
        canvas.getContext('2d').drawImage(decoded, 0, 0);
        const blob = await canvasBlob(canvas, 'image/png');
        image = await pdf.embedPng(await blob.arrayBuffer());
      }
      if (token !== operation) return;
      const { pageWidth, pageHeight, ...placement } = imagePageLayout(image.width, image.height, settings.size, settings.orientation, settings.margin);
      pdf.addPage([pageWidth, pageHeight]).drawImage(image, placement);
    }
    const bytes = await pdf.save();
    if (token !== operation) return;
    downloadBlob(new Blob([bytes], { type: 'application/pdf' }), 'images.pdf');
    showMessage(message, `已生成 ${selected.length} 页，开始下载 images.pdf`, 'success');
  } catch (error) {
    if (token === operation) showMessage(message, `生成失败：${error.message}`, 'error');
  } finally {
    if (token === operation) { busy = false; updateControls(); }
  }
});

window.addEventListener('pagehide', event => {
  if (!event.persisted) items.forEach(item => URL.revokeObjectURL(item.url));
});
