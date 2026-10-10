import { useEffect, useRef } from 'react';
import { useMotion } from '../../../app/providers/MotionContext';
import { ScrollReveal } from '../../../components/ui/ScrollReveal';
import { LivingArtwork } from '../../../components/ui/LivingArtwork';
import styles from './Exhibition.module.css';

/** A scroll-linked art interlude. Native scrolling remains entirely in control. */
export function Exhibition() {
  const ref = useRef<HTMLElement>(null);
  const { motionEnabled } = useMotion();
  useEffect(() => {
    const host = ref.current;
    if (!host || !motionEnabled) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const bounds = host.getBoundingClientRect();
      if (bounds.bottom < 0 || bounds.top > window.innerHeight) return;
      const progress = Math.max(0, Math.min(1, (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height)));
      host.style.setProperty('--passage-y', `${(progress - .5) * 95}px`);
      host.style.setProperty('--passage-rotate', `${(progress - .5) * -6}deg`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      host.style.removeProperty('--passage-y');
      host.style.removeProperty('--passage-rotate');
    };
  }, [motionEnabled]);
  return <section ref={ref} className={styles.passage} aria-label="宇宙艺术序章" data-art-surface>
    <div className={styles.art} aria-hidden="true"><LivingArtwork className={styles.livingArt} src="/images/cosmic-starry-field.webp" variant="stars" intensity={1.15} /><div className={styles.orbit} /></div>
    <div className={`container ${styles.content}`}><ScrollReveal>
      <p className={styles.eyebrow}>A JOURNEY THROUGH THE INNER UNIVERSE</p>
      <h2>让思想漫游，<br /><span>让灵感发生。</span></h2>
      <p className={styles.note}>从一颗好奇的星球出发，<br />在文字、代码与想象之间，寻找自己的轨道。</p>
      <a href="#essays" className={styles.next}>第一站 · 思考与感悟 <span aria-hidden="true">↘</span></a>
    </ScrollReveal></div>
    <span className={styles.marginal} aria-hidden="true">01 — 04 / THE OPEN UNIVERSE</span>
  </section>;
}
