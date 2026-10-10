import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Mesh, Scene, ShaderMaterial, Texture, TextureLoader, WebGLRenderer } from 'three';
import ArtworkScene from './ArtworkScene';
import LivingArtwork from './index';

const motion = vi.hoisted(() => ({ motionEnabled: true }));
vi.mock('../../../app/providers/MotionContext', () => ({ useMotion: () => motion }));

const gpu = vi.hoisted(() => ({ renderer: null as null | {
  domElement: HTMLCanvasElement;
  debug: { onShaderError?: () => void };
  setClearColor: ReturnType<typeof vi.fn>;
  setPixelRatio: ReturnType<typeof vi.fn>;
  setSize: ReturnType<typeof vi.fn>;
  render: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
  forceContextLoss: ReturnType<typeof vi.fn>;
}, load: vi.fn() }));

vi.mock('three', async () => ({
  ...await vi.importActual<typeof import('three')>('three'),
  WebGLRenderer: vi.fn(() => gpu.renderer),
  TextureLoader: vi.fn(() => ({ load: gpu.load })),
}));

const src = '/images/cosmic-starry-field.webp';
let requests: Array<{ texture: Texture; loaded: (texture: Texture) => void; failed: () => void }>;
let frames: Map<number, FrameRequestCallback>;
let intersect: ((entries: Array<{ isIntersecting: boolean }>) => void) | undefined;
let resize: (() => void) | undefined;
const disconnectResize = vi.fn();
const disconnectIntersection = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  motion.motionEnabled = true;
  requests = [];
  frames = new Map();
  intersect = undefined;
  resize = undefined;
  let nextFrame = 0;
  gpu.renderer = {
    domElement: document.createElement('canvas'), debug: {},
    setClearColor: vi.fn(), setPixelRatio: vi.fn(), setSize: vi.fn(),
    render: vi.fn(), dispose: vi.fn(), forceContextLoss: vi.fn(),
  };
  vi.mocked(WebGLRenderer).mockImplementation(() => gpu.renderer as unknown as WebGLRenderer);
  gpu.load.mockImplementation((_src: string, loaded: (texture: Texture) => void, _progress: unknown, failed: () => void) => {
    const texture = new Texture();
    texture.image = { width: 1586, height: 992 };
    requests.push({ texture, loaded, failed });
    return texture;
  });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 600, height: 400, x: 0, y: 0, top: 0, right: 600, bottom: 400, left: 0, toJSON: () => ({}),
  });
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    const id = ++nextFrame;
    frames.set(id, callback);
    return id;
  }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => frames.delete(id)));
  vi.stubGlobal('devicePixelRatio', 3);
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { resize = callback; }
    observe() {}
    disconnect = disconnectResize;
  });
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: typeof intersect) { intersect = callback; }
    observe() { intersect?.([{ isIntersecting: true }]); }
    disconnect = disconnectIntersection;
  });
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function finishTexture(index = 0) {
  act(() => requests[index].loaded(requests[index].texture));
}

function tick(time: number) {
  const next = frames.entries().next().value as [number, FrameRequestCallback] | undefined;
  if (!next) throw new Error('No scheduled animation frame');
  frames.delete(next[0]);
  act(() => next[1](time));
}

function currentUniforms() {
  const scene = gpu.renderer?.render.mock.lastCall?.[0] as Scene;
  return ((scene.children[0] as Mesh).material as ShaderMaterial).uniforms;
}

describe('ArtworkScene texture, motion and resource lifecycle', () => {
  it.each(['stars', 'sunflower', 'water'] as const)('waits for the texture, then renders a correctly covered still %s painting', variant => {
    const onReady = vi.fn();
    render(<ArtworkScene src={src} variant={variant} playing={false} onReady={onReady} />);
    expect(gpu.renderer?.render).not.toHaveBeenCalled();
    expect(onReady).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);

    finishTexture();
    expect(gpu.renderer?.render).toHaveBeenCalledTimes(1);
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
    expect(gpu.renderer?.setPixelRatio).toHaveBeenLastCalledWith(1.25);
    expect(currentUniforms().uCover.value.x).toBeCloseTo(1.5 / (1586 / 992));
    expect(currentUniforms().uCover.value.y).toBe(1);
    act(() => resize?.());
    expect(gpu.renderer?.render).toHaveBeenCalledTimes(2);
    expect(frames.size).toBe(0);
  });

  it('advances real shader time and pauses without reloading the texture or recreating the renderer', () => {
    const { rerender } = render(<ArtworkScene src={src} variant="stars" playing />);
    finishTexture();
    tick(100);
    tick(140);
    const time = currentUniforms().uTime.value as number;
    expect(time).toBeGreaterThan(0);

    rerender(<ArtworkScene src={src} variant="stars" playing={false} />);
    expect(frames.size).toBe(0);
    expect(currentUniforms().uTime.value).toBe(time);
    rerender(<ArtworkScene src={src} variant="water" intensity={0.8} playing />);
    expect(currentUniforms().uVariant.value).toBe(2);
    expect(currentUniforms().uIntensity.value).toBe(0.8);
    expect(frames.size).toBe(1);
    tick(5000);
    expect(currentUniforms().uTime.value).toBe(time);
    tick(5040);
    expect(currentUniforms().uTime.value).toBeCloseTo(time + 0.04);
    expect(WebGLRenderer).toHaveBeenCalledTimes(1);
    expect(TextureLoader).toHaveBeenCalledTimes(1);
  });

  it('suspends GPU work offscreen and in background tabs, including resize renders', () => {
    render(<ArtworkScene src={src} variant="water" playing />);
    finishTexture();
    expect(frames.size).toBe(1);
    act(() => intersect?.([{ isIntersecting: false }]));
    expect(frames.size).toBe(0);
    const count = gpu.renderer?.render.mock.calls.length;
    act(() => resize?.());
    expect(gpu.renderer?.render).toHaveBeenCalledTimes(count!);
    act(() => intersect?.([{ isIntersecting: true }]));
    expect(frames.size).toBe(1);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(frames.size).toBe(0);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(frames.size).toBe(1);
    expect(WebGLRenderer).toHaveBeenCalledTimes(1);
  });

  it('releases the texture and context on unmount, and safely ignores its late image load', () => {
    const onReady = vi.fn();
    const { unmount } = render(<ArtworkScene src={src} variant="sunflower" playing onReady={onReady} />);
    const textureDisposed = vi.spyOn(requests[0].texture, 'dispose');
    unmount();
    finishTexture();
    expect(textureDisposed).toHaveBeenCalledTimes(1);
    expect(gpu.renderer?.dispose).toHaveBeenCalledTimes(1);
    expect(gpu.renderer?.forceContextLoss).toHaveBeenCalledTimes(1);
    expect(onReady).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
    expect(disconnectResize).toHaveBeenCalledTimes(1);
    expect(disconnectIntersection).toHaveBeenCalledTimes(1);
  });

  it('returns to the static fallback after texture failure or context loss', () => {
    const onUnavailable = vi.fn();
    const onReady = vi.fn();
    const { container, unmount } = render(<ArtworkScene src={src} variant="stars" playing onReady={onReady} onUnavailable={onUnavailable} />);
    act(() => requests[0].failed());
    expect(onUnavailable).toHaveBeenCalledTimes(1);
    expect(onReady).not.toHaveBeenCalled();
    expect(container.querySelector('canvas')).toBeNull();
    finishTexture();
    expect(onReady).not.toHaveBeenCalled();
    unmount();

    const second = render(<ArtworkScene src={src} variant="water" playing onUnavailable={onUnavailable} />);
    finishTexture(1);
    act(() => second.container.querySelector('canvas')?.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
    expect(onUnavailable).toHaveBeenCalledTimes(2);
    expect(second.container.querySelector('canvas')).toBeNull();
    expect(frames.size).toBe(0);
  });

  it('does not hide the static painting when shader compilation fails', async () => {
    gpu.renderer?.render.mockImplementationOnce(() => gpu.renderer?.debug.onShaderError?.());
    const onReady = vi.fn();
    const onUnavailable = vi.fn();
    render(<ArtworkScene src={src} variant="stars" playing onReady={onReady} onUnavailable={onUnavailable} />);
    finishTexture();
    await act(async () => { await Promise.resolve(); });
    expect(onReady).not.toHaveBeenCalled();
    expect(onUnavailable).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it('falls back when WebGL initialization is unavailable', () => {
    vi.mocked(WebGLRenderer).mockImplementationOnce(() => { throw new Error('No WebGL'); });
    const onUnavailable = vi.fn();
    render(<ArtworkScene src={src} variant="stars" playing onUnavailable={onUnavailable} />);
    expect(onUnavailable).toHaveBeenCalledTimes(1);
    expect(gpu.load).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });
});

describe('LivingArtwork progressive enhancement', () => {
  it('keeps inactive or motion-disabled artworks as images until explicitly activated', async () => {
    const { container, rerender } = render(<LivingArtwork src={src} variant="stars" active={false} className="custom-frame" />);
    expect(container.querySelector('img')).toHaveAttribute('src', src);
    expect(container.firstChild).toHaveClass('custom-frame');
    expect(WebGLRenderer).not.toHaveBeenCalled();

    motion.motionEnabled = false;
    rerender(<LivingArtwork src={src} variant="stars" active />);
    expect(WebGLRenderer).not.toHaveBeenCalled();
    motion.motionEnabled = true;
    rerender(<LivingArtwork src={src} variant="stars" active />);
    await waitFor(() => expect(WebGLRenderer).toHaveBeenCalledTimes(1));
    finishTexture();
    expect(frames.size).toBe(1);

    rerender(<LivingArtwork src={src} variant="stars" active={false} />);
    expect(frames.size).toBe(0);
    expect(WebGLRenderer).toHaveBeenCalledTimes(1);
    expect(container.querySelector('img')).toHaveAttribute('src', src);
    rerender(<LivingArtwork src={src} variant="stars" active />);
    expect(frames.size).toBe(1);
    expect(WebGLRenderer).toHaveBeenCalledTimes(1);
  });

  it('retains the static painting when its WebGL texture fails', async () => {
    const { container } = render(<LivingArtwork src={src} variant="stars" />);
    await waitFor(() => expect(requests).toHaveLength(1));
    const painting = container.querySelector('img');
    act(() => requests[0].failed());
    expect(container.querySelector('canvas')).toBeNull();
    expect(painting).toHaveAttribute('src', src);
    expect(painting).toBeInTheDocument();
    expect(frames.size).toBe(0);
  });
});
