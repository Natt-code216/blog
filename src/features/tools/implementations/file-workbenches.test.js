import { readFileSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

const { download } = vi.hoisted(() => ({ download: vi.fn() }));
vi.mock('../workbench/init', () => ({}));
vi.mock('./file-utils', async importOriginal => ({
  ...await importOriginal(),
  downloadBlob: download,
}));

const png = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZr8AAAAASUVORK5CYII=', 'base64'));

function selectFiles(id, files) {
  const input = document.getElementById(id);
  Object.defineProperty(input, 'files', { configurable: true, value: files });
  fireEvent.change(input);
}

function fakeFile(name, bytes, type) {
  return { name, type, size: bytes.byteLength, arrayBuffer: async () => bytes.slice().buffer };
}

async function pdfFile(name, widths) {
  const pdf = await PDFDocument.create();
  widths.forEach(width => pdf.addPage([width, 500]));
  return fakeFile(name, await pdf.save(), 'application/pdf');
}

async function openTool(name) {
  const html = readFileSync(resolve(process.cwd(), 'mini-tools', `${name}.html`), 'utf8');
  document.body.innerHTML = html.match(/<body>([\s\S]*)<\/body>/)[1];
  if (name === 'pdf-merger') await import('./pdf-merger');
  if (name === 'pdf-splitter') await import('./pdf-splitter');
  if (name === 'image-to-pdf') await import('./image-to-pdf');
  if (name === 'image-compressor') await import('./image-compressor');
}

function readBlob(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  URL.createObjectURL = vi.fn(() => `blob:test-${Math.random()}`);
  URL.revokeObjectURL = vi.fn();
  vi.stubGlobal('Image', class {
    naturalWidth = 1;
    naturalHeight = 1;
    async decode() {}
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    fillRect: vi.fn(), drawImage: vi.fn(), fillStyle: '',
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (callback, type) {
    callback(new Blob([png], { type }));
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe('PDF file workbenches', () => {
  it('binds real file selection, reordering and merge download', async () => {
    await openTool('pdf-merger');
    selectFiles('input', [await pdfFile('first.pdf', [100, 200]), await pdfFile('second.pdf', [300])]);
    const merge = document.getElementById('merge');
    await waitFor(() => expect(merge).toBeEnabled());
    fireEvent.click(document.querySelector('[data-action="up"][data-index="1"]'));
    fireEvent.click(merge);
    await waitFor(() => expect(download).toHaveBeenCalledOnce());
    const [blob, filename] = download.mock.calls[0];
    const result = await PDFDocument.load(await readBlob(blob));
    expect(filename).toBe('merged.pdf');
    expect(result.getPages().map(page => page.getWidth())).toEqual([300, 100, 200]);
    fireEvent.click(document.getElementById('clear'));
    expect(document.querySelectorAll('.pdf-file-item')).toHaveLength(0);
    expect(merge).toBeDisabled();
  });

  it('does not resurrect a file if cleared while it is being read', async () => {
    await openTool('pdf-merger');
    const file = await pdfFile('slow.pdf', [100]);
    let finishRead;
    const bytes = await file.arrayBuffer();
    file.arrayBuffer = () => new Promise(resolve => { finishRead = resolve; });
    selectFiles('input', [file]);
    fireEvent.click(document.getElementById('clear'));
    finishRead(bytes);
    await new Promise(resolve => setTimeout(resolve, 25));
    expect(document.querySelectorAll('.pdf-file-item')).toHaveLength(0);
    expect(document.getElementById('merge')).toBeDisabled();
    expect(document.getElementById('msg')).toHaveTextContent('已清空文件');
  });

  it('recovers from invalid input and extracts the exact requested pages', async () => {
    await openTool('pdf-splitter');
    selectFiles('input', [fakeFile('broken.pdf', new Uint8Array([1, 2, 3]), 'application/pdf')]);
    await waitFor(() => expect(document.getElementById('msg')).toHaveTextContent('无法读取 PDF'));
    selectFiles('input', [await pdfFile('report.pdf', [100, 200, 300])]);
    const split = document.getElementById('split');
    await waitFor(() => expect(split).toBeEnabled());
    const range = document.getElementById('range');
    fireEvent.input(range, { target: { value: '1abc' } });
    fireEvent.click(split);
    expect(document.getElementById('msg')).toHaveTextContent('无效页码格式');
    expect(download).not.toHaveBeenCalled();
    fireEvent.input(range, { target: { value: '3, 1-2' } });
    fireEvent.click(split);
    await waitFor(() => expect(download).toHaveBeenCalledOnce());
    const [blob, name] = download.mock.calls[0];
    const result = await PDFDocument.load(await readBlob(blob));
    expect(name).toBe('report-split.pdf');
    expect(result.getPages().map(page => page.getWidth())).toEqual([300, 100, 200]);
  });
});

describe('image file workbenches', () => {
  it('generates a real PDF from PNG bytes and restores the empty state', async () => {
    await openTool('image-to-pdf');
    selectFiles('input', [fakeFile('pixel.png', png, 'image/png')]);
    const generate = document.getElementById('gen');
    await waitFor(() => expect(generate).toBeEnabled());
    document.getElementById('size').value = 'original';
    fireEvent.change(document.getElementById('size'));
    expect(document.getElementById('orient')).toBeDisabled();
    fireEvent.click(generate);
    await waitFor(() => expect(download).toHaveBeenCalledOnce());
    const [blob, filename] = download.mock.calls[0];
    const result = await PDFDocument.load(await readBlob(blob));
    expect(filename).toBe('images.pdf');
    expect(result.getPageCount()).toBe(1);
    expect(result.getPage(0).getSize()).toEqual({ width: 49, height: 49 });
    fireEvent.click(document.getElementById('clear'));
    expect(document.querySelectorAll('.image-thumb')).toHaveLength(0);
    expect(generate).toBeDisabled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('keeps filenames as text and includes both identically named images in ZIP', async () => {
    await openTool('image-compressor');
    const dangerousName = '<img onerror=alert(1)>.png';
    selectFiles('file', [fakeFile(dangerousName, png, 'image/png'), fakeFile(dangerousName, png, 'image/png')]);
    expect(document.querySelectorAll('.compression-name img')).toHaveLength(0);
    expect(document.querySelector('.compression-name')).toHaveTextContent(dangerousName);
    fireEvent.click(document.getElementById('run'));
    const all = document.getElementById('all');
    await waitFor(() => expect(all).toBeEnabled());
    fireEvent.click(all);
    await waitFor(() => expect(download).toHaveBeenCalledOnce());
    const [blob, filename] = download.mock.calls[0];
    const zip = await JSZip.loadAsync(await readBlob(blob));
    expect(filename).toBe('images.zip');
    expect(Object.keys(zip.files)).toEqual(['<img onerror=alert(1)>_compressed.jpg', '<img onerror=alert(1)>_compressed (2).jpg']);
    fireEvent.input(document.getElementById('q'), { target: { value: '0.5' } });
    expect(all).toBeDisabled();
    expect(document.getElementById('msg')).toHaveTextContent('参数已变更');
  });

  it('does not finish compression or offer stale downloads after clearing', async () => {
    await openTool('image-compressor');
    let finishBlob;
    HTMLCanvasElement.prototype.toBlob.mockImplementation(callback => { finishBlob = callback; });
    selectFiles('file', [fakeFile('pixel.png', png, 'image/png')]);
    fireEvent.click(document.getElementById('run'));
    await waitFor(() => expect(finishBlob).toBeTypeOf('function'));
    fireEvent.click(document.getElementById('clear'));
    finishBlob(new Blob([png], { type: 'image/jpeg' }));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(document.querySelectorAll('.compression-item')).toHaveLength(0);
    expect(document.getElementById('all')).toBeDisabled();
    expect(document.getElementById('run')).toBeDisabled();
    expect(download).not.toHaveBeenCalled();
  });
});
