/** Conversion helpers are independent of page DOM so edge cases stay testable. */
export function parseCSV(source) {
  const text = source.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], value = '', quoted = false, closed = false;
  const field = () => { row.push(value); value = ''; closed = false; };
  const record = () => { field(); rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { value += '"'; i++; }
        else { quoted = false; closed = true; }
      } else value += char;
      continue;
    }
    if (closed && ![',', '\r', '\n'].includes(char)) throw new Error('引号结束后只能是逗号或换行');
    if (char === '"') {
      if (value) throw new Error('字段内部的双引号需要转义');
      quoted = true;
    } else if (char === ',') field();
    else if (char === '\r' || char === '\n') {
      record();
      if (char === '\r' && text[i + 1] === '\n') i++;
    } else value += char;
  }
  if (quoted) throw new Error('双引号未闭合');
  if (value || row.length || closed) record();
  return rows;
}

export function csvToObjects(text) {
  const rows = parseCSV(text);
  if (!rows.length) throw new Error('CSV 为空');
  const headers = rows.shift();
  if (headers.some(header => !header.trim())) throw new Error('字段名不能为空');
  if (new Set(headers).size !== headers.length) throw new Error('字段名不能重复');
  return rows.filter(row => !(row.length === 1 && row[0] === '')).map((row, i) => {
    if (row.length !== headers.length) throw new Error(`第 ${i + 2} 条记录的列数与表头不一致`);
    return Object.fromEntries(headers.map((header, index) => [header, row[index]]));
  });
}

export function objectsToCSV(data) {
  if (!Array.isArray(data) || data.some(item => !item || typeof item !== 'object' || Array.isArray(item))) {
    throw new Error('JSON 需要是对象组成的数组');
  }
  if (!data.length) return '';
  const keys = [...new Set(data.flatMap(item => Object.keys(item)))];
  if (!keys.length) throw new Error('对象需要至少一个字段');
  const escape = value => {
    const text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    return /[",\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  };
  return [keys.map(escape).join(','), ...data.map(item => keys.map(key => escape(item[key])).join(','))].join('\r\n');
}

export function encodeText(text) {
  return btoa(Array.from(new TextEncoder().encode(text), byte => String.fromCharCode(byte)).join(''));
}

export function decodeBytes(value) {
  const source = value.trim().replace(/^data:[^,]*;base64,/i, '').replace(/\s/g, '');
  if (!source || !/^[A-Za-z0-9+/]*={0,2}$/.test(source)) throw new Error('无效的 Base64 字符串');
  return Uint8Array.from(atob(source), char => char.charCodeAt(0));
}

export function decodeText(value) {
  return new TextDecoder('utf-8', { fatal: true }).decode(decodeBytes(value));
}

export function analyzeText(text) {
  const cjk = (text.match(/\p{Script=Han}/gu) || []).length;
  const words = (text.match(/[a-zA-Z]+(?:['’-][a-zA-Z]+)*/g) || []).length;
  const minutes = cjk / 300 + words / 200;
  return {
    '字符数': [...text].length,
    '字符（不含空白）': [...text.replace(/\s/g, '')].length,
    '中文字数': cjk,
    '英文单词': words,
    '行数': text === '' ? 0 : text.split(/\r\n|\r|\n/).length,
    '段落数': text.trim() === '' ? 0 : text.trim().split(/(?:\r?\n|\r)\s*(?:\r?\n|\r)/).length,
    '阅读时长': minutes < 1 ? `${Math.ceil(minutes * 60)} 秒` : `${Math.ceil(minutes)} 分钟`,
  };
}

export function parseTimestamp(value, unit = 'auto') {
  const text = value.trim();
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(text)) throw new Error('请输入有效的十进制时间戳');
  const number = Number(text);
  const seconds = unit === 'seconds' || (unit === 'auto' && Math.abs(number) < 1e11);
  const date = new Date(seconds ? number * 1000 : number);
  if (!Number.isFinite(date.getTime())) throw new Error('时间戳超出可转换范围');
  return date;
}

export function validateOffset(value) {
  const offset = Number(value);
  if (!String(value).trim() || !Number.isFinite(offset) || offset < -12 || offset > 14 || !Number.isInteger(offset * 60)) {
    throw new Error('时区偏移须为 -12 到 +14 小时，并精确到分钟');
  }
  return offset * 60;
}

export function parseDateInput(value, offsetMinutes = null) {
  const match = /^(\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(value);
  if (!match) throw new Error('请选择有效的日期时间');
  const [, y, m, d, h, min, sec = '0', fraction = '0'] = match;
  const parts = [Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(sec), Number(fraction.padEnd(3, '0'))];
  // Construct through setters so years 0001–0099 do not become 1901–1999.
  const wallTime = new Date(0);
  wallTime.setUTCFullYear(parts[0], parts[1], parts[2]);
  wallTime.setUTCHours(parts[3], parts[4], parts[5], parts[6]);
  if (wallTime.getUTCFullYear() !== parts[0] || wallTime.getUTCMonth() !== parts[1] || wallTime.getUTCDate() !== parts[2] || parts[3] > 23 || parts[4] > 59 || parts[5] > 59) throw new Error('日期时间无效');
  if (offsetMinutes !== null) return new Date(wallTime.getTime() - offsetMinutes * 60000);
  const localTime = new Date(0);
  localTime.setFullYear(parts[0], parts[1], parts[2]);
  localTime.setHours(parts[3], parts[4], parts[5], parts[6]);
  if (localTime.getHours() !== parts[3] || localTime.getMinutes() !== parts[4]) throw new Error('此时间在本地时区不存在，请检查夏令时切换');
  return localTime;
}
