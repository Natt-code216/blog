import { useEffect, useRef } from 'react';
import {
  ClampToEdgeWrapping, LinearFilter, Mesh, NoToneMapping, OrthographicCamera,
  PlaneGeometry, Scene, ShaderMaterial, SRGBColorSpace, Texture, TextureLoader,
  Vector2, WebGLRenderer,
} from 'three';
import type { ArtworkVariant } from './index';

interface ArtworkSceneProps {
  src: string;
  variant: ArtworkVariant;
  playing: boolean;
  intensity?: number;
  onReady?: () => void;
  onUnavailable?: () => void;
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uArtwork;
  uniform vec2 uCover;
  uniform vec2 uPointer;
  uniform float uPointerStrength;
  uniform float uImageAspect;
  uniform float uTime;
  uniform float uIntensity;
  uniform int uVariant;
  varying vec2 vUv;

  vec2 turn(vec2 p, float angle) {
    float c = cos(angle), s = sin(angle);
    return mat2(c, -s, s, c) * p;
  }

  vec2 around(vec2 uv, vec2 center, float angle) {
    vec2 p = (uv - center) * vec2(uImageAspect, 1.0);
    return center + turn(p, angle) / vec2(uImageAspect, 1.0);
  }

  float edge(vec2 uv) {
    return smoothstep(0.0, 0.045, min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)));
  }

  vec3 paint(vec2 uv) {
    return texture2D(uArtwork, clamp(uv, vec2(0.001), vec2(0.999))).rgb;
  }

  vec3 localTurn(vec3 original, vec2 uv, vec2 center, float angle, float mask) {
    vec2 flow = around(uv, center, angle);
    return mix(original, paint(flow), mask * edge(flow) * edge(uv));
  }

  void main() {
    vec2 uv = (vUv - 0.5) * uCover + 0.5;
    vec2 pointer = (uPointer - 0.5) * uCover + 0.5;
    vec2 fromPointer = (uv - pointer) * vec2(uImageAspect, 1.0);
    float touch = exp(-dot(fromPointer, fromPointer) * 28.0) * uPointerStrength;
    // Local brush displacement follows the cursor without moving the whole canvas.
    uv += vec2(-fromPointer.y, fromPointer.x) * touch * 0.045 * uIntensity / vec2(uImageAspect, 1.0);
    vec3 color = paint(uv);
    float time = uTime * uIntensity;

    if (uVariant == 0) {
      // Centers follow the painted galaxies; the observatory and mountains stay still.
      vec2 center = vec2(0.454, 0.742);
      float radius = length((uv - center) * vec2(uImageAspect, 1.0));
      float sky = smoothstep(0.34, 0.62, uv.y);
      float primary = (1.0 - smoothstep(0.13, 0.43, radius)) * sky;
      color = localTurn(color, uv, center, time * 0.078, primary);
      vec2 second = vec2(0.842, 0.447);
      float secondRadius = length((uv - second) * vec2(uImageAspect, 1.0));
      float secondary = 1.0 - smoothstep(0.045, 0.19, secondRadius);
      color = localTurn(color, uv, second, -time * 0.11, secondary * 0.88);
      // The broad brush current undulates independently of the local rotation.
      vec2 drift = vec2(sin(uv.y * 18.0 + time * 0.58), cos(uv.x * 12.0 - time * 0.41));
      vec3 current = paint(uv + drift * vec2(0.004, 0.003) * uIntensity * sky);
      color = mix(color, current, (1.0 - primary) * (1.0 - secondary) * 0.46);
    } else if (uVariant == 1) {
      vec2 center = vec2(0.645, 0.540);
      vec2 p = (uv - center) * vec2(uImageAspect, 1.0);
      float radius = length(p);
      // Only the petal annulus turns. The dark cosmos and the inner seeds retain
      // their own motion, so this never reads as a rotating rectangular picture.
      float petals = smoothstep(0.17, 0.29, radius) * (1.0 - smoothstep(0.57, 0.76, radius));
      float breath = sin(time * 0.52) * 0.014 * smoothstep(0.2, 0.45, radius);
      vec2 petalUv = center + p * (1.0 + breath) / vec2(uImageAspect, 1.0);
      color = localTurn(color, petalUv, center, time * 0.065, petals * 0.94);
      float heart = 1.0 - smoothstep(0.10, 0.235, radius);
      color = localTurn(color, uv, center, -time * 0.095, heart * 0.87);
      // A restrained moving light follows the existing impasto highlights.
      float relief = smoothstep(0.13, 0.65, dot(color, vec3(0.25, 0.55, 0.20)));
      color *= 1.0 + sin(atan(p.y, p.x) * 2.0 - time * 0.45) * petals * relief * 0.045 * uIntensity;
    } else {
      // Horizon at y=.66: ripples increase toward the foreground while the sky
      // and distant banks remain anchored in the original painting.
      float water = 1.0 - smoothstep(0.59, 0.68, uv.y);
      float depth = 1.0 - smoothstep(0.02, 0.66, uv.y);
      float wave = sin(uv.y * 58.0 + time * 0.92 + sin(uv.x * 7.0 + time * 0.2))
                 + sin(uv.y * 103.0 - time * 0.64 + uv.x * 11.0) * 0.38;
      vec2 flow = vec2(wave * (0.003 + depth * 0.007),
                      sin(uv.x * 19.0 + time * 0.72 + uv.y * 13.0) * 0.0018);
      color = paint(uv + flow * water * edge(uv) * uIntensity);
      float reflection = smoothstep(0.075, 0.40, dot(color, vec3(0.25, 0.55, 0.20)));
      color *= 1.0 + sin(uv.y * 67.0 - time * 0.86 + uv.x * 4.0) * water * reflection * 0.038 * uIntensity;
    }
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

const variantNumber: Record<ArtworkVariant, number> = { stars: 0, sunflower: 1, water: 2 };
const safeIntensity = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(value, 2)) : 1;

/** A single textured plane; all movement happens inside the original oil strokes. */
export default function ArtworkScene({ src, variant, playing, intensity = 1, onReady, onUnavailable }: ArtworkSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef({ playing, variant, intensity: safeIntensity(intensity) });
  const callbacksRef = useRef({ onReady, onUnavailable });
  const syncRef = useRef<((refresh?: boolean) => void) | null>(null);

  useEffect(() => { callbacksRef.current = { onReady, onUnavailable }; }, [onReady, onUnavailable]);
  useEffect(() => {
    settingsRef.current = { playing, variant, intensity: safeIntensity(intensity) };
    syncRef.current?.(true);
  }, [playing, variant, intensity]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: WebGLRenderer | undefined;
    let geometry: PlaneGeometry | undefined;
    let material: ShaderMaterial | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let intersectionObserver: IntersectionObserver | undefined;
    let frame = 0, previousTime = 0, accumulated = 0, elapsed = 0;
    let width = 0, height = 0, imageAspect = 1586 / 992;
    let disposed = false, ready = false, shaderFailed = false, textureReady = false;
    let visible = typeof IntersectionObserver === 'undefined';
    let pointerStrength = 0, targetStrength = 0;
    const pointer = new Vector2(0.5, 0.5);
    const pointerTarget = new Vector2(0.5, 0.5);
    const textures = new Set<Texture>();
    const disposedTextures = new Set<Texture>();
    const cleanups: Array<() => void> = [];
    const disposeTexture = (texture: Texture) => {
      if (disposedTextures.has(texture)) return;
      disposedTextures.add(texture);
      texture.dispose();
    };
    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      accumulated = 0;
    };
    const dispose = () => {
      if (disposed) return;
      disposed = true;
      stop();
      syncRef.current = null;
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      cleanups.forEach(cleanup => cleanup());
      textures.forEach(disposeTexture);
      geometry?.dispose();
      material?.dispose();
      renderer?.dispose();
      renderer?.forceContextLoss();
      renderer?.domElement.remove();
    };
    const fail = () => {
      if (disposed) return;
      dispose();
      callbacksRef.current.onUnavailable?.();
    };

    try {
      renderer = new WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true });
      const webgl = renderer;
      webgl.outputColorSpace = SRGBColorSpace;
      webgl.toneMapping = NoToneMapping;
      webgl.setClearColor(0x000000, 0);
      webgl.domElement.setAttribute('aria-hidden', 'true');
      Object.assign(webgl.domElement.style, { display: 'block', width: '100%', height: '100%' });
      host.appendChild(webgl.domElement);
      webgl.debug.onShaderError = () => { shaderFailed = true; queueMicrotask(fail); };

      const uniforms = {
        uArtwork: { value: null as Texture | null },
        uCover: { value: new Vector2(1, 1) },
        uPointer: { value: pointer },
        uPointerStrength: { value: 0 },
        uImageAspect: { value: imageAspect },
        uTime: { value: 0 },
        uIntensity: { value: settingsRef.current.intensity },
        uVariant: { value: variantNumber[settingsRef.current.variant] },
      };
      const scene = new Scene();
      const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 2);
      camera.position.z = 1;
      geometry = new PlaneGeometry(2, 2);
      material = new ShaderMaterial({ vertexShader, fragmentShader, uniforms, depthTest: false, depthWrite: false, toneMapped: false });
      scene.add(new Mesh(geometry, material));

      const updateCover = () => {
        if (width < 1 || height < 1) return;
        const aspect = width / height;
        uniforms.uCover.value.set(Math.min(aspect / imageAspect, 1), Math.min(imageAspect / aspect, 1));
        uniforms.uImageAspect.value = imageAspect;
      };
      const render = () => {
        if (disposed || !textureReady || !visible || document.hidden || width < 1 || height < 1) return;
        uniforms.uVariant.value = variantNumber[settingsRef.current.variant];
        uniforms.uIntensity.value = settingsRef.current.intensity;
        uniforms.uTime.value = elapsed;
        uniforms.uPointerStrength.value = pointerStrength;
        try {
          webgl.render(scene, camera);
          if (!ready && !shaderFailed) { ready = true; callbacksRef.current.onReady?.(); }
        } catch { fail(); }
      };
      const running = () => !disposed && textureReady && visible && width > 0 && height > 0 && !document.hidden && settingsRef.current.playing && settingsRef.current.intensity > 0;
      const animate = (time: number) => {
        frame = 0;
        if (!running()) return;
        const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.08) : 0;
        previousTime = time;
        elapsed += delta;
        accumulated += delta;
        // These paintings share the page with real 3D sculptures; 30 fps keeps
        // their slow paint flow smooth without multiplying full-size GPU work.
        if (accumulated >= 1 / 30) {
          const ease = 1 - Math.exp(-accumulated * 4.5);
          pointer.lerp(pointerTarget, ease);
          pointerStrength += (targetStrength - pointerStrength) * ease;
          accumulated = 0;
          render();
        }
        if (running()) frame = requestAnimationFrame(animate);
      };
      const sync = (refresh = false) => {
        if (disposed) return;
        if (!running()) stop();
        if (refresh) render();
        if (running() && !frame) frame = requestAnimationFrame(animate);
      };
      syncRef.current = sync;
      const resize = () => {
        if (disposed) return;
        const bounds = host.getBoundingClientRect();
        width = bounds.width;
        height = bounds.height;
        if (width < 1 || height < 1) { stop(); return; }
        webgl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
        webgl.setSize(width, height, false);
        updateCover();
        sync(true);
      };

      const pointerSurface = host.closest('[data-art-surface]') ?? host.parentElement ?? host;
      const finePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)');
      const resetPointer = () => { targetStrength = 0; };
      const movePointer = (event: Event) => {
        const pointerEvent = event as PointerEvent;
        if (!running() || !finePointer?.matches || pointerEvent.pointerType === 'touch') return;
        const bounds = host.getBoundingClientRect();
        if (bounds.width < 1 || bounds.height < 1) return;
        const x = (pointerEvent.clientX - bounds.left) / bounds.width;
        const y = 1 - (pointerEvent.clientY - bounds.top) / bounds.height;
        if (x < 0 || x > 1 || y < 0 || y > 1) { targetStrength = 0; return; }
        pointerTarget.set(x, y);
        targetStrength = 1;
      };
      const visibilityChange = () => sync(true);
      const contextLost = (event: Event) => { event.preventDefault(); fail(); };
      pointerSurface.addEventListener('pointermove', movePointer, { passive: true });
      pointerSurface.addEventListener('pointerleave', resetPointer);
      pointerSurface.addEventListener('pointercancel', resetPointer);
      finePointer?.addEventListener('change', resetPointer);
      document.addEventListener('visibilitychange', visibilityChange);
      webgl.domElement.addEventListener('webglcontextlost', contextLost);
      cleanups.push(() => {
        pointerSurface.removeEventListener('pointermove', movePointer);
        pointerSurface.removeEventListener('pointerleave', resetPointer);
        pointerSurface.removeEventListener('pointercancel', resetPointer);
        finePointer?.removeEventListener('change', resetPointer);
        document.removeEventListener('visibilitychange', visibilityChange);
        webgl.domElement.removeEventListener('webglcontextlost', contextLost);
      });
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
      } else {
        window.addEventListener('resize', resize);
        cleanups.push(() => window.removeEventListener('resize', resize));
      }
      if (typeof IntersectionObserver !== 'undefined') {
        intersectionObserver = new IntersectionObserver(entries => {
          visible = entries.some(entry => entry.isIntersecting);
          sync(true);
        }, { threshold: 0.01 });
        intersectionObserver.observe(host);
      }
      resize();

      const texture = new TextureLoader().load(src, loaded => {
        textures.add(loaded);
        if (disposed) { disposeTexture(loaded); return; }
        loaded.colorSpace = SRGBColorSpace;
        loaded.wrapS = loaded.wrapT = ClampToEdgeWrapping;
        loaded.magFilter = LinearFilter;
        const image = loaded.image as { naturalWidth?: number; naturalHeight?: number; width?: number; height?: number } | undefined;
        const imageWidth = image?.naturalWidth || image?.width;
        const imageHeight = image?.naturalHeight || image?.height;
        if (imageWidth && imageHeight) imageAspect = imageWidth / imageHeight;
        uniforms.uArtwork.value = loaded;
        textureReady = true;
        updateCover();
        sync(true);
      }, undefined, fail);
      textures.add(texture);
      if (disposed) disposeTexture(texture);
    } catch { fail(); }
    return dispose;
  }, [src]);

  return <div ref={hostRef} style={{ width: '100%', height: '100%' }} aria-hidden="true" />;
}
