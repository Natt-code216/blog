import '../workbench/init';
import './qrcode.css';
import QRCode from 'qrcode';
import { downloadBlob, showStatus } from './text-ui';

const $ = id => document.getElementById(id);
const canvas = $('qr');
const status = $('msg');
let valid = false;
let version = 0;
function setReady(ready) {
  valid = ready;
  $('dl').disabled = !ready;
  $('cp').disabled = !ready;
  canvas.hidden = !ready;
  $('qr-empty').hidden = ready;
}
async function generate() {
  const current = ++version;
  setReady(false);
  const text = $('text').value;
  if (!text.trim()) { showStatus(status, '请输入需要生成二维码的内容'); return; }
  if ($('fg').value === $('bg').value) {
    showStatus(status, '前景色和背景色不能相同，请选择有明显对比的颜色。', 'error'); return;
  }
  try {
    await QRCode.toCanvas(canvas, text, {
      width: Number($('size').value), errorCorrectionLevel: $('lvl').value,
      color: { dark: $('fg').value, light: $('bg').value }, margin: 4,
    });
    if (current !== version) return;
    setReady(true); showStatus(status);
  } catch {
    if (current === version) showStatus(status, '生成失败：内容可能过长，请缩短文本或降低纠错等级。', 'error');
  }
}
['text', 'size', 'lvl', 'fg', 'bg'].forEach(id => $(id).addEventListener('input', generate));
$('dl').addEventListener('click', () => {
  if (!valid) return;
  canvas.toBlob(blob => {
    if (!blob) { showStatus(status, '图片生成失败，请重试', 'error'); return; }
    downloadBlob(blob, 'qrcode.png');
    showStatus(status, '已开始下载 qrcode.png', 'success');
  }, 'image/png');
});
$('cp').addEventListener('click', async () => {
  if (!valid) return;
  try {
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') throw new Error('unsupported');
    const blob = new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('empty')), 'image/png'));
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    showStatus(status, '已复制图片到剪贴板', 'success');
  } catch { showStatus(status, '当前浏览器未能复制图片，请使用“下载 PNG”。', 'error'); }
});
generate();
