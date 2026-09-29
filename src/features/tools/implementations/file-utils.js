// Shared by the file workbenches. Files stay in this browser; no upload is made.
export function bindFileDrop(drop, input, onFiles) {
  for (const name of ['dragenter', 'dragover']) {
    drop.addEventListener(name, event => {
      event.preventDefault();
      if (!input.disabled) drop.classList.add('hover');
    });
  }
  for (const name of ['dragleave', 'drop']) {
    drop.addEventListener(name, event => {
      event.preventDefault();
      drop.classList.remove('hover');
    });
  }
  drop.addEventListener('drop', event => {
    if (!input.disabled) onFiles(Array.from(event.dataTransfer?.files || []));
  });
  input.addEventListener('change', () => {
    const files = Array.from(input.files || []);
    input.value = '';
    if (files.length) onFiles(files);
  });
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  // Let the browser start reading the Blob before releasing its URL.
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function showMessage(element, text = '', type = '') {
  element.textContent = text;
  element.className = `msg ${type}`.trim();
}

export function isPdf(file) {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

export function isSupportedImage(file) {
  return /^image\/(jpeg|png|webp)$/.test(file.type) || (!file.type && /\.(jpe?g|png|webp)$/i.test(file.name));
}

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function reserveFilename(name, usedNames) {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const extension = dot > 0 ? name.slice(dot) : '';
  let candidate = name;
  let index = 2;
  while (usedNames.has(candidate)) candidate = `${base} (${index++})${extension}`;
  usedNames.add(candidate);
  return candidate;
}

export function actionButton(label, text, action, index, disabled = false) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'icon-btn';
  button.textContent = text;
  button.setAttribute('aria-label', label);
  button.title = label;
  button.dataset.action = action;
  button.dataset.index = String(index);
  button.disabled = disabled;
  return button;
}

export async function decodeImage(url) {
  const image = new Image();
  image.src = url;
  await image.decode();
  if (!image.naturalWidth || !image.naturalHeight) throw new Error('图片没有有效尺寸');
  return image;
}

export function canvasBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) reject(new Error('无法生成图片，请降低输出尺寸后重试'));
      else if (blob.type !== type) reject(new Error('浏览器不支持所选输出格式，请改选 PNG 或 JPG'));
      else resolve(blob);
    }, type, quality);
  });
}
