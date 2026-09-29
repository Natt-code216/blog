import { useId, useState } from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { toolboxHref } from '../../../services/toolCatalog';
import { collectionHref } from '../../../services/collectionCatalog';
import styles from './Hero.module.css';

function OrbitalPlanet() {
  const id = useId();
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const playing = !paused && !reducedMotion;
  const gradient = (name: string) => `url(#${id}-${name})`;

  return (
    <div className={`${styles.art} ${playing ? '' : styles.paused}`}>
      <svg className={styles.orbital} viewBox="0 0 500 440" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-wire`} x1="100" y1="70" x2="373" y2="350" gradientUnits="userSpaceOnUse">
            <stop className={styles.wireStart} />
            <stop offset=".5" className={styles.wireMiddle} />
            <stop offset="1" className={styles.wireEnd} />
          </linearGradient>
          <radialGradient id={`${id}-fill`}>
            <stop stopColor="currentColor" stopOpacity=".03" />
            <stop offset=".68" stopColor="currentColor" stopOpacity=".03" />
            <stop offset="1" stopColor="currentColor" stopOpacity=".08" />
          </radialGradient>
          <radialGradient id={`${id}-halo`}>
            <stop stopColor="currentColor" stopOpacity=".12" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="250" cy="228" r="191" fill={gradient('halo')} />
        <ellipse className={styles.planetShadow} cx="250" cy="352" rx="148" ry="15" opacity=".65" />
        <g className={styles.orbitalMotion}>
          <g transform="translate(250 218) rotate(-27)">
            <ellipse rx="151" ry="151" fill={gradient('fill')} stroke={gradient('wire')} strokeWidth="1.1" />
            <g stroke={gradient('wire')} strokeWidth=".8" opacity=".9">
              <ellipse rx="143" ry="151" />
              <ellipse rx="121" ry="151" />
              <ellipse rx="88" ry="151" />
              <ellipse rx="46" ry="151" />
              <path d="M0-151V151" />
              <ellipse rx="151" ry="127" />
              <ellipse rx="151" ry="90" />
              <ellipse rx="151" ry="46" />
              <path d="M-151 0H151" />
              <ellipse cy="-130" rx="76" ry="20" />
              <ellipse cy="-106" rx="107" ry="28" />
              <ellipse cy="-72" rx="132" ry="35" />
              <ellipse cy="-36" rx="146" ry="40" />
              <ellipse cy="36" rx="146" ry="40" />
              <ellipse cy="72" rx="132" ry="35" />
              <ellipse cy="106" rx="107" ry="28" />
              <ellipse cy="130" rx="76" ry="20" />
            </g>
            <ellipse rx="209" ry="65" transform="rotate(-8)" stroke="currentColor" strokeWidth="1.4" />
            <ellipse rx="218" ry="70" transform="rotate(-8)" stroke="currentColor" strokeOpacity=".18" strokeWidth=".6" />
            <circle cx="-188" cy="53" r="6" fill="currentColor" />
            <circle cx="-188" cy="53" r="12" fill="currentColor" fillOpacity=".08" />
          </g>
        </g>
        <g className={styles.orbitDot}>
          <circle cx="430" cy="220" r="3" fill="currentColor" />
          <path d="M420 220h20M430 210v20" stroke="currentColor" strokeWidth=".7" opacity=".5" />
        </g>
        <path d="M59 305h25m-12-12v24M396 79h15m-7-7v14" stroke="currentColor" strokeWidth=".8" opacity=".5" />
        <circle cx="114" cy="80" r="2" fill="currentColor" opacity=".5" />
      </svg>
      <span className={styles.orbitCaption}>
        A CURIOUS MIND.<br />一个好奇的小宇宙
      </span>
      <button
        type="button"
        className={styles.motionToggle}
        aria-pressed={playing}
        aria-label={reducedMotion ? '已遵循系统设置减少动态效果' : playing ? '暂停星球动效' : '播放星球动效'}
        disabled={reducedMotion}
        onClick={() => setPaused(value => !value)}
      >
        {reducedMotion ? '静态星球' : <><span aria-hidden="true">{playing ? 'Ⅱ' : '▷'}</span>{playing ? '暂停' : '播放'}</>}
      </button>
    </div>
  );
}

export function Hero() {
  return (
    <section id="home" className={styles.hero} aria-labelledby="hero-title">
      <div className="container">
        <OrbitalPlanet />
        <p className={styles.heroLabel}>Portfolio &amp; Journal</p>
        <h1 className={`${styles.heroTitle} serif`} id="hero-title">
          <a href="#tools">创造者</a> <i>/</i> <a href="#essays">思考者</a> <i>/</i> <a href="#tutorials">探索者</a>
        </h1>
        <p className={styles.heroDesc}>
          我是一名热爱技术与创作的开发者，致力于探索技术与人文的交汇点。
          <br />
          在这里，我分享我的技术心得、思想随笔，以及精心打造的实用工具。
          <br />
          希望这份沉淀，能为你的旅程带来一丝灵感。
        </p>
        <nav className={styles.contentNav} aria-label="探索内容">
          <a href="#essays" className={styles.essayEntry}>
            <span className={styles.entryTitle}>随笔 <span aria-hidden="true">↓</span></span>
            <span className={styles.entryNote}>日常里的思考</span>
          </a>
          <a href="#tutorials" className={styles.tutorialEntry}>
            <span className={styles.entryTitle}>教程 <span aria-hidden="true">↓</span></span>
            <span className={styles.entryNote}>一步步学会</span>
          </a>
          <a href={toolboxHref} className={styles.toolEntry}>
            <span className={styles.entryTitle}>工具集 <span aria-hidden="true">↗</span></span>
            <span className={styles.entryNote}>让琐事轻一点</span>
          </a>
          <a href={collectionHref()} className={styles.shareEntry}>
            <span className={styles.entryTitle}>好的分享 <span aria-hidden="true">↗</span></span>
            <span className={styles.entryNote}>好文章与好去处</span>
          </a>
        </nav>
        <div className={styles.heroFoot}>
          <span className={styles.learningDot}>STAY CURIOUS. KEEP LEARNING.</span>
          <a className={styles.scroll} href="#essays">向下，发现更多 <span aria-hidden="true">↓</span></a>
        </div>
      </div>
    </section>
  );
}
