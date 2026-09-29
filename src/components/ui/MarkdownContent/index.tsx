import { useEffect, useMemo, useRef } from 'react';
import { renderMarkdown } from '../../../utils/renderMarkdown';
import styles from './MarkdownContent.module.css';

interface MarkdownContentProps {
  content?: string;
  emptyMessage?: string;
}

export function MarkdownContent({ content, emptyMessage = '正文正在整理中，欢迎稍后再来。' }: MarkdownContentProps) {
  const html = useMemo(() => renderMarkdown(content || ''), [content]);
  const contentRef = useRef<HTMLDivElement>(null);

  // A deep-linked chapter does not exist until the article request completes.
  useEffect(() => {
    if (!html || !window.location.hash) return;
    let id: string;
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (target && contentRef.current?.contains(target)) {
      target.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior });
    }
  }, [html]);

  return html
    ? <div ref={contentRef} className={styles.content} dangerouslySetInnerHTML={{ __html: html }} />
    : <p className={styles.empty}>{emptyMessage}</p>;
}
