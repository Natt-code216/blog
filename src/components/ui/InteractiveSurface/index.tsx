import { useEffect, useRef, type ReactNode } from 'react';
import styles from './InteractiveSurface.module.css';
import { useMotion } from '../../../app/providers/MotionContext';

interface InteractiveSurfaceProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}

/** A decorative pointer response; all content stays ordinary, accessible HTML. */
export function InteractiveSurface({ children, className = '', maxTilt = 1.6 }: InteractiveSurfaceProps) {
  const { motionEnabled } = useMotion();
  const surfaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface || !motionEnabled || typeof window.matchMedia !== 'function') return;

    const preference = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      delete surface.dataset.active;
      surface.style.removeProperty('--surface-rotate-x');
      surface.style.removeProperty('--surface-rotate-y');
    };

    const move = (event: PointerEvent) => {
      if (!preference.matches || event.pointerType === 'touch') return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (frame) return;

      frame = requestAnimationFrame(() => {
        frame = 0;
        const bounds = surface.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        const x = Math.max(0, Math.min(1, (pointerX - bounds.left) / bounds.width));
        const y = Math.max(0, Math.min(1, (pointerY - bounds.top) / bounds.height));
        surface.style.setProperty('--surface-rotate-x', `${(0.5 - y) * maxTilt * 2}deg`);
        surface.style.setProperty('--surface-rotate-y', `${(x - 0.5) * maxTilt * 2}deg`);
        surface.style.setProperty('--surface-light-x', `${x * 100}%`);
        surface.style.setProperty('--surface-light-y', `${y * 100}%`);
        surface.dataset.active = 'true';
      });
    };

    surface.addEventListener('pointermove', move, { passive: true });
    surface.addEventListener('pointerleave', reset);
    surface.addEventListener('pointercancel', reset);
    preference.addEventListener('change', reset);
    window.addEventListener('blur', reset);

    return () => {
      reset();
      surface.removeEventListener('pointermove', move);
      surface.removeEventListener('pointerleave', reset);
      surface.removeEventListener('pointercancel', reset);
      preference.removeEventListener('change', reset);
      window.removeEventListener('blur', reset);
    };
  }, [maxTilt, motionEnabled]);

  return (
    <div className={styles.frame}>
      <div ref={surfaceRef} className={`${styles.surface} ${className}`.trim()}>{children}</div>
    </div>
  );
}
