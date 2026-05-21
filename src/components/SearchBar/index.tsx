import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import styles from './SearchBar.module.css';

interface IndexedItem {
  kind: '随笔' | '教程' | '工具';
  title: string;
  description: string;
  to: string;
}

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<IndexedItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // 键盘快捷键：Cmd/Ctrl + K 打开
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // 打开时聚焦 + 拉取索引（首次）
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    if (index.length === 0) {
      Promise.all([api.getEssays(), api.getTutorials(), api.getTools()]).then(
        ([essays, tutorials, tools]) => {
          const all: IndexedItem[] = [
            ...essays.map((e) => ({
              kind: '随笔' as const,
              title: e.title,
              description: e.excerpt || '',
              to: `/essays/${e.slug}`,
            })),
            ...tutorials.map((t) => ({
              kind: '教程' as const,
              title: t.title,
              description: t.description || '',
              to: `/tutorials/${t.slug}`,
            })),
            ...tools.map((t) => ({
              kind: '工具' as const,
              title: t.title,
              description: t.description || '',
              to: t.url || '#',
            })),
          ];
          setIndex(all);
        },
      );
    }
  }, [open, index.length]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return index.slice(0, 10);
    return index.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q),
    ).slice(0, 20);
  }, [query, index]);

  return (
    <>
      <button
        className={styles.searchTrigger}
        onClick={() => setOpen(true)}
        aria-label="打开搜索 (Ctrl K)"
        title="搜索 (Ctrl K)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </button>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              className={styles.input}
              type="text"
              placeholder="搜索随笔、教程、工具..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className={styles.results}>
              {results.length === 0 ? (
                <div className={styles.empty}>没有匹配的内容</div>
              ) : (
                results.map((r, i) => (
                  <Link
                    key={i}
                    to={r.to}
                    onClick={() => setOpen(false)}
                    className={styles.resultItem}
                  >
                    <span className={styles.resultKind}>{r.kind}</span>
                    {r.title}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
