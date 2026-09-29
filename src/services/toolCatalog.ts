export interface LocalTool {
  id: string;
  title: string;
  description: string;
  href: string;
  category: 'files' | 'data' | 'daily';
}

/** Single catalog for the homepage, search and the tool directory. URLs remain independent of the CMS. */
export const localTools: LocalTool[] = [
  { id: 'json-formatter', category: 'data', title: 'JSON 格式化', description: '格式化、压缩、校验 JSON 字符串。', href: '/mini-tools/json-formatter.html' },
  { id: 'markdown-html', category: 'data', title: 'Markdown → HTML', description: '一边写一边实时预览，导出 HTML 源码。', href: '/mini-tools/markdown-html.html' },
  { id: 'image-compressor', category: 'files', title: '图片压缩 / 转换', description: 'JPG、PNG、WebP 图片互转，质量与尺寸可调。', href: '/mini-tools/image-compressor.html' },
  { id: 'pdf-merger', category: 'files', title: 'PDF 合并', description: '把多个 PDF 拼成一份，可调整顺序。', href: '/mini-tools/pdf-merger.html' },
  { id: 'pdf-splitter', category: 'files', title: 'PDF 拆分', description: '按页码范围抽取，得到一份新 PDF。', href: '/mini-tools/pdf-splitter.html' },
  { id: 'image-to-pdf', category: 'files', title: '图片转 PDF', description: '把多张图片合成一份 PDF，可设页面尺寸。', href: '/mini-tools/image-to-pdf.html' },
  { id: 'csv-json', category: 'data', title: 'CSV ↔ JSON', description: '表格数据与 JSON 互转，可下载文件。', href: '/mini-tools/csv-json.html' },
  { id: 'base64', category: 'data', title: 'Base64 编解码', description: '文本与文件双向转换，支持中文。', href: '/mini-tools/base64.html' },
  { id: 'qrcode', category: 'daily', title: '二维码生成', description: '文本或链接生成 QR Code，可定制色彩。', href: '/mini-tools/qrcode.html' },
  { id: 'word-counter', category: 'daily', title: '文本字数统计', description: '中英文字数、阅读时长一站统计。', href: '/mini-tools/word-counter.html' },
  { id: 'timestamp', category: 'daily', title: '时间戳转换', description: 'Unix 时间戳与日期双向互转，含时区。', href: '/mini-tools/timestamp.html' },
];

export const toolboxHref = '/mini-tools/index.html';
