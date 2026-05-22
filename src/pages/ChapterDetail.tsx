import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api, type ApiChapter } from '../services/api';
import styles from './DetailPage.module.css';

export function ChapterDetail() {
  const { slug, order } = useParams<{ slug: string; order: string }>();
  const [chapter, setChapter] = useState<ApiChapter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug || !order) return;
    let cancelled = false;
    setLoading(true);
    api.getChapter(slug, parseInt(order, 10)).then((data) => {
      if (!cancelled) {
        setChapter(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [slug, order]);

  if (loading) {
    return (
      <div className={styles.detailPage}>
        <div className="container">
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className={styles.detailPage}>
        <div className="container">
          <Helmet><title>未找到章节 · 我的空间</title></Helmet>
          <Link to={`/tutorials/${slug}`} className={styles.backLink}>← 返回教程</Link>
          <div className={styles.notFound}>
            <h2 className="serif">404</h2>
            <p>没有找到这一章。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.detailPage}>
      <Helmet>
        <title>{chapter.title} · 教程</title>
      </Helmet>

      <div className="container">
        <Link to={`/tutorials/${slug}`} className={styles.backLink}>← 返回章节列表</Link>

        <div className={styles.meta}>
          <span>第 {chapter.order} 章</span>
          {chapter.est_read_minutes ? <span>{chapter.est_read_minutes} 分钟</span> : null}
        </div>

        <h1 className={styles.title}>{chapter.title}</h1>

        <div className={styles.content}>
          {chapter.content ? (
            <div dangerouslySetInnerHTML={{ __html: renderRichText(chapter.content) }} />
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>本章正文尚未同步。</p>
          )}
        </div>
      </div>
    </div>
  );
}

function renderRichText(raw: string): string {
  return raw
    .split(/\n\n+/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
