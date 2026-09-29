import { describe, expect, it } from 'vitest';
import { analyzeText, csvToObjects, objectsToCSV, encodeText, decodeText, decodeBytes, parseTimestamp, parseDateInput, validateOffset } from './text-helpers';

describe('CSV conversion', () => {
  it('preserves escaped quotes, multiline cells, BOM and CRLF records', () => {
    const data = csvToObjects('\uFEFFname,note\r\n"张三","line 1\r\nline ""2"""\r\n李四,test\r\n');
    expect(data).toEqual([{ name: '张三', note: 'line 1\r\nline "2"' }, { name: '李四', note: 'test' }]);
    expect(csvToObjects(objectsToCSV(data))).toEqual(data);
  });
  it('rejects malformed data instead of silently dropping columns or values', () => {
    expect(() => csvToObjects('a,b\n"unclosed,1')).toThrow('双引号未闭合');
    expect(() => csvToObjects('a,b\n"closed"tail,1')).toThrow();
    expect(() => csvToObjects('a,a\n1,2')).toThrow('字段名不能重复');
    expect(() => csvToObjects('a,b\n1,2,3')).toThrow('列数');
    expect(() => objectsToCSV([null, 'value'])).toThrow('对象');
  });
  it('keeps special property names and serializes nested JSON values', () => {
    const special = csvToObjects('__proto__,constructor\nx,y');
    expect(Object.hasOwn(special[0], '__proto__')).toBe(true);
    expect(special[0].__proto__).toBe('x');
    expect(csvToObjects(objectsToCSV([{ nested: { a: 1 }, missing: null }]))).toEqual([{ nested: '{"a":1}', missing: '' }]);
  });
});

describe('Base64 conversion', () => {
  it('round-trips Chinese, emoji, and wrapped Base64/Data URLs', () => {
    const text = '你好，世界 🌏';
    expect(decodeText(encodeText(text))).toBe(text);
    expect(decodeText(`data:text/plain;base64,${encodeText(text)}\n`)).toBe(text);
  });
  it('rejects invalid Base64 and binary content in text mode', () => {
    expect(() => decodeBytes('@@@')).toThrow();
    expect(() => decodeText('/w==')).toThrow();
    expect([...decodeBytes('/w==')]).toEqual([255]);
  });
});

describe('timestamp conversion', () => {
  it('handles negative and fractional seconds with explicit millisecond override', () => {
    expect(parseTimestamp('-1').toISOString()).toBe('1969-12-31T23:59:59.000Z');
    expect(parseTimestamp('1700000000.123').getTime()).toBe(1700000000123);
    expect(parseTimestamp('1700000000123').getTime()).toBe(1700000000123);
    expect(parseTimestamp('1000', 'milliseconds').getTime()).toBe(1000);
    expect(parseTimestamp('0').getTime()).toBe(0);
  });
  it('rejects invalid and out of range values before formatting', () => {
    for (const text of ['', 'Infinity', '1e3', '0x123', '99999999999999999']) expect(() => parseTimestamp(text)).toThrow();
    expect(() => validateOffset('')).toThrow();
    expect(() => validateOffset('15')).toThrow();
    expect(validateOffset('5.75')).toBe(345);
  });
  it('interprets wall time in chosen offset without normalizing impossible dates', () => {
    expect(parseDateInput('2024-01-01T08:00', 480).toISOString()).toBe('2024-01-01T00:00:00.000Z');
    expect(parseDateInput('0099-01-01T00:00', 0).getUTCFullYear()).toBe(99);
    expect(() => parseDateInput('2024-02-30T12:00', 0)).toThrow('日期时间无效');
  });
});

describe('text statistics', () => {
  it('counts unicode characters without splitting emoji surrogate pairs', () => {
    const result = analyzeText('你好 🌏\n\nhello world');
    expect(result['字符数']).toBe([...('你好 🌏\n\nhello world')].length);
    expect(result['中文字数']).toBe(2);
    expect(result['英文单词']).toBe(2);
    expect(result['段落数']).toBe(2);
    expect(analyzeText('')['阅读时长']).toBe('0 秒');
  });
});
