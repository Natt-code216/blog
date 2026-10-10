import { Component, lazy, Suspense, useCallback, useState, type ReactNode } from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';
import { toolboxHref } from '../../../services/toolCatalog';
import { collectionHref } from '../../../services/collectionCatalog';
import styles from './Hero.module.css';
import { useMotion } from '../../../app/providers/MotionContext';

const OrbitalScene = lazy(() => import('./OrbitalScene'));

// Navigation remains usable if the GPU or the lazy-loaded 3D module is unavailable.
class SceneBoundary extends Component<{ children: ReactNode; onUnavailable: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onUnavailable(); }
  render() { return this.state.failed ? null : this.props.children; }
}

const entries = [
  { index: '01', label: '随笔', note: '一些想法，持续生长', english: 'JOURNAL', href: '#essays', arrow: '↘' },
  { index: '02', label: '教程', note: '保持好奇，继续探索', english: 'EXPLORATIONS', href: '#tutorials', arrow: '↘' },
  { index: '03', label: '工具集', note: '把灵感，变成小工具', english: 'THE EVERYDAY KIT', href: toolboxHref, arrow: '↗' },
  { index: '04', label: '好的分享', note: '互联网里的意外发现', english: 'GOOD FINDS', href: collectionHref(), arrow: '↗' },
];

export function Hero() {
  const [heroRef, heroVisible] = useIntersectionObserver<HTMLElement>({ triggerOnce: false, threshold: 0.01, rootMargin: '0px' });
  const globalMotion = useMotion();
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [sceneState, setSceneState] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const playing = !paused && !reducedMotion && globalMotion.motionEnabled && sceneState !== 'unavailable';
  const handleReady = useCallback(() => setSceneState('ready'), []);
  const handleUnavailable = useCallback(() => setSceneState('unavailable'), []);

  return (
    <section ref={heroRef} id="home" className={`${styles.hero} ${!playing ? styles.paused : ''}`} data-atmosphere-playing={playing && heroVisible} aria-labelledby="hero-title">
      <img className={styles.atmosphere} src="/images/observatory-atmosphere.webp" alt="" width="1672" height="941" loading="eager" decoding="async" />
      <div className={styles.grid} aria-hidden="true" />
      <div className={`container ${styles.heroInner}`}>
        <div className={styles.topline} data-motion-entry>
          <span><i /> A SMALL SPACE, AN OPEN MIND.</span>
          <span className={styles.edition}>PERSONAL ORBIT — VOL. 01</span>
        </div>
        <div className={styles.stage}>
          <div className={styles.copy}>
            <p className={styles.heroLabel} data-motion-entry><span>独立开发者的数字自留地</span> / PORTFOLIO &amp; JOURNAL</p>
            <h1 className={styles.heroTitle} id="hero-title" data-motion-entry>
              <a href="#tools" className={styles.creator}>创造者<span>.</span></a>
              <span className={styles.otherRoles}><a href="#essays">思考者</a><i>/</i><a href="#tutorials">探索者</a></span>
            </h1>
            <p className={styles.heroDesc} data-motion-entry>在技术与人文之间，保持好奇。<br />记录思考，打磨工具，探索尚未抵达的地方。</p>
            <a className={styles.exploreButton} href="#essays" data-motion-entry><span>进入我的小宇宙</span><span className={styles.buttonArrow} aria-hidden="true">↗</span></a>
            <div className={styles.signature} data-motion-entry><span aria-hidden="true">✳</span><p>BUILD THINGS. THINK DEEPLY.<br /><span>在自己的轨道里，慢慢生长。</span></p></div>
          </div>
          <div className={styles.art}>
            <div className={styles.artCorner} aria-hidden="true">+<span>OBJECT / 001</span></div>
            <div className={`${styles.poster} ${sceneState === 'ready' ? styles.posterHidden : ''}`} aria-hidden="true">
              <div className={styles.posterOrbit} /><div className={styles.posterPlanet} /><div className={styles.posterOrbitFront} />
            </div>
            <div className={styles.scene} aria-hidden="true">
              <SceneBoundary onUnavailable={handleUnavailable}>
                <Suspense fallback={null}><OrbitalScene playing={playing} onReady={handleReady} onUnavailable={handleUnavailable} /></Suspense>
              </SceneBoundary>
            </div>
            <span className={styles.orbitCaption}>THE CURIOSITY CORE<br /><small>一颗永远好奇的星球</small></span>
            <span className={styles.coordinates} aria-hidden="true">X 031.2°<br />Y 121.5°</span>
            <div className={styles.artFoot}>
              <span className={styles.interactionHint}>{sceneState === 'unavailable' || reducedMotion ? '静态星球 · 保持好奇' : globalMotion.paused ? '全局动效已暂停' : paused ? '已暂停 · 让思绪停留片刻' : '移动光标，改变观察的角度'}</span>
              <button type="button" className={styles.motionToggle} aria-pressed={playing}
                aria-label={reducedMotion ? '已遵循系统设置减少动态效果' : sceneState === 'unavailable' ? '当前展示静态星球' : playing ? '暂停星球动效' : '播放星球动效'}
                disabled={reducedMotion || sceneState === 'unavailable' || globalMotion.paused} onClick={() => setPaused(value => !value)}>
                {reducedMotion || sceneState === 'unavailable' ? '静态星球' : <><span aria-hidden="true">{playing ? 'Ⅱ' : '▷'}</span>{playing ? '暂停' : '播放'}</>}
              </button>
            </div>
          </div>
        </div>
        <div className={styles.heroFoot}>
          <span className={styles.learningDot}>ALWAYS A WORK IN PROGRESS</span>
          <a href="#essays">向下，发现更多 <span aria-hidden="true">↓</span></a>
        </div>
        <nav className={styles.contentNav} aria-label="探索内容" data-motion-entry>
          {entries.map(entry => (
            <a href={entry.href} key={entry.index}>
              <span className={styles.entryTop}><span>{entry.index} / {entry.english}</span><span className={styles.entryArrow} aria-hidden="true">{entry.arrow}</span></span>
              <span className={styles.entryTitle}>{entry.label}</span><span className={styles.entryNote}>{entry.note}</span>
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}
