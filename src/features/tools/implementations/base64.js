import '../workbench/init';
import './base64.css';
import { encodeText, decodeText, decodeBytes } from './text-helpers';
import { copyText, downloadBlob, showStatus } from './text-ui';

const $ = id => document.getElementById(id);
const status = $('status');
const tabs = [...document.querySelectorAll('[role="tab"]')];
function switchTab(tab) {
  tabs.forEach(button => {
    const selected = button === tab;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
    $(`tab-${button.dataset.tab}`).hidden = !selected;
  });
  showStatus(status);
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => switchTab(tab));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs.at(-1) : tabs[(index + 1) % tabs.length];
    switchTab(next); next.focus();
  });
});
function convert(decode = false) {
  $('text-output').value = '';
  try {
    if (!$('text-input').value) throw new Error('请输入内容');
    $('text-output').value = decode ? decodeText($('text-input').value) : encodeText($('text-input').value);
    showStatus(status, decode ? '解码成功' : '编码成功', 'success');
  } catch (error) {
    showStatus(status, decode ? '解码失败：请检查 Base64 格式；二进制内容请使用“文件”解码。' : error.message, 'error');
  }
}
$('encode').addEventListener('click', () => convert());
$('decode').addEventListener('click', () => convert(true));
$('copy-text').addEventListener('click', () => copyText($('text-output').value, status));
$('clear-text').addEventListener('click', () => {
  $('text-input').value = ''; $('text-output').value = ''; showStatus(status); $('text-input').focus();
});
$('text-input').addEventListener('input', () => { $('text-output').value = ''; showStatus(status); });
let fileVersion = 0;
$('file-input').addEventListener('change', () => {
  const file = $('file-input').files[0];
  const version = ++fileVersion;
  $('file-output').value = '';
  if (!file) { $('file-info').textContent = ''; return; }
  $('file-info').textContent = `${file.name} · ${(file.size / 1024).toFixed(2)} KB · ${file.type || '未知类型'}`;
  showStatus(status, '正在读取文件…');
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    if (version !== fileVersion) return;
    $('file-output').value = String(reader.result).split(',')[1] || '';
    $('mime-input').value = file.type || 'application/octet-stream';
    $('filename-input').value = file.name;
    showStatus(status, file.size ? '编码完成' : '文件为空，Base64 内容也为空。', 'success');
  });
  reader.addEventListener('error', () => { if (version === fileVersion) showStatus(status, '读取文件失败，请重新选择。', 'error'); });
  reader.readAsDataURL(file);
});
$('copy-file').addEventListener('click', () => copyText($('file-output').value, status));
$('download-text').addEventListener('click', () => {
  if (!$('file-output').value) { showStatus(status, '没有可下载的内容', 'error'); return; }
  downloadBlob(new Blob([$('file-output').value], { type: 'text/plain;charset=utf-8' }), 'base64.txt');
  showStatus(status, '已开始下载 base64.txt', 'success');
});
$('decode-file').addEventListener('click', () => {
  try {
    const bytes = decodeBytes($('b64-input').value);
    const type = $('mime-input').value.trim() || 'application/octet-stream';
    const filename = $('filename-input').value.trim() || 'decoded.bin';
    downloadBlob(new Blob([bytes], { type }), filename);
    showStatus(status, `已开始下载 ${filename}`, 'success');
  } catch { showStatus(status, '解码失败：请输入有效的 Base64 字符串', 'error'); }
});
