import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ScrollReveal } from '../../components/ui/ScrollReveal';
import { InteractiveSurface } from '../../components/ui/InteractiveSurface';
import { LivingArtwork } from '../../components/ui/LivingArtwork';
import { collectedSites, collectionHref, readingLinks } from '../../services/collectionCatalog';
import styles from './CollectionGateway.module.css';

export function CollectionGateway() {
  const [hovered, setHovered] = useState<'reading' | 'sites' | null>(null);
  const [focused, setFocused] = useState<'reading' | 'sites' | null>(null);
  const starsVisible = (hovered ?? focused ?? 'reading') === 'sites';
  return (
    <section id="collection" aria-labelledby="collection-title" className={styles.section}>
      <div className="container">
        <ScrollReveal>
          <div className="section-header">
            <div>
              <p className="section-subtitle">04 / GOOD FINDS</p>
              <h2 id="collection-title" className="section-title serif">好的分享</h2>
            </div>
            <p className="section-note"><span>A FEW THINGS WORTH KEEPING</span>值得反复打开的文字与去处。</p>
          </div>
        </ScrollReveal>
      </div>

      <ScrollReveal>
        <InteractiveSurface className={styles.scene} maxTilt={0.65}>
          <div className={styles.sceneInner} data-art-surface data-art={starsVisible ? 'stars' : 'water'}
            onPointerLeave={() => setHovered(null)}
            onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(null); }}>
          <div className={styles.artwork} aria-hidden="true">
            <div className={`${styles.painting} ${styles.waterlilies}`}>
              {!starsVisible ? <LivingArtwork src="/images/cosmic-waterlilies.webp" variant="water" intensity={1.25} /> : <img src="/images/cosmic-waterlilies.webp" alt="" width={1586} height={992} loading="lazy" />}
            </div>
            <div className={`${styles.painting} ${styles.starryField}`}>
              {starsVisible ? <LivingArtwork src="/images/cosmic-starry-field.webp" variant="stars" intensity={1.2} /> : <img src="/images/cosmic-starry-field.webp" alt="" width={1586} height={992} loading="lazy" />}
            </div>
          </div>
          <div className={styles.shade} aria-hidden="true" />

          <div className={`container ${styles.sceneContent}`}>
            <div className={styles.sceneTopline}>
              <span className={styles.eyebrow}><i aria-hidden="true" /> THE QUIET ORBIT</span>
              <span className={styles.artLabel} aria-hidden="true">
                <span className={styles.liliesLabel}>莫奈星池 · 04</span>
                <span className={styles.starsLabel}>星夜回声 · 04</span>
              </span>
            </div>

            <div className={styles.invitation}>
              <p className={styles.roomNote}>在这片星池，停留片刻。</p>
              <h3 className="serif">把偶然的相遇，<br /><span>留成宇宙里的回声。</span></h3>
              <p className={styles.description}>有些文字，读完仍有余音。<br />有些地方，偶然走进，就想再来。</p>
            </div>

            <nav className={styles.entries} aria-label="探索好的分享">
              <Link to={collectionHref('reading')} className={styles.entry} aria-label={`值得一读，${readingLinks.length} 篇精选文章`}
                onPointerEnter={event => { if (event.pointerType !== 'touch') setHovered('reading'); }} onFocus={() => { setHovered(null); setFocused('reading'); }}>
                <span className={styles.entryNumber} aria-hidden="true">01</span>
                <span className={styles.entryText}>
                  <span className={styles.entryName}>值得一读</span>
                  <span className={styles.entryNote}>让思绪，去往更远的地方。</span>
                </span>
                <span className={styles.entryMeta}><span>{String(readingLinks.length).padStart(2, '0')} ESSAYS</span><span className={styles.entryArrow} aria-hidden="true">↗</span></span>
              </Link>
              <Link to={collectionHref('sites')} className={`${styles.entry} ${styles.sitesEntry}`} aria-label={`私藏网站，${collectedSites.length} 个精选网站`}
                onPointerEnter={event => { if (event.pointerType !== 'touch') setHovered('sites'); }} onFocus={() => { setHovered(null); setFocused('sites'); }}>
                <span className={styles.entryNumber} aria-hidden="true">02</span>
                <span className={styles.entryText}>
                  <span className={styles.entryName}>私藏网站</span>
                  <span className={styles.entryNote}>推开一扇意想不到的窗。</span>
                </span>
                <span className={styles.entryMeta}><span>{String(collectedSites.length).padStart(2, '0')} WEBSITES</span><span className={styles.entryArrow} aria-hidden="true">↗</span></span>
              </Link>
            </nav>

            <div className={styles.closingNote} aria-hidden="true"><span>THE EXHIBITION ENDS. CURIOSITY DOESN'T.</span><span>展览到这里，好奇心继续。</span></div>
          </div>
          </div>
        </InteractiveSurface>
      </ScrollReveal>
    </section>
  );
}
