import { useEffect, useId, useState, type FormEvent } from 'react';
import { api, type ApiComment } from '../../../services/api';
import styles from './Comments.module.css';

interface CommentsProps {
  essayDocumentId: string;
}

export function Comments({ essayDocumentId }: CommentsProps) {
  const formId = useId();
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [author, setAuthor] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    api.getCommentsByEssay(essayDocumentId).then(list => {
      if (!cancelled) setComments(list);
    }).catch(() => {
      if (!cancelled) setLoadError(true);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [essayDocumentId, attempt]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!author.trim() || !content.trim()) {
      setMessage({ type: 'error', text: '请填写昵称和评论内容。' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const created = await api.postComment({
        content: content.trim(),
        author: author.trim(),
        email: email.trim() || undefined,
        essayDocumentId,
      });
      if (created) setComments(previous => [created, ...previous]);
      setContent('');
      setMessage({ type: 'success', text: created ? '提交成功。' : '评论已提交，稍后可刷新查看。' });
    } catch {
      setMessage({ type: 'error', text: '评论暂时无法提交，请稍后再试。你填写的内容已保留。' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.section} aria-labelledby={`${formId}-heading`}>
      <h2 id={`${formId}-heading`}>交流与想法</h2>
      <p className={styles.intro}>读到这里，也欢迎留下你的想法。</p>
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.fields}>
          <label htmlFor={`${formId}-author`}>昵称 <span>（必填）</span>
            <input id={`${formId}-author`} name="author" autoComplete="nickname" value={author} onChange={event => setAuthor(event.target.value)} maxLength={40} required />
          </label>
          <label htmlFor={`${formId}-email`}>邮箱 <span>（选填）</span>
            <input id={`${formId}-email`} name="email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} maxLength={80} />
          </label>
        </div>
        <label htmlFor={`${formId}-content`}>评论 <span>（必填）</span>
          <textarea id={`${formId}-content`} name="content" placeholder="说点什么……" value={content} onChange={event => setContent(event.target.value)} maxLength={2000} required />
        </label>
        <div className={styles.actions}>
          <button type="submit" className={styles.submit} disabled={submitting}>{submitting ? '提交中…' : '提交评论 ↗'}</button>
          <span className={styles.count}>{content.length} / 2000</span>
        </div>
        {message && <p className={`${styles.message} ${styles[message.type]}`} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</p>}
      </form>

      {loading ? <p className={styles.hint} role="status">正在加载评论…</p> : loadError ? (
        <div className={styles.loadError} role="alert">
          <p>评论暂时没有加载成功。</p>
          <button className={styles.retry} onClick={() => setAttempt(value => value + 1)}>重试加载评论</button>
        </div>
      ) : comments.length === 0 ? <p className={styles.hint}>还没有评论，来留下第一条吧。</p> : (
        <ol className={styles.list}>
          {comments.map(comment => (
            <li key={comment.documentId || comment.id} className={styles.item}>
              <div className={styles.meta}>
                <span className={styles.author}>{comment.author}</span>
                <time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString('zh-CN')}</time>
              </div>
              <p className={styles.content}>{comment.content}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
