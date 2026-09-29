const PAGE_SIZES = { A4: [595.28, 841.89], Letter: [612, 792] };

/** Return zero-based pages in the exact order entered, preserving intentional repeats. */
export function parsePageRange(text, total) {
  if (!text.trim()) throw new Error('请输入页码范围');
  const indices = [];
  for (const segment of text.replace(/，/g, ',').split(',')) {
    const match = segment.trim().match(/^(\d+)\s*(?:-\s*(\d+))?$/);
    if (!match) throw new Error(`无效页码格式：${segment.trim() || '空白范围'}`);
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end > total) {
      throw new Error(`页码必须在 1–${total} 之间：${segment.trim()}`);
    }
    if (start > end) throw new Error(`范围起始页不能大于结束页：${segment.trim()}`);
    for (let page = start; page <= end; page++) indices.push(page - 1);
  }
  return indices;
}

export function imagePageLayout(width, height, size, orientation, margin) {
  if (!Number.isFinite(margin) || margin < 0 || margin > 200) throw new Error('边距需要是 0–200 pt 之间的数字');
  if (!(width > 0 && height > 0)) throw new Error('图片尺寸无效');
  let pageWidth;
  let pageHeight;
  if (size === 'original') {
    pageWidth = width + margin * 2;
    pageHeight = height + margin * 2;
  } else {
    const pageSize = PAGE_SIZES[size];
    if (!pageSize) throw new Error('请选择有效的页面尺寸');
    [pageWidth, pageHeight] = pageSize;
    if (orientation === 'landscape') [pageWidth, pageHeight] = [pageHeight, pageWidth];
  }
  const availableWidth = pageWidth - margin * 2;
  const availableHeight = pageHeight - margin * 2;
  if (availableWidth <= 0 || availableHeight <= 0) throw new Error('边距过大，页面没有可用空间');
  const scale = Math.min(availableWidth / width, availableHeight / height);
  const drawWidth = width * scale;
  const drawHeight = height * scale;
  return {
    pageWidth, pageHeight,
    x: (pageWidth - drawWidth) / 2,
    y: (pageHeight - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight,
  };
}

export function pdfReadError(error) {
  return /encrypt/i.test(String(error?.message))
    ? '此 PDF 已加密，请先使用密码解除保护，再重新选择文件。'
    : '无法读取 PDF，请确认文件未损坏且格式正确。';
}
