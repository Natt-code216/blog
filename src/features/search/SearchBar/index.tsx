import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../services/api';
import { localTools } from '../../../services/toolCatalog';
import { categoryLabel, collectedSites, readingLinks, sourceDomain } from '../../../services/collectionCatalog';
import styles from './SearchBar.module.css';

interface IndexedItem {
  kind: '随笔' | '教程' | '工具' | '阅读' | '网站';
  title: string;
  description: string;
  to: string;
}

const builtInIndex: IndexedItem[] = [...localTools.map((tool): IndexedItem => ({
  kind: '工具',
  title: tool.title,
  description: tool.description,
  to: tool.href,
})), ...readingLinks.map((article): IndexedItem => ({
  kind: '阅读', title: article.title,
  description: `${article.originalTitle} · ${article.author} · ${categoryLabel(article.category)}`,
  to: article.url,
})), ...collectedSites.map((site): IndexedItem => ({
  kind: '网站', title: site.title,
  description: [sourceDomain(site.url), site.description].filter(Boolean).join(' · '),
  to: site.url,
}))];

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<IndexedItem[]>(builtInIndex);
  const [loadRequested, setLoadRequested] = useState(false);
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(false);
  const [articleError, setArticleError] = useState(false);
  const [toolError, setToolError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoadRequested(true);
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    const keepFocusInDialog = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialogRef.current?.contains(event.target)) {
        inputRef.current?.focus();
      }
    };
    document.addEventListener('focusin', keepFocusInDialog);
    return () => {
      document.removeEventListener('focusin', keepFocusInDialog);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

  // Closing the dialog does not cancel indexing; successful lists survive failures elsewhere.
  useEffect(() => {
    if (!loadRequested) return;
    let cancelled = false;
    setLoading(true);
    setArticleError(false);
    setToolError(false);
    void Promise.allSettled([api.getEssays(), api.getTutorials(), api.getTools()]).then(
      ([essays, tutorials, tools]) => {
        if (cancelled) return;
        const articles: IndexedItem[] = [
          ...(essays.status === 'fulfilled' ? essays.value.map((essay) => ({
            kind: '随笔' as const,
            title: essay.title,
            description: essay.excerpt || '',
            to: `/essays/${essay.slug}`,
          })) : []),
          ...(tutorials.status === 'fulfilled' ? tutorials.value.map((tutorial) => ({
            kind: '教程' as const,
            title: tutorial.title,
            description: tutorial.description || '',
            to: `/tutorials/${tutorial.slug}`,
          })) : []),
        ];
        const recommendations: IndexedItem[] = tools.status === 'fulfilled'
          ? tools.value.filter((tool) => tool.url && tool.url !== '#' && !localTools.some((local) => local.href === tool.url)).map((tool) => ({
            kind: '工具', title: tool.title, description: tool.description || '', to: tool.url,
          }))
          : [];
        setIndex([...articles, ...builtInIndex, ...recommendations]);
        setArticleError(essays.status === 'rejected' || tutorials.status === 'rejected');
        setToolError(tools.status === 'rejected');
        setLoading(false);
      },
    );
    return () => { cancelled = true; };
  }, [loadRequested, retry]);

  const results = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return index.slice(0, 20);
    return index.filter((item) =>
      `${item.title} ${item.description} ${item.kind}`.toLowerCase().includes(search)
    ).slice(0, 20);
  }, [query, index]);

  function trapFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab') return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input');
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <>
      <button
        className={styles.searchTrigger}
        onClick={() => setOpen(true)}
        aria-label="打开搜索 (Ctrl K)"
        title="搜索 (⌘ / Ctrl K)"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </button>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div
            ref={dialogRef}
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-label="搜索随笔、教程、工具和收藏"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={trapFocus}
          >
            <div className={styles.searchHeader}>
              <input
                ref={inputRef}
                className={styles.input}
                type="search"
                placeholder="搜索文章、工具、作者、收藏…"
                aria-label="搜索内容"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button className={styles.close} onClick={() => setOpen(false)} aria-label="关闭搜索">Esc <span aria-hidden="true">×</span></button>
            </div>
            <div className={styles.status} role="status">
              {loading ? '正在加载文章，工具与收藏已可搜索。' : articleError ? '部分文章内容暂时无法加载，工具与收藏仍可搜索。' : toolError ? '更多工具推荐暂时无法加载，工具与收藏仍可搜索。' : `显示 ${results.length} 项内容`}
              {!loading && (articleError || toolError) && <button onClick={() => setRetry((value) => value + 1)}>重试</button>}
            </div>
            <div className={styles.results}>
              {results.length === 0 ? (
                <div className={styles.empty}>{loading ? '正在寻找更多内容…' : '没有匹配的内容，换个关键词试试。'}</div>
              ) : (
                results.map((result) => {
                  const content = <><span className={styles.resultKind}>{result.kind}</span><span className={styles.resultCopy}><span>{result.title}</span><small>{result.description}</small></span><span className={styles.resultArrow} aria-hidden="true">↗</span></>;
                  const isCollection = result.kind === '阅读' || result.kind === '网站';
                  return result.kind === '工具' || isCollection ? (
                    <a key={`${result.kind}-${result.to}`} href={result.to} target={isCollection ? '_blank' : undefined} rel={isCollection ? 'noopener noreferrer' : undefined} onClick={() => setOpen(false)} className={styles.resultItem}>{content}{isCollection && <span className="sr-only">（在新标签页打开）</span>}</a>
                  ) : (
                    <Link key={`${result.kind}-${result.to}`} to={result.to} onClick={() => setOpen(false)} className={styles.resultItem}>{content}</Link>
                  );
                })
              )}
            </div>
            <div className={styles.hint}><span>Tab 切换 · Enter 打开</span><span>⌘ / Ctrl K 搜索</span></div>
          </div>
        </div>
      )}
    </>
  );
}
