import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api, type ApiTutorial } from '../services/api';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    api.getTutorialBySlug(slug).then((data) => {
      if (!cancelled) {
        setTutorial(data);
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
          <span>{tutorial.chapters} 章</span>
          <span>{status}</span>
        </div>

        <h1 className={styles.title}>{tutorial.title}</h1>

        <div className={styles.content}>
          <p style={{ color: 'var(--text-secondary)' }}>{tutorial.description}</p>
          <hr className={styles.divider} />
          {tutorial.content ? (
            <div dangerouslySetInnerHTML={{ __html: renderRichText(tutorial.content) }} />
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>
              正文尚未填写。可以在 Strapi 后台为这篇教程添加 content 字段内容，或参考{' '}
              <Link to="/" style={{ color: 'var(--text-primary)' }}>docs/tutorials/</Link>{' '}
              中的对应 markdown。
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
