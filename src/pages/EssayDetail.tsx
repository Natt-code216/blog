import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api, type ApiEssay } from '../services/api';
import { Comments } from '../components/Comments';
import styles from './DetailPage.module.css';

const categoryMap: Record<string, string> = {
  ESSAY: '随笔',
  THOUGHTS: '思考',
  LIFESTYLE: '生活',
};

export function EssayDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [essay, setEssay] = useState<ApiEssay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    api.getEssayBySlug(slug).then((data) => {
      if (!cancelled) {
        setEssay(data);
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

  if (!essay) {
    return (
      <div className={styles.detailPage}>
        <div className="container">
          <Helmet><title>未找到 · 我的空间</title></Helmet>
          <Link to="/" className={styles.backLink}>← 返回首页</Link>
          <div className={styles.notFound}>
            <h2 className="serif">404</h2>
            <p>没有找到这篇随笔。可能它还没发布，或者地址有误。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.detailPage}>
      <Helmet>
        <title>{essay.title} · 随笔</title>
        <meta name="description" content={essay.excerpt} />
        <meta property="og:title" content={essay.title} />
        <meta property="og:description" content={essay.excerpt} />
        <meta property="og:type" content="article" />
      </Helmet>

      <div className="container">
        <Link to="/#essays" className={styles.backLink}>← 返回随笔列表</Link>

        <div className={styles.meta}>
          <span>{categoryMap[essay.category] || essay.category}</span>
          <span>{new Date(essay.date).toLocaleDateString('zh-CN')}</span>
        </div>

        <h1 className={styles.title}>{essay.title}</h1>

        <div className={styles.content}>
          <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{essay.excerpt}</p>
          <hr className={styles.divider} />
          {essay.content ? (
            <div dangerouslySetInnerHTML={{ __html: renderRichText(essay.content) }} />
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>正文尚未填写。</p>
          )}
        </div>

        <Comments essayDocumentId={essay.documentId} />
      </div>
    </div>
  );
}

// Strapi 5 richtext 字段返回字符串（markdown）或 blocks 数组
// 这里用最小化的换行 → <p> 处理，避免引入完整 markdown 库
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
