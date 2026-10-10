import { Component, lazy, Suspense, useState, type ReactNode } from 'react';
import { useMotion } from '../../../app/providers/MotionContext';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';
import styles from './Sculpture.module.css';
const AtelierScene = lazy(() => import('./AtelierScene'));
class VisualBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}
export function Sculpture({ variant, activeIndex = 0 }: { variant: 'learning' | 'tools'; activeIndex?: number }) {
  const [ref, visible] = useIntersectionObserver<HTMLDivElement>({ rootMargin: '180px', threshold: .01 });
  const { motionEnabled } = useMotion();
  const [ready, setReady] = useState(false);
  return <div ref={ref} className={`${styles.stage} ${styles[variant]}`} aria-hidden="true">
    <div className={styles.aura} />
    <div className={`${styles.fallback} ${ready ? styles.hidden : ''}`}><i /><i /><i /><b /></div>
    <div className={styles.canvas}>{visible && <VisualBoundary><Suspense fallback={null}><AtelierScene variant={variant} activeIndex={activeIndex} playing={motionEnabled} onReady={() => setReady(true)} onUnavailable={() => setReady(false)} /></Suspense></VisualBoundary>}</div>
    <span className={styles.coordinate}>+<small>{variant === 'learning' ? 'CELESTIAL NAVIGATION' : 'THE SUNFLOWER ENGINE'}</small></span>
    <span className={styles.edition}>{variant === 'learning' ? 'STUDY / 02' : 'ATELIER / 03'}</span>
  </div>;
}
