import { useEffect, useRef } from 'react';
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Line,
  LineBasicMaterial,
  Material,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  WebGLRenderer,
} from 'three';
import {
  atmosphereFragmentShader,
  haloFragmentShader,
  haloVertexShader,
  planetFragmentShader,
  planetVertexShader,
} from './orbitalShaders';

interface OrbitalSceneProps {
  playing: boolean;
  onReady?: () => void;
  onUnavailable?: () => void;
}

/** A self-contained WebGL enhancement; the parent owns the static artwork. */
export default function OrbitalScene({ playing, onReady, onUnavailable }: OrbitalSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playingRef = useRef(playing);
  const callbacksRef = useRef({ onReady, onUnavailable });
  const syncPlaybackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    callbacksRef.current = { onReady, onUnavailable };
  }, [onReady, onUnavailable]);

  useEffect(() => {
    playingRef.current = playing;
    syncPlaybackRef.current?.();
  }, [playing]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: WebGLRenderer | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let intersectionObserver: IntersectionObserver | undefined;
    let finePointer: MediaQueryList | undefined;
    let animationFrame = 0;
    let previousFrame = 0;
    let disposed = false;
    let unavailable = false;
    let shaderFailed = false;
    let ready = false;
    let visible = true;
    let elapsed = 0;
    let pointerX = 0;
    let pointerY = 0;
    let tiltX = 0;
    let tiltY = 0;
    const geometries = new Set<BufferGeometry>();
    const materials = new Set<Material>();
    const ownGeometry = <T extends BufferGeometry,>(geometry: T): T => {
      geometries.add(geometry);
      return geometry;
    };
    const ownMaterial = <T extends Material,>(material: T): T => {
      materials.add(material);
      return material;
    };

    const stop = () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      previousFrame = 0;
    };

    // Defined up front so partial renderer initialization can also be disposed.
    const cleanups: Array<() => void> = [];
    const dispose = () => {
      if (disposed) return;
      disposed = true;
      stop();
      syncPlaybackRef.current = null;
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      cleanups.forEach(cleanup => cleanup());
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      renderer?.dispose();
      renderer?.domElement.remove();
    };

    const fail = () => {
      if (disposed || unavailable) return;
      unavailable = true;
      dispose();
      callbacksRef.current.onUnavailable?.();
    };

    try {
      renderer = new WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
        failIfMajorPerformanceCaveat: true,
      });
      const webgl = renderer;
      webgl.outputColorSpace = SRGBColorSpace;
      webgl.toneMapping = ACESFilmicToneMapping;
      webgl.toneMappingExposure = 1.18;
      webgl.setClearColor(0x000000, 0);
      webgl.domElement.setAttribute('aria-hidden', 'true');
      webgl.domElement.style.display = 'block';
      webgl.domElement.style.width = '100%';
      webgl.domElement.style.height = '100%';
      host.appendChild(webgl.domElement);

      // Shader failures are not thrown by Three; defer disposal until render exits.
      webgl.debug.onShaderError = () => {
        shaderFailed = true;
        queueMicrotask(fail);
      };

      const scene = new Scene();
      const camera = new PerspectiveCamera(40, 1, 0.1, 30);
      camera.position.set(0, 0.06, 5.05);
      camera.lookAt(0, 0, 0);
      const sculpture = new Group();
      scene.add(sculpture);

      const halo = new Mesh(
        ownGeometry(new PlaneGeometry(5.0, 5.0)),
        ownMaterial(new ShaderMaterial({
          vertexShader: haloVertexShader,
          fragmentShader: haloFragmentShader,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
        })),
      );
      halo.position.z = -1.3;
      scene.add(halo);

      const sphereGeometry = ownGeometry(new SphereGeometry(1.075, 96, 64));
      const globe = new Mesh(sphereGeometry, ownMaterial(new ShaderMaterial({
        vertexShader: planetVertexShader,
        fragmentShader: planetFragmentShader,
      })));
      globe.rotation.set(-0.12, 0.52, 0.24);
      sculpture.add(globe);

      const atmosphere = new Mesh(sphereGeometry, ownMaterial(new ShaderMaterial({
        vertexShader: planetVertexShader,
        fragmentShader: atmosphereFragmentShader,
        side: BackSide,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      })));
      atmosphere.scale.setScalar(1.032);
      sculpture.add(atmosphere);

      const ringMaterial = ownMaterial(new MeshBasicMaterial({
        color: 0xb5ce86,
        transparent: true,
        opacity: 0.68,
      }));
      const outerRingMaterial = ownMaterial(new MeshBasicMaterial({
        color: 0x769981,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      }));
      const firstOrbit = new Group();
      firstOrbit.rotation.set(1.11, -0.16, -0.42);
      firstOrbit.add(new Mesh(ownGeometry(new TorusGeometry(1.59, 0.0045, 6, 240)), ringMaterial));
      firstOrbit.add(new Mesh(ownGeometry(new TorusGeometry(1.64, 0.0018, 4, 240)), outerRingMaterial));
      sculpture.add(firstOrbit);

      const secondOrbit = new Group();
      secondOrbit.rotation.set(0.61, 0.89, 0.68);
      secondOrbit.add(new Mesh(ownGeometry(new TorusGeometry(1.42, 0.002, 4, 220)), outerRingMaterial));
      sculpture.add(secondOrbit);

      const satelliteGeometry = ownGeometry(new SphereGeometry(0.034, 16, 12));
      const satelliteMaterial = ownMaterial(new MeshBasicMaterial({ color: 0xd7e9b6 }));
      const satelliteGlowMaterial = ownMaterial(new MeshBasicMaterial({
        color: 0x9bc891,
        transparent: true,
        opacity: 0.09,
        blending: AdditiveBlending,
        depthWrite: false,
      }));

      const createSatellite = (orbit: Group, radius: number, phase: number, size: number, direction: 1 | -1 = 1) => {
        const satellite = new Group();
        const core = new Mesh(satelliteGeometry, satelliteMaterial);
        core.scale.setScalar(size);
        const glow = new Mesh(satelliteGeometry, satelliteGlowMaterial);
        glow.scale.setScalar(size * 2.3);
        satellite.add(core, glow);
        orbit.add(satellite);

        // A short color-faded trail follows the satellite in its orbital plane.
        const trailPoints = 64;
        const positions = new Float32Array(trailPoints * 3);
        const colors = new Float32Array(trailPoints * 3);
        const trailColor = new Color(0xc3db95);
        for (let i = 0; i < trailPoints; i++) {
          const progress = i / (trailPoints - 1);
          const angle = (progress - 1) * 0.82 * direction;
          positions[i * 3] = Math.cos(angle) * radius;
          positions[i * 3 + 1] = Math.sin(angle) * radius;
          const strength = progress * progress * 0.68;
          colors[i * 3] = trailColor.r * strength;
          colors[i * 3 + 1] = trailColor.g * strength;
          colors[i * 3 + 2] = trailColor.b * strength;
        }
        const trailGeometry = ownGeometry(new BufferGeometry());
        trailGeometry.setAttribute('position', new BufferAttribute(positions, 3));
        trailGeometry.setAttribute('color', new BufferAttribute(colors, 3));
        const trail = new Line(trailGeometry, ownMaterial(new LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
        })));
        orbit.add(trail);

        return (time: number) => {
          const angle = phase + time;
          satellite.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
          trail.rotation.z = angle;
        };
      };
      const updateFirstSatellite = createSatellite(firstOrbit, 1.59, -2.30, 1);
      const updateSecondSatellite = createSatellite(secondOrbit, 1.42, 0.72, 0.64, -1);
      updateFirstSatellite(0);
      updateSecondSatellite(0);

      // Deterministic stars avoid jumping between StrictMode mount cycles.
      let seed = 319;
      const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
        return (seed >>> 0) / 4294967296;
      };
      const starPositions = new Float32Array(100 * 3);
      const starColors = new Float32Array(100 * 3);
      for (let i = 0; i < 100; i++) {
        starPositions[i * 3] = (random() - 0.5) * 7.4;
        starPositions[i * 3 + 1] = (random() - 0.5) * 5.4;
        starPositions[i * 3 + 2] = -1.2 - random() * 2;
        const brightness = 0.2 + random() * 0.5;
        starColors[i * 3] = brightness * 0.84;
        starColors[i * 3 + 1] = brightness;
        starColors[i * 3 + 2] = brightness * 0.80;
      }
      const starGeometry = ownGeometry(new BufferGeometry());
      starGeometry.setAttribute('position', new BufferAttribute(starPositions, 3));
      starGeometry.setAttribute('color', new BufferAttribute(starColors, 3));
      const stars = new Points(starGeometry, ownMaterial(new PointsMaterial({
        size: 0.013,
        vertexColors: true,
        transparent: true,
        opacity: 0.67,
        depthWrite: false,
        sizeAttenuation: true,
      })));
      scene.add(stars);

      const render = () => {
        if (disposed || unavailable) return;
        try {
          webgl.render(scene, camera);
          if (!ready && !shaderFailed) {
            ready = true;
            callbacksRef.current.onReady?.();
          }
        } catch {
          fail();
        }
      };

      const shouldAnimate = () => playingRef.current && visible && !document.hidden && !disposed && !unavailable;
      const animate = (time: number) => {
        animationFrame = 0;
        if (!shouldAnimate()) return;
        const delta = previousFrame ? Math.min((time - previousFrame) / 1000, 0.05) : 0;
        previousFrame = time;
        elapsed += delta;
        const ease = 1 - Math.exp(-delta * 4.2);
        tiltX += (pointerY * 0.12 - tiltX) * ease;
        tiltY += (pointerX * 0.18 - tiltY) * ease;
        sculpture.rotation.set(tiltX, tiltY, Math.sin(elapsed * 0.19) * 0.025);
        sculpture.position.y = Math.sin(elapsed * 0.45) * 0.025;
        globe.rotation.y = 0.52 + elapsed * 0.045;
        updateFirstSatellite(elapsed * 0.14);
        updateSecondSatellite(-elapsed * 0.095);
        render();
        if (shouldAnimate()) animationFrame = requestAnimationFrame(animate);
      };

      const syncPlayback = () => {
        if (shouldAnimate()) {
          if (!animationFrame) animationFrame = requestAnimationFrame(animate);
        } else {
          stop();
        }
      };
      syncPlaybackRef.current = syncPlayback;

      const resize = () => {
        if (disposed) return;
        const { width, height } = host.getBoundingClientRect();
        if (width < 1 || height < 1) return;
        camera.aspect = width / height;
        camera.position.z = Math.max(4.95, 4.88 / camera.aspect);
        camera.updateProjectionMatrix();
        const dprLimit = width < 600 || (finePointer && !finePointer.matches) ? 1.25 : 1.5;
        webgl.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprLimit));
        webgl.setSize(width, height, false);
        // Resize is a one-off render even when motion is paused.
        render();
      };

      finePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)');
      const movePointer = (event: PointerEvent) => {
        if (!playingRef.current || !finePointer?.matches || event.pointerType === 'touch') return;
        const bounds = host.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
        pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      };
      const resetPointer = () => { pointerX = 0; pointerY = 0; };
      const contextLost = (event: Event) => {
        event.preventDefault();
        fail();
      };
      host.addEventListener('pointermove', movePointer, { passive: true });
      host.addEventListener('pointerleave', resetPointer);
      webgl.domElement.addEventListener('webglcontextlost', contextLost);
      document.addEventListener('visibilitychange', syncPlayback);
      cleanups.push(() => {
        host.removeEventListener('pointermove', movePointer);
        host.removeEventListener('pointerleave', resetPointer);
        webgl.domElement.removeEventListener('webglcontextlost', contextLost);
        document.removeEventListener('visibilitychange', syncPlayback);
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
          syncPlayback();
        }, { threshold: 0 });
        intersectionObserver.observe(host);
      }

      resize();
      syncPlayback();
    } catch {
      fail();
    }

    return dispose;
  }, []);

  return <div ref={hostRef} style={{ width: '100%', height: '100%' }} aria-hidden="true" />;
}
