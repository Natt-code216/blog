import { useEffect, useRef } from 'react';
import {
  ACESFilmicToneMapping, AdditiveBlending, BufferAttribute, BufferGeometry,
  Color, DirectionalLight, Group, HemisphereLight, IcosahedronGeometry,
  LineBasicMaterial, LineSegments, Material, Mesh, MeshStandardMaterial,
  PerspectiveCamera, PointLight, Points, PointsMaterial, Scene,
  SphereGeometry, SRGBColorSpace, TorusGeometry, WebGLRenderer,
} from 'three';

interface AtelierSceneProps {
  playing: boolean;
  variant: 'learning' | 'tools';
  activeIndex?: number;
  onReady?: () => void;
  onUnavailable?: () => void;
}

/** Decorative, self-contained sculpture. Navigation remains in the surrounding HTML. */
export default function AtelierScene({ playing, variant, activeIndex = 0, onReady, onUnavailable }: AtelierSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ playing, activeIndex });
  const callbacksRef = useRef({ onReady, onUnavailable });
  const syncRef = useRef<((refresh?: boolean) => void) | null>(null);

  useEffect(() => { callbacksRef.current = { onReady, onUnavailable }; }, [onReady, onUnavailable]);
  useEffect(() => {
    const selectionChanged = stateRef.current.activeIndex !== activeIndex;
    stateRef.current = { playing, activeIndex };
    syncRef.current?.(selectionChanged);
  }, [playing, activeIndex]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let renderer: WebGLRenderer | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let intersectionObserver: IntersectionObserver | undefined;
    let frame = 0, elapsed = 0, angle = stateRef.current.activeIndex * .34;
    let lastTime: number | null = null;
    let pointerX = 0, pointerY = 0, tiltX = 0, tiltY = 0;
    let disposed = false, visible = true, ready = false, shaderFailed = false;
    const geometries = new Set<BufferGeometry>();
    const materials = new Set<Material>();
    const cleanups: Array<() => void> = [];
    const geometry = <T extends BufferGeometry,>(value: T): T => { geometries.add(value); return value; };
    const material = <T extends Material,>(value: T): T => { materials.add(value); return value; };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; lastTime = null; };
    const dispose = () => {
      if (disposed) return;
      disposed = true;
      stop();
      syncRef.current = null;
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      cleanups.forEach(cleanup => cleanup());
      geometries.forEach(value => value.dispose());
      materials.forEach(value => value.dispose());
      renderer?.dispose();
      renderer?.domElement.remove();
    };
    const fail = () => {
      if (disposed) return;
      dispose();
      callbacksRef.current.onUnavailable?.();
    };

    try {
      renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true });
      const webgl = renderer;
      webgl.outputColorSpace = SRGBColorSpace;
      webgl.toneMapping = ACESFilmicToneMapping;
      webgl.toneMappingExposure = 1.12;
      webgl.setClearColor(0x000000, 0);
      webgl.domElement.setAttribute('aria-hidden', 'true');
      Object.assign(webgl.domElement.style, { display: 'block', width: '100%', height: '100%' });
      host.appendChild(webgl.domElement);
      webgl.debug.onShaderError = () => { shaderFailed = true; queueMicrotask(fail); };

      const scene = new Scene();
      const camera = new PerspectiveCamera(39, 1, .1, 25);
      camera.position.set(0, .12, 5.45);
      camera.lookAt(0, 0, 0);
      scene.add(new HemisphereLight(0xe7efd7, 0x173425, 2.2));
      const key = new DirectionalLight(0xffe8bd, 4.5);
      key.position.set(-3, 4, 5);
      const rim = new DirectionalLight(0xb6ded0, 3.4);
      rim.position.set(3, .5, -2);
      const glow = new PointLight(0xe7b66b, 13, 12, 2);
      glow.position.set(.3, 1.6, 3);
      scene.add(key, rim, glow);

      const sculpture = new Group();
      const centerpiece = new Group();
      sculpture.name = 'atelier-sculpture';
      centerpiece.name = 'atelier-centerpiece';
      sculpture.add(centerpiece);
      scene.add(sculpture);
      const brass = material(new MeshStandardMaterial({ color: 0xc7a566, metalness: .63, roughness: .3 }));
      const paleGold = material(new MeshStandardMaterial({ color: 0xe5c77e, metalness: .48, roughness: .35 }));
      const bronze = material(new MeshStandardMaterial({ color: 0x433a27, metalness: .65, roughness: .39 }));
      const sage = material(new MeshStandardMaterial({ color: 0xb0c8ae, metalness: .32, roughness: .27, flatShading: true }));
      const movingRings: Array<{ pivot: Group; speed: number; phase: number }> = [];
      const movingPetals: Array<{ mesh: Mesh; length: number; depth: number; phase: number }> = [];
      const ring = (radius: number, width: number, rotation: [number, number, number], speed: number) => {
        // The gimbal moves the orbital plane itself; rotating a circular torus
        // around only its local Z axis would look completely stationary.
        const pivot = new Group();
        pivot.name = `atelier-orbit-${movingRings.length}`;
        const orbit = new Group();
        orbit.rotation.set(...rotation);
        orbit.add(new Mesh(geometry(new TorusGeometry(radius, width, 8, 144)), brass));
        pivot.add(orbit);
        sculpture.add(pivot);
        movingRings.push({ pivot, speed, phase: movingRings.length * 1.3 });
        return orbit;
      };
      const movingBeads: Array<{ mesh: Mesh; phase: number; radius: number }> = [];

      if (variant === 'learning') {
        const crystal = new Mesh(geometry(new IcosahedronGeometry(.58, 1)), sage);
        crystal.rotation.set(.18, .42, .15);
        centerpiece.add(crystal);
        ring(.73, .012, [.55, .3, -.4], .19);
        const equator = ring(1.26, .007, [.82, .2, -.28], .11);
        ring(1.39, .006, [1.57, -.57, .86], -.085);
        ring(1.13, .008, [.18, .98, .45], .145);
        const beadGeometry = geometry(new SphereGeometry(.042, 18, 12));
        for (let i = 0; i < 5; i++) {
          const bead = new Mesh(beadGeometry, i % 2 ? sage : paleGold);
          bead.name = `atelier-satellite-${i}`;
          bead.scale.setScalar(i === 0 ? 1.5 : .7 + i * .1);
          equator.add(bead);
          movingBeads.push({ mesh: bead, phase: i * Math.PI * 2 / 5, radius: 1.26 });
        }
        // Engraved divisions use one draw call and make the rings read as an instrument.
        const ticks: number[] = [];
        for (let i = 0; i < 60; i++) {
          const a = i / 60 * Math.PI * 2;
          const length = i % 5 === 0 ? .054 : .025;
          ticks.push(Math.cos(a) * 1.29, Math.sin(a) * 1.29, 0, Math.cos(a) * (1.29 + length), Math.sin(a) * (1.29 + length), 0);
        }
        const tickGeometry = geometry(new BufferGeometry());
        tickGeometry.setAttribute('position', new BufferAttribute(new Float32Array(ticks), 3));
        equator.add(new LineSegments(tickGeometry, material(new LineBasicMaterial({ color: 0xd2ba80, transparent: true, opacity: .55 }))));
      } else {
        // A shared bent ellipsoid gives the sixteen petals a sculpted, curled profile.
        const petalGeometry = geometry(new SphereGeometry(1, 24, 16));
        const positions = petalGeometry.getAttribute('position');
        for (let i = 0; i < positions.count; i++) {
          const y = positions.getY(i);
          positions.setXYZ(i, positions.getX(i) * (.82 + y * .1), y, positions.getZ(i) + (y + .25) ** 2 * .58);
        }
        petalGeometry.computeVertexNormals();
        for (let i = 0; i < 16; i++) {
          const petalPivot = new Group();
          const petal = new Mesh(petalGeometry, i % 3 === 0 ? brass : paleGold);
          const a = i / 16 * Math.PI * 2;
          const length = .62 + Math.sin(i * 2.4) * .045;
          const depth = -.10 + (i % 2) * .055;
          petal.name = `atelier-petal-${i}`;
          petal.scale.set(.17, length, .1);
          petal.position.set(0, .77, depth);
          petal.rotation.y = i % 2 ? .12 : -.12;
          petalPivot.rotation.z = -a;
          petalPivot.add(petal);
          centerpiece.add(petalPivot);
          movingPetals.push({ mesh: petal, length, depth, phase: a * 2 });
        }
        const heart = new Mesh(geometry(new SphereGeometry(.445, 40, 24)), bronze);
        heart.scale.z = .52;
        heart.position.z = .065;
        centerpiece.add(heart);
        const bezel = new Mesh(geometry(new TorusGeometry(.43, .015, 8, 100)), brass);
        bezel.position.z = .14;
        centerpiece.add(bezel);
        const seeds = new Float32Array(89 * 3);
        for (let i = 0; i < 89; i++) {
          const radius = Math.sqrt((i + .5) / 89) * .39;
          const a = i * 2.399963;
          seeds.set([Math.cos(a) * radius, Math.sin(a) * radius, .075 + Math.sqrt(.445 ** 2 - radius ** 2) * .52], i * 3);
        }
        const seedGeometry = geometry(new BufferGeometry());
        seedGeometry.setAttribute('position', new BufferAttribute(seeds, 3));
        centerpiece.add(new Points(seedGeometry, material(new PointsMaterial({ color: 0xd8b16a, size: .019, sizeAttenuation: true }))));
        ring(1.64, .005, [.88, -.4, -.25], .14);
        ring(1.75, .0035, [1.16, .48, .52], -.10);
      }

      const dustGeometry = geometry(new BufferGeometry());
      const dustPositions = new Float32Array(86 * 3);
      const dustColors = new Float32Array(86 * 3);
      const dustColor = new Color(0xd6c58c);
      for (let i = 0; i < 86; i++) {
        const a = i * 2.399963;
        const radius = 1.65 + ((i * 37) % 79) / 79 * 1.1;
        dustPositions.set([Math.cos(a) * radius, Math.sin(a) * radius * .85, -1 - (i % 7) * .15], i * 3);
        const strength = .2 + (i % 5) * .11;
        dustColors.set([dustColor.r * strength, dustColor.g * strength, dustColor.b * strength], i * 3);
      }
      dustGeometry.setAttribute('position', new BufferAttribute(dustPositions, 3));
      dustGeometry.setAttribute('color', new BufferAttribute(dustColors, 3));
      const dust = new Points(dustGeometry, material(new PointsMaterial({ size: .012, vertexColors: true, transparent: true, opacity: .7, depthWrite: false, blending: AdditiveBlending })));
      scene.add(dust);

      const pose = () => {
        sculpture.rotation.set(tiltX + .10, tiltY - .12 + Math.sin(angle) * .08, -.12);
        sculpture.position.y = Math.sin(elapsed * .6) * .035;
        if (variant === 'tools') {
          // Keep the seed disk facing the visitor while the petals rotate around it.
          centerpiece.rotation.set(Math.sin(elapsed * .3) * .025, Math.sin(angle) * .065, angle + elapsed * .14);
        } else {
          centerpiece.rotation.set(.10 + elapsed * .075, elapsed * .21 + angle, angle * .4 + elapsed * .045);
        }
        movingRings.forEach(({ pivot, speed, phase }) => {
          pivot.rotation.set(Math.sin(elapsed * .28 + phase) * .16, elapsed * speed, elapsed * speed * .32);
        });
        movingPetals.forEach(({ mesh, length, depth, phase }) => {
          const breath = Math.sin(elapsed * .78);
          const wave = Math.sin(elapsed * 1.05 - phase);
          mesh.position.y = .77 + breath * .022;
          mesh.position.z = depth + wave * .036;
          mesh.scale.y = length * (1 + breath * .025);
          mesh.rotation.x = .10 + wave * .14;
        });
        movingBeads.forEach(({ mesh, phase, radius }) => {
          const a = phase + elapsed * .33 + angle * .35;
          mesh.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0);
        });
        dust.rotation.z = elapsed * .022;
      };
      const render = () => {
        if (disposed) return;
        try {
          pose();
          webgl.render(scene, camera);
          if (!ready && !shaderFailed) { ready = true; callbacksRef.current.onReady?.(); }
        } catch { fail(); }
      };
      const running = () => !disposed && visible && !document.hidden && stateRef.current.playing;
      const animate = (time: number) => {
        frame = 0;
        if (!running()) return;
        const delta = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, .05);
        lastTime = time;
        elapsed += delta;
        const ease = 1 - Math.exp(-delta * 3);
        angle += (stateRef.current.activeIndex * .34 - angle) * ease;
        tiltX += (pointerY * .11 - tiltX) * ease;
        tiltY += (pointerX * .15 - tiltY) * ease;
        render();
        if (running()) frame = requestAnimationFrame(animate);
      };
      const sync = (selectionChanged = false, refresh = false) => {
        if (disposed) return;
        // A deliberate selection still updates the static sculpture. Pausing,
        // hiding and resuming instead preserve the exact pose and elapsed time.
        if (selectionChanged && !stateRef.current.playing) angle = stateRef.current.activeIndex * .34;
        if (!running()) {
          stop();
          if ((refresh || selectionChanged) && visible && !document.hidden) render();
        } else if (!frame) frame = requestAnimationFrame(animate);
      };
      syncRef.current = sync;
      const resize = () => {
        if (disposed) return;
        const { width, height } = host.getBoundingClientRect();
        if (width < 1 || height < 1) return;
        camera.aspect = width / height;
        camera.position.z = Math.max(5.45, 5.2 / camera.aspect);
        camera.updateProjectionMatrix();
        webgl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
        webgl.setSize(width, height, false);
        if (visible && !document.hidden) render();
      };
      const finePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)');
      const resetPointer = () => { pointerX = 0; pointerY = 0; };
      const movePointer = (event: PointerEvent) => {
        if (!running() || !finePointer?.matches || event.pointerType === 'touch') return;
        const bounds = host.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        pointerX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
        pointerY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
      };
      const visibilityChange = () => sync(false, true);
      const contextLost = (event: Event) => { event.preventDefault(); fail(); };
      host.addEventListener('pointermove', movePointer, { passive: true });
      host.addEventListener('pointerleave', resetPointer);
      host.addEventListener('pointercancel', resetPointer);
      finePointer?.addEventListener('change', resetPointer);
      document.addEventListener('visibilitychange', visibilityChange);
      webgl.domElement.addEventListener('webglcontextlost', contextLost);
      cleanups.push(() => {
        host.removeEventListener('pointermove', movePointer);
        host.removeEventListener('pointerleave', resetPointer);
        host.removeEventListener('pointercancel', resetPointer);
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
          sync(false, true);
        });
        intersectionObserver.observe(host);
      }
      resize();
      sync();
    } catch { fail(); }
    return dispose;
  }, [variant]);

  return <div ref={hostRef} style={{ width: '100%', height: '100%' }} aria-hidden="true" />;
}
