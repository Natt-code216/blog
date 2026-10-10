import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WebGLRenderer } from 'three';
import OrbitalScene from './OrbitalScene';

const gpu = vi.hoisted(() => ({
  renderer: null as null | {
    domElement: HTMLCanvasElement;
    debug: { onShaderError?: () => void };
    setClearColor: ReturnType<typeof vi.fn>;
    setPixelRatio: ReturnType<typeof vi.fn>;
    setSize: ReturnType<typeof vi.fn>;
    render: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
  },
}));

vi.mock('three', async () => {
  const actual = await vi.importActual<typeof import('three')>('three');
  return { ...actual, WebGLRenderer: vi.fn(() => gpu.renderer) };
});

let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let resize: (() => void) | undefined;
let intersect: ((entries: Array<{ isIntersecting: boolean }>) => void) | undefined;
const disconnectResize = vi.fn();
const disconnectIntersection = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  frames = new Map();
  nextFrame = 1;
  resize = undefined;
  intersect = undefined;
  gpu.renderer = {
    domElement: document.createElement('canvas'),
    debug: {},
    setClearColor: vi.fn(),
    setPixelRatio: vi.fn(),
    setSize: vi.fn(),
    render: vi.fn(),
    dispose: vi.fn(),
  };
  vi.mocked(WebGLRenderer).mockImplementation(() => gpu.renderer as unknown as WebGLRenderer);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 640, height: 640, x: 0, y: 0, top: 0, right: 640, bottom: 640, left: 0,
    toJSON: () => ({}),
  });
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    const id = nextFrame++;
    frames.set(id, callback);
    return id;
  }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => frames.delete(id)));
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { resize = callback; }
    observe() {}
    disconnect = disconnectResize;
  });
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: typeof intersect) { intersect = callback; }
    observe() {}
    disconnect = disconnectIntersection;
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('OrbitalScene resource and motion lifecycle', () => {
  it('renders a still frame with motion disabled and permits a resize without a loop', () => {
    const onReady = vi.fn();
    render(<OrbitalScene playing={false} onReady={onReady} />);

    expect(gpu.renderer?.render).toHaveBeenCalledTimes(1);
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);

    act(() => resize?.());
    expect(gpu.renderer?.render).toHaveBeenCalledTimes(2);
    expect(frames.size).toBe(0);
  });

  it('pauses and resumes without allocating another renderer', () => {
    const { rerender } = render(<OrbitalScene playing />);
    expect(frames.size).toBe(1);

    rerender(<OrbitalScene playing={false} />);
    expect(frames.size).toBe(0);

    rerender(<OrbitalScene playing />);
    expect(frames.size).toBe(1);
    expect(WebGLRenderer).toHaveBeenCalledTimes(1);
  });

  it('suspends animation when offscreen or when the document is hidden', () => {
    render(<OrbitalScene playing />);
    act(() => intersect?.([{ isIntersecting: false }]));
    expect(frames.size).toBe(0);
    act(() => intersect?.([{ isIntersecting: true }]));
    expect(frames.size).toBe(1);

    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(frames.size).toBe(0);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(frames.size).toBe(1);
  });

  it('returns to the fallback and releases resources after WebGL context loss', () => {
    const onUnavailable = vi.fn();
    const { container, unmount } = render(<OrbitalScene playing onUnavailable={onUnavailable} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();

    act(() => canvas?.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
    expect(onUnavailable).toHaveBeenCalledTimes(1);
    expect(gpu.renderer?.dispose).toHaveBeenCalledTimes(1);
    expect(disconnectResize).toHaveBeenCalledTimes(1);
    expect(disconnectIntersection).toHaveBeenCalledTimes(1);
    expect(container.querySelector('canvas')).toBeNull();
    expect(frames.size).toBe(0);

    unmount();
    expect(gpu.renderer?.dispose).toHaveBeenCalledTimes(1);
  });

  it('reports unavailable when WebGL cannot initialize', () => {
    vi.mocked(WebGLRenderer).mockImplementationOnce(() => { throw new Error('WebGL unavailable'); });
    const onReady = vi.fn();
    const onUnavailable = vi.fn();
    render(<OrbitalScene playing onReady={onReady} onUnavailable={onUnavailable} />);
    expect(onUnavailable).toHaveBeenCalledTimes(1);
    expect(onReady).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });

  it('does not mark a failed shader render as ready', async () => {
    gpu.renderer?.render.mockImplementationOnce(() => gpu.renderer?.debug.onShaderError?.());
    const onReady = vi.fn();
    const onUnavailable = vi.fn();
    render(<OrbitalScene playing={false} onReady={onReady} onUnavailable={onUnavailable} />);
    await act(async () => { await Promise.resolve(); });
    expect(onReady).not.toHaveBeenCalled();
    expect(onUnavailable).toHaveBeenCalledTimes(1);
    expect(gpu.renderer?.dispose).toHaveBeenCalledTimes(1);
  });
});
