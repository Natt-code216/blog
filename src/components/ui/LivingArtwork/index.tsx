import { Component, lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import { useMotion } from '../../../app/providers/MotionContext';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';
import styles from './LivingArtwork.module.css';

const ArtworkScene = lazy(() => import('./ArtworkScene'));
export type ArtworkVariant = 'stars' | 'sunflower' | 'water';

export interface LivingArtworkProps {
  src: string;
  variant: ArtworkVariant;
  className?: string;
  active?: boolean;
  intensity?: number;
}

class ArtworkBoundary extends Component<{ children: ReactNode; onUnavailable: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onUnavailable(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function ArtworkFrame({ src, variant, className = '', active = true, intensity = 1 }: LivingArtworkProps) {
  const { motionEnabled } = useMotion();
  const [hostRef, nearby] = useIntersectionObserver<HTMLDivElement>({ rootMargin: '360px 0px', threshold: 0.01 });
  const [activated, setActivated] = useState(false);
  const [state, setState] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [imageFailed, setImageFailed] = useState(false);
  const ready = useCallback(() => setState('ready'), []);
  const unavailable = useCallback(() => setState('unavailable'), []);

  useEffect(() => {
    // Hidden neighbors stay as ordinary images until they are first selected.
    // Once initialized, pausing keeps their existing GPU resources reusable.
    if (nearby && active && motionEnabled) setActivated(true);
  }, [nearby, active, motionEnabled]);

  return (
    <div ref={hostRef} className={`${styles.artwork} ${className}`} aria-hidden="true" data-artwork={variant}>
      <img className={`${styles.fallback} ${imageFailed ? styles.failedImage : ''}`} src={src} alt=""
        width="1586" height="992" loading="lazy" decoding="async" onError={() => setImageFailed(true)} />
      {activated && state !== 'unavailable' && <div className={`${styles.scene} ${state === 'ready' ? styles.ready : ''}`}>
        <ArtworkBoundary onUnavailable={unavailable}>
          <Suspense fallback={null}>
            <ArtworkScene src={src} variant={variant} playing={motionEnabled && active}
              intensity={intensity} onReady={ready} onUnavailable={unavailable} />
          </Suspense>
        </ArtworkBoundary>
      </div>}
    </div>
  );
}

/** The still image remains underneath the canvas throughout loading and failure. */
export function LivingArtwork(props: LivingArtworkProps) {
  return <ArtworkFrame key={props.src} {...props} />;
}

export default LivingArtwork;
