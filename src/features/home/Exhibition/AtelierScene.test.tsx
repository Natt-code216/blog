import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BufferGeometry, Material, WebGLRenderer, type Scene } from 'three';
import AtelierScene from './AtelierScene';

const gpu = vi.hoisted(() => ({ renderer: null as null | {
  domElement: HTMLCanvasElement;
  debug: { onShaderError?: () => void };
  setClearColor: ReturnType<typeof vi.fn>;
  setPixelRatio: ReturnType<typeof vi.fn>;
  setSize: ReturnType<typeof vi.fn>;
  render: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
} }));

vi.mock('three', async () => ({
  ...await vi.importActual<typeof import('three')>('three'),
  WebGLRenderer: vi.fn(() => gpu.renderer),
}));

let frames: Map<number, FrameRequestCallback>;
let intersect: ((entries: Array<{ isIntersecting: boolean }>) => void) | undefined;
const disconnectResize = vi.fn();
const disconnectIntersection = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  frames = new Map();
  intersect = undefined;
  let nextFrame = 0;
  gpu.renderer = {
    domElement: document.createElement('canvas'), debug: {},
    setClearColor: vi.fn(), setPixelRatio: vi.fn(), setSize: vi.fn(), render: vi.fn(), dispose: vi.fn(),
  };
  vi.mocked(WebGLRenderer).mockImplementation(() => gpu.renderer as unknown as WebGLRenderer);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 500, height: 380, x: 0, y: 0, top: 0, right: 500, bottom: 380, left: 0, toJSON: () => ({}),
  });
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    const id = ++nextFrame;
    frames.set(id, callback);
    return id;
  }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => frames.delete(id)));
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect = disconnectResize; });
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: typeof intersect) { intersect = callback; }
    observe() {}
    disconnect = disconnectIntersection;
  });
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function tick(time: number) {
  const scheduled = [...frames.values()];
  frames.clear();
  act(() => scheduled.forEach(callback => callback(time)));
}

function currentScene() {
  const calls = gpu.renderer!.render.mock.calls;
  return calls[calls.length - 1][0] as Scene;
}

function sculpturePose(scene: Scene) {
  const transforms: unknown[] = [];
  scene.getObjectByName('atelier-sculpture')!.traverse(object => {
    transforms.push([...object.position.toArray(), ...object.rotation.toArray(), ...object.scale.toArray()]);
  });
  return transforms;
}

describe('AtelierScene lifecycle', () => {
  it.each(['learning', 'tools'] as const)('updates paused %s selection with one render and no animation loop', variant => {
    const onReady = vi.fn();
    const { rerender } = render(<AtelierScene variant={variant} playing={false} onReady={onReady} />);
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(gpu.renderer?.render).toHaveBeenCalledTimes(1);
    rerender(<AtelierScene variant={variant} playing={false} activeIndex={2} onReady={onReady} />);
    expect(gpu.renderer?.render).toHaveBeenCalledTimes(2);
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(WebGLRenderer).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it('suspends offscreen and hidden rendering and resumes the same renderer', () => {
    render(<AtelierScene variant="tools" playing />);
    expect(frames.size).toBe(1);
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
    expect(WebGLRenderer).toHaveBeenCalledTimes(1);
  });

  it('keeps the sunflower facing forward while its petals breathe and its orbits turn independently', () => {
    render(<AtelierScene variant="tools" playing />);
    const scene = currentScene();
    const flower = scene.getObjectByName('atelier-centerpiece')!;
    const petal = scene.getObjectByName('atelier-petal-0')!;
    const startDepth = petal.position.z;
    const startLength = petal.scale.y;
    for (let i = 0; i <= 120; i++) tick(i * 1000 / 60);

    expect(flower.rotation.z).toBeGreaterThan(.25);
    expect(flower.rotation.z).toBeLessThan(.32);
    expect(Math.abs(flower.rotation.x)).toBeLessThan(.03);
    expect(Math.abs(flower.rotation.y)).toBeLessThan(.07);
    expect(Math.abs(petal.position.z - startDepth)).toBeGreaterThan(.02);
    expect(petal.scale.y).toBeGreaterThan(startLength * 1.02);
    expect(scene.getObjectByName('atelier-orbit-0')!.rotation.y).toBeGreaterThan(.2);
    expect(scene.getObjectByName('atelier-orbit-1')!.rotation.y).toBeLessThan(-.15);
  });

  it('moves every learning gimbal, the core and orbiting satellites', () => {
    render(<AtelierScene variant="learning" playing />);
    const scene = currentScene();
    const satellite = scene.getObjectByName('atelier-satellite-0')!;
    const initialPosition = satellite.position.clone();
    for (let i = 0; i <= 90; i++) tick(i * 1000 / 60);

    const ringAngles = Array.from({ length: 4 }, (_, index) => scene.getObjectByName(`atelier-orbit-${index}`)!.rotation.y);
    expect(ringAngles.every(angle => Math.abs(angle) > .1)).toBe(true);
    expect(new Set(ringAngles).size).toBe(4);
    expect(scene.getObjectByName('atelier-centerpiece')!.rotation.y).toBeGreaterThan(.3);
    expect(satellite.position.distanceTo(initialPosition)).toBeGreaterThan(.5);
    expect(satellite.position.length()).toBeCloseTo(1.26);
  });

  it.each(['control', 'offscreen', 'document'] as const)('preserves the full in-flight pose across %s suspension and resumes without a time jump', reason => {
    const { rerender } = render(<AtelierScene variant="tools" playing activeIndex={0} />);
    for (let i = 0; i <= 10; i++) tick(i * 1000 / 60);
    const scene = currentScene();
    const beforeSelection = sculpturePose(scene);
    rerender(<AtelierScene variant="tools" playing activeIndex={4} />);
    expect(sculpturePose(scene)).toEqual(beforeSelection);
    for (let i = 11; i <= 15; i++) tick(i * 1000 / 60);
    const beforeSuspension = sculpturePose(scene);
    expect(beforeSuspension).not.toEqual(beforeSelection);

    if (reason === 'control') rerender(<AtelierScene variant="tools" playing={false} activeIndex={4} />);
    else if (reason === 'offscreen') act(() => intersect?.([{ isIntersecting: false }]));
    else {
      vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
      act(() => document.dispatchEvent(new Event('visibilitychange')));
    }
    expect(frames.size).toBe(0);
    expect(sculpturePose(scene)).toEqual(beforeSuspension);

    if (reason === 'control') rerender(<AtelierScene variant="tools" playing activeIndex={4} />);
    else if (reason === 'offscreen') act(() => intersect?.([{ isIntersecting: true }]));
    else {
      vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
      act(() => document.dispatchEvent(new Event('visibilitychange')));
    }
    tick(60000);
    expect(sculpturePose(scene)).toEqual(beforeSuspension);
    const resumedAngle = scene.getObjectByName('atelier-centerpiece')!.rotation.z;
    tick(60000 + 1000 / 60);
    expect(scene.getObjectByName('atelier-centerpiece')!.rotation.z).toBeGreaterThan(resumedAngle);
    expect(scene.getObjectByName('atelier-centerpiece')!.rotation.z - resumedAngle).toBeLessThan(.08);
    expect(WebGLRenderer).toHaveBeenCalledTimes(1);
  });

  it('disposes shared geometries once and removes the canvas on context loss', () => {
    const disposedGeometries: BufferGeometry[] = [];
    const disposedMaterials: Material[] = [];
    const geometryDisposals = vi.spyOn(BufferGeometry.prototype, 'dispose').mockImplementation(function (this: BufferGeometry) { disposedGeometries.push(this); });
    vi.spyOn(Material.prototype, 'dispose').mockImplementation(function (this: Material) { disposedMaterials.push(this); });
    const onUnavailable = vi.fn();
    const { container, unmount } = render(<AtelierScene variant="tools" playing onUnavailable={onUnavailable} />);
    act(() => container.querySelector('canvas')?.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
    expect(onUnavailable).toHaveBeenCalledTimes(1);
    expect(gpu.renderer?.dispose).toHaveBeenCalledTimes(1);
    expect(geometryDisposals).toHaveBeenCalled();
    expect(new Set(disposedGeometries).size).toBe(disposedGeometries.length);
    expect(disposedMaterials.length).toBeGreaterThan(0);
    expect(new Set(disposedMaterials).size).toBe(disposedMaterials.length);
    expect(disconnectResize).toHaveBeenCalledTimes(1);
    expect(disconnectIntersection).toHaveBeenCalledTimes(1);
    expect(container.querySelector('canvas')).toBeNull();
    expect(frames.size).toBe(0);
    unmount();
    expect(gpu.renderer?.dispose).toHaveBeenCalledTimes(1);
  });

  it('keeps the fallback when shader compilation fails', async () => {
    gpu.renderer?.render.mockImplementationOnce(() => gpu.renderer?.debug.onShaderError?.());
    const onReady = vi.fn();
    const onUnavailable = vi.fn();
    render(<AtelierScene variant="learning" playing={false} onReady={onReady} onUnavailable={onUnavailable} />);
    await act(async () => { await Promise.resolve(); });
    expect(onReady).not.toHaveBeenCalled();
    expect(onUnavailable).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });

  it('falls back cleanly when no WebGL renderer is available', () => {
    vi.mocked(WebGLRenderer).mockImplementationOnce(() => { throw new Error('No WebGL'); });
    const onUnavailable = vi.fn();
    render(<AtelierScene variant="learning" playing onUnavailable={onUnavailable} />);
    expect(onUnavailable).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });
});
