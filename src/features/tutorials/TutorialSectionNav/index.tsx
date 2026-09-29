import { useEffect, useMemo, useState } from 'react';
import { renderMarkdown } from '../../../utils/renderMarkdown';
import styles from './TutorialSectionNav.module.css';

interface ChapterLink { id: string; title: string }

/** Read the same sanitized chapter anchors that the article itself renders. */
export function getChapterLinks(content: string): ChapterLink[] {
  const parsed = new DOMParser().parseFromString(renderMarkdown(content), 'text/html');
  const seen = new Set<string>();
  return Array.from(parsed.querySelectorAll('nav[aria-label="章节目录"] a[href^="#"]')).flatMap(link => {
    let id: string;
    try { id = decodeURIComponent(link.getAttribute('href')!.slice(1)); } catch { return []; }
    const heading = parsed.getElementById(id);
    if (!id || !heading?.matches('h2, h3') || seen.has(id)) return [];
    seen.add(id);
    const title = heading.textContent?.trim() || link.textContent?.trim();
    return title ? [{ id, title }] : [];
  });
}

export function TutorialSectionNav({ content }: { content: string }) {
  const chapters = useMemo(() => getChapterLinks(content), [content]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (!chapters.length) return;
    const updateActive = () => {
      const firstHeading = document.getElementById(chapters[0].id);
      const rootStyle = getComputedStyle(document.documentElement);
      const navHeight = parseFloat(rootStyle.getPropertyValue('--nav-height')) || 80;
      // Both scroll-padding and heading scroll-margin affect where anchor jumps land.
      const threshold = (parseFloat(rootStyle.scrollPaddingTop) || navHeight + 30)
        + (firstHeading ? parseFloat(getComputedStyle(firstHeading).scrollMarginTop) || navHeight + 24 : navHeight + 24) + 8;
      let current = '';
      for (const chapter of chapters) {
        const heading = document.getElementById(chapter.id);
        if (heading && heading.getBoundingClientRect().top <= threshold + 36) current = chapter.id;
      }
      setActiveId(current);
    };
    updateActive();
    window.addEventListener('scroll', updateActive, { passive: true });
    window.addEventListener('resize', updateActive);
    return () => {
      window.removeEventListener('scroll', updateActive);
      window.removeEventListener('resize', updateActive);
    };
  }, [chapters]);

  if (!chapters.length) return null;
  return (
    <nav className={styles.nav} aria-label="本页章节快速跳转">
      <p className={styles.kicker}>ON THIS PAGE / 本页</p>
      <p className={styles.title}>快速跳转</p>
      <ol className={styles.list}>
        {chapters.map(({ id, title }, index) => (
          <li key={id}>
            <a href={`#${encodeURIComponent(id)}`} className={`${styles.link} ${activeId === id ? styles.active : ''}`}
              aria-current={activeId === id ? 'location' : undefined}>
              <span className={styles.number}>{String(index + 1).padStart(2, '0')}</span>
              <span>{title}</span>
            </a>
          </li>
        ))}
      </ol>
      <a className={styles.topLink} href="#article-title">返回标题 ↑</a>
    </nav>
  );
}
