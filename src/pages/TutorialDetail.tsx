import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api, type ApiTutorial, type ApiChapter } from '../services/api';
import styles from './DetailPage.module.css';

const levelMap: Record<string, string> = {
  A_level: '入门',
  B_level: '中级',
  C_level: '高级',
  ALL: '通用',
};

export function TutorialDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [tutorial, setTutorial] = useState<ApiTutorial | null>(null);
  const [chapters, setChapters] = useState<ApiChapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.getTutorialBySlug(slug),
      api.getChaptersByTutorialSlug(slug),
    ]).then(([t, chs]) => {
      if (!cancelled) {
        setTutorial(t);
        setChapters(chs);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className={styles.detailPage}>
        <div className="container">
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className={styles.detailPage}>
        <div className="container">
          <Helmet><title>未找到 · 我的空间</title></Helmet>
          <Link to="/" className={styles.backLink}>← 返回首页</Link>
          <div className={styles.notFound}>
            <h2 className="serif">404</h2>
            <p>没有找到这篇教程。</p>
          </div>
        </div>
      </div>
    );
  }

  const status = tutorial.status?.startsWith('A') ? '更新中' : '已完结';

  return (
    <div className={styles.detailPage}>
      <Helmet>
        <title>{tutorial.title} · 教程</title>
        <meta name="description" content={tutorial.description} />
        <meta property="og:title" content={tutorial.title} />
        <meta property="og:description" content={tutorial.description} />
      </Helmet>

      <div className="container">
        <Link to="/#tutorials" className={styles.backLink}>← 返回教程列表</Link>

        <div className={styles.meta}>
          <span>{levelMap[tutorial.level] || tutorial.level}</span>
          <span>{tutorial.chaptersCount} 章</span>
          <span>{status}</span>
        </div>

        <h1 className={styles.title}>{tutorial.title}</h1>

        <div className={styles.content}>
          <p style={{ color: 'var(--text-secondary)' }}>{tutorial.description}</p>
          <hr className={styles.divider} />
          {tutorial.content ? (
            <div dangerouslySetInnerHTML={{ __html: renderRichText(tutorial.content) }} />
          ) : null}

          {chapters.length > 0 && (
            <div style={{ marginTop: '2.5rem' }}>
              <h2 className="serif" style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>章节</h2>
              <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {chapters.map((ch) => (
                  <li key={ch.id} style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--border-light)' }}>
                    <Link
                      to={`/tutorials/${tutorial.slug}/chapters/${ch.order}`}
                      style={{ color: 'var(--text-primary)', textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span>
                        <span style={{ color: 'var(--text-secondary)', marginRight: '0.8rem' }}>
                          {String(ch.order).padStart(2, '0')}
                        </span>
                        {ch.title}
                      </span>
                      {ch.est_read_minutes ? (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {ch.est_read_minutes} 分钟
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {!tutorial.content && chapters.length === 0 && (
            <p style={{ color: 'var(--text-muted)' }}>
              正文尚未填写。可以运行 <code>node scripts/sync-content.mjs</code> 把{' '}
              <code>content/</code> 下的 markdown 同步到 Strapi。
            </p>
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
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
