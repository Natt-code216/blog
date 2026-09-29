import type { ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import styles from './ArticleLayout.module.css';

interface ArticleShellProps {
  kind: 'essay' | 'tutorial' | 'page';
  backTo: string;
  backLabel: string;
  children: ReactNode;
  sidebar?: ReactNode;
}

function ArticleShell({ kind, backTo, backLabel, children, sidebar }: ArticleShellProps) {
  return (
    <div className={`${styles.page} ${styles[kind]} ${sidebar ? styles.withSidebar : ''}`}>
      <div className={styles.column}>
        <Link to={backTo} className={styles.backLink}>← {backLabel}</Link>
        {children}
      </div>
      {sidebar && <aside className={styles.sidebar}>{sidebar}</aside>}
    </div>
  );
}

interface ArticleLayoutProps extends ArticleShellProps {
  title: string;
  description: string;
  label: string;
  meta: ReactNode;
  afterContent?: ReactNode;
}

export function ArticleLayout({ title, description, label, meta, afterContent, children, sidebar, ...shell }: ArticleLayoutProps) {
  return (
    <ArticleShell {...shell} sidebar={sidebar}>
      <Helmet>
        <title>{title} · {label} · 我的空间</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
      </Helmet>
      <article aria-labelledby="article-title">
        <header className={styles.header}>
          <p className={styles.eyebrow}>{shell.kind === 'essay' ? 'JOURNAL' : 'EDUCATION'} / {label}</p>
          <h1 id="article-title" className={styles.title}>{title}</h1>
          <div className={styles.meta}>{meta}</div>
          {description && <p className={styles.description}>{description}</p>}
        </header>
        <div className={styles.body}>{children}</div>
      </article>
      {afterContent}
    </ArticleShell>
  );
}

interface ArticleStateProps extends Omit<ArticleShellProps, 'children'> {
  state: 'loading' | 'error' | 'notFound';
  missingMessage?: string;
  onRetry?: () => void;
}

export function ArticleState({ state, onRetry, missingMessage = '这个页面不存在，或地址已经发生变化。', ...shell }: ArticleStateProps) {
  const title = state === 'loading' ? '正在加载内容' : state === 'error' ? '暂时无法加载内容' : '404';
  return (
    <ArticleShell {...shell}>
      <Helmet>
        <title>{state === 'notFound' ? '未找到页面' : title} · 我的空间</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className={styles.state} role={state === 'loading' ? 'status' : state === 'error' ? 'alert' : undefined}>
        {state === 'loading' && <span className={styles.spinner} aria-hidden="true" />}
        <h1>{title}</h1>
        {state === 'error' && <p>连接遇到了一点问题，请稍后重试。</p>}
        {state === 'notFound' && <p>{missingMessage}</p>}
        {state === 'error' && onRetry && <button className={styles.retryButton} onClick={onRetry}>重新加载</button>}
      </div>
    </ArticleShell>
  );
}
