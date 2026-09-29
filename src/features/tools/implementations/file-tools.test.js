import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { parsePageRange, imagePageLayout } from './pdf-utils';
import { reserveFilename } from './file-utils';

describe('PDF page extraction', () => {
  it('extracts ranges in the requested order, including repeated pages', async () => {
    const source = await PDFDocument.create();
    [100, 200, 300, 400].forEach(width => source.addPage([width, 500]));
    const output = await PDFDocument.create();
    const pages = await output.copyPages(source, parsePageRange('4， 1-2, 2', 4));
    pages.forEach(page => output.addPage(page));
    const reopened = await PDFDocument.load(await output.save());
    expect(reopened.getPages().map(page => page.getWidth())).toEqual([400, 100, 200, 200]);
  });

  it('rejects partially parsed, reversed and out-of-range page numbers', () => {
    for (const value of ['1abc', '1.5', '1-2-3', '0', '5', '3-1', '1,', '', '1,,2']) {
      expect(() => parsePageRange(value, 4), value).toThrow();
    }
  });
});

describe('image PDF layout', () => {
  it('fits landscape images inside margins without distortion', () => {
    const page = imagePageLayout(2000, 1000, 'A4', 'landscape', 24);
    expect(page.pageWidth).toBe(841.89);
    expect(page.x).toBeCloseTo(24);
    expect(page.y).toBeGreaterThanOrEqual(24);
    expect(page.width / page.height).toBe(2);
  });

  it('keeps original image size and rejects invalid margins', () => {
    expect(imagePageLayout(300, 200, 'original', 'landscape', 10)).toEqual({
      pageWidth: 320, pageHeight: 220, x: 10, y: 10, width: 300, height: 200,
    });
    for (const margin of [-10, NaN, Infinity, 300]) {
      expect(() => imagePageLayout(300, 200, 'A4', 'portrait', margin)).toThrow();
    }
  });
});

it('preserves every image when source names collide in a ZIP', () => {
  const names = new Set();
  expect(['photo.jpg', 'photo.jpg', 'photo (2).jpg', 'photo.jpg'].map(name => reserveFilename(name, names)))
    .toEqual(['photo.jpg', 'photo (2).jpg', 'photo (2) (2).jpg', 'photo (3).jpg']);
});
