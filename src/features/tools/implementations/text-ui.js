export function showStatus(element, message = '', kind = '') {
  element.textContent = message;
  element.classList.remove('error', 'success');
  if (kind) element.classList.add(kind);
}

export async function copyText(value, status) {
  if (!value) { showStatus(status, '没有可复制的内容', 'error'); return; }
  try {
    await navigator.clipboard.writeText(value);
    showStatus(status, '已复制到剪贴板', 'success');
  } catch {
    showStatus(status, '复制失败，请手动选择内容复制，或允许浏览器访问剪贴板。', 'error');
  }
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
