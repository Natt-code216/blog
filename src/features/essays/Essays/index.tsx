import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { ScrollReveal } from '../../../components/ui/ScrollReveal';
import { LivingArtwork } from '../../../components/ui/LivingArtwork';
import { useMotion } from '../../../app/providers/MotionContext';
import type { Essay } from '../../../types';
import { api } from '../../../services/api';
import { transformEssays } from '../../../utils/transformData';
import { useApiFetch } from '../../../hooks/useApiFetch';
import styles from './Essays.module.css';

const categoryLabels: Record<string, string> = {
  ESSAY: 'ESSAY / 随笔',
  THOUGHTS: 'THOUGHTS / 思考',
  LIFESTYLE: 'LIFESTYLE / 生活',
};

const artworks = [
  { src: '/images/cosmic-starry-field.webp', title: 'STARRY FIELD', color: '#a6bed8', variant: 'stars' as const },
  { src: '/images/cosmic-sunflower.webp', title: 'A SMALL SUN', color: '#e9c27c', variant: 'sunflower' as const },
  { src: '/images/cosmic-waterlilies.webp', title: 'QUIET WATERS', color: '#a9c9bb', variant: 'water' as const },
];

const number = (value: number) => String(value).padStart(2, '0');

function EssayGallery({ essays, motionEnabled }: { essays: Essay[]; motionEnabled: boolean }) {
  const [selected, setSelected] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [documentVisible, setDocumentVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  const galleryRef = useRef<HTMLDivElement>(null);
  const active = Math.min(selected, essays.length - 1);
  const current = essays[active];
  const hasNeighbors = essays.length > 1;
  const rotating = autoplay && motionEnabled && visible && documentVisible && !hovered && !focused && hasNeighbors;
  const previous = (active - 1 + essays.length) % essays.length;
  const next = (active + 1) % essays.length;
  const panels = [...new Set([previous, active, next])];

  useEffect(() => {
    const element = galleryRef.current;
    if (!element) return;
    const updateVisibility = () => setDocumentVisible(!document.hidden);
    document.addEventListener('visibilitychange', updateVisibility);
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
      setVisible(entries.some(entry => entry.isIntersecting));
    }, { threshold: 0.12 });
    observer?.observe(element);
    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(() => setSelected(value => (value + 1) % essays.length), 8000);
    return () => window.clearInterval(timer);
  }, [rotating, essays.length]);

  const browse = (index: number) => {
    setAutoplay(false);
    setSelected(index);
  };
  const move = (direction: number) => {
    setAutoplay(false);
    setSelected(value => (value + direction + essays.length) % essays.length);
  };
  const navigate = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || !hasNeighbors) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'Home') { event.preventDefault(); browse(0); }
    if (event.key === 'End') { event.preventDefault(); browse(essays.length - 1); }
  };

  return (
    <div ref={galleryRef} className={styles.gallery} data-art-surface role="region" aria-roledescription="轮播图"
      aria-label="随笔星际画廊" tabIndex={0} onKeyDown={navigate}
      onPointerEnter={event => { if (event.pointerType !== 'touch') setHovered(true); }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}>
      <div className={styles.galleryTopline} aria-hidden="true"><span>THOUGHTS, IN ORBIT.</span><span>星际画廊 / JOURNAL</span></div>
      <div className={styles.stage} aria-hidden="true">
        {panels.map(index => {
          const art = artworks[index % artworks.length];
          const position = index === active ? styles.centerPanel : index === previous ? styles.leftPanel : styles.rightPanel;
          return (
            <div key={essays[index].id} className={`${styles.painting} ${position}`} style={{ borderColor: `${art.color}55` }}>
              {index === active ? <LivingArtwork src={art.src} variant={art.variant} intensity={1.35} /> : <img src={art.src} alt="" width="1586" height="992" loading="lazy" decoding="async" />}
              <div className={styles.paintingShade} />
              <div className={styles.paintingLabel}><span>{art.title}</span><span>STUDY / {number(index + 1)}</span></div>
            </div>
          );
        })}
        <span className={styles.stageCoordinate}>N 31° / E 121°<br />AN INNER LANDSCAPE</span>
      </div>

      <div className={styles.caption}
        onPointerEnter={event => { if (event.pointerType !== 'touch') setAutoplay(false); }}
        onFocusCapture={() => setAutoplay(false)}>
        <div className={styles.captionHeading}>
          <div className={styles.essayMeta}><span>{categoryLabels[current.category] ?? current.category}</span><span>{current.date.replace(/\//g, '.')}</span></div>
          <h3 className="serif">{current.title}</h3>
        </div>
        <div className={styles.captionDetail}>
          <p>{current.excerpt}</p>
          <Link to={current.link} className={styles.featureRead} aria-label={`阅读当前随笔：${current.title}`}>走进这段思考 <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
      <p className="sr-only" role="status" aria-live={rotating ? 'off' : 'polite'}>第 {active + 1} / {essays.length} 篇：{current.title}</p>

      <div className={styles.controls}>
        <div className={styles.position}><span>{number(active + 1)}</span><i />{number(essays.length)}<span className={styles.keyboardHint}>← → 切换画作</span></div>
        <div className={styles.playControls}>
          {hasNeighbors && <button type="button" className={styles.autoplay} aria-pressed={autoplay}
            disabled={!motionEnabled} onClick={() => {
              if (!autoplay) {
                // An explicit play request takes precedence over the interaction
                // that activated this button. New pointer/focus entries pause it.
                setFocused(false);
                setHovered(false);
              }
              setAutoplay(value => !value);
            }}
            aria-label={!motionEnabled ? '动态效果已暂停，画廊可手动浏览' : autoplay ? '停止画廊轮播' : '播放画廊'}>
            <span aria-hidden="true">{autoplay && motionEnabled ? 'Ⅱ' : '▷'}</span>{!motionEnabled ? '静态浏览' : autoplay ? '停止轮播' : '播放画廊'}
          </button>}
          <span className={styles.playNote}>{autoplay && motionEnabled ? rotating ? '每 8 秒，遇见下一幅' : '正在浏览，轮播暂缓' : '按自己的节奏，看一看'}</span>
          <button type="button" className={styles.arrow} disabled={!hasNeighbors} aria-label="上一篇随笔" onClick={() => move(-1)}>←</button>
          <button type="button" className={styles.arrow} disabled={!hasNeighbors} aria-label="下一篇随笔" onClick={() => move(1)}>→</button>
        </div>
      </div>

      <ol className={styles.articleIndex} aria-label="随笔目录">
        {essays.map((essay, index) => (
          <li key={essay.id} className={index === active ? styles.selectedEntry : ''}>
            <Link to={essay.link} aria-label={`阅读全文：${essay.title}`} aria-current={index === active ? 'true' : undefined}
              onPointerEnter={event => { if (event.pointerType !== 'touch') browse(index); }} onFocus={() => browse(index)}>
              <span className={styles.indexNumber}>{number(index + 1)}</span>
              <span className={styles.indexText}><span>{essay.title}</span><small>{categoryLabels[essay.category] ?? essay.category}</small></span>
              <span className={styles.indexArrow} aria-hidden="true">↗</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Essays() {
  const { motionEnabled } = useMotion();
  const { data: essays, loading, error, refetch } = useApiFetch(() => api.getEssays().then(transformEssays));

  return (
    <section id="essays" className={styles.section} data-motion={motionEnabled ? 'on' : 'off'} aria-labelledby="essays-title" aria-busy={loading}>
      <div className="container">
        <ScrollReveal>
          <div className={`section-header ${styles.sectionHeader}`}>
            <div><div className="section-subtitle">01 / THE STELLAR GALLERY</div><h2 className="section-title serif" id="essays-title">思考与感悟</h2></div>
            <p className={styles.sectionNote}><span>有些宇宙，向内生长。</span>把日常的片刻，挂进一座星际画廊。</p>
          </div>
        </ScrollReveal>
        {loading ? (
          <div className={styles.statusMessage} role="status"><span className={styles.loadingSpinner} aria-hidden="true" /><p>正在翻开随笔…</p></div>
        ) : error ? (
          <div className={styles.statusMessage} role="status"><span className={styles.statusLabel}>JOURNAL / 随笔</span><p>随笔暂时没有加载成功。</p><button className={styles.retryButton} onClick={refetch}>重新加载 <span aria-hidden="true">↗</span></button></div>
        ) : essays.length === 0 ? (
          <div className={styles.statusMessage}><span className={styles.statusLabel}>A LITTLE SPACE FOR THOUGHTS</span><p>新的思考正在酝酿，随笔即将更新。</p></div>
        ) : <EssayGallery essays={essays} motionEnabled={motionEnabled} />}
      </div>
    </section>
  );
}
