import { useEffect, useState, FormEvent } from 'react';
import { api, type ApiComment } from '../../services/api';
import styles from '../../pages/DetailPage.module.css';

interface CommentsProps {
  essayDocumentId: string;
}

export function Comments({ essayDocumentId }: CommentsProps) {
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [author, setAuthor] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getCommentsByEssay(essayDocumentId).then((list) => {
      if (!cancelled) setComments(list);
    });
    return () => { cancelled = true; };
  }, [essayDocumentId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !content.trim()) {
      setMessage({ type: 'error', text: '请填写昵称和评论内容' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const created = await api.postComment({
        content,
        author,
        email: email || undefined,
        essayDocumentId,
      });
      if (created) {
        setComments((prev) => [created, ...prev]);
      } else {
        // 公开 Strapi 写权限通常未开启，给出友好提示
        setMessage({
          type: 'success',
          text: '评论已提交，等待审核后显示。',
        });
      }
      setContent('');
      if (!message) setMessage({ type: 'success', text: '提交成功。' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: '提交失败：可能是 Public 角色尚未开放评论 create 权限，或网络问题。',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.commentSection}>
      <h3 className="serif">评论</h3>

      <form className={styles.commentForm} onSubmit={submit}>
        <input
          type="text"
          placeholder="昵称 *"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          maxLength={40}
        />
        <input
          type="email"
          placeholder="邮箱（可选，不会公开）"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={80}
        />
        <textarea
          placeholder="说点什么... *"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={2000}
        />
        <button type="submit" disabled={submitting}>
          {submitting ? '提交中...' : '提交评论'}
        </button>
        {message && (
          <p className={`${styles.formMessage} ${styles[message.type]}`}>
            {message.text}
          </p>
        )}
      </form>

      {comments.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>还没有评论，来留下第一条吧。</p>
      ) : (
        <div className={styles.commentList}>
          {comments.map((c) => (
            <div key={c.id} className={styles.commentItem}>
              <div className={styles.commentMeta}>
                <span className={styles.commentAuthor}>{c.author}</span>
                <span>{new Date(c.createdAt).toLocaleString('zh-CN')}</span>
              </div>
              <div className={styles.commentContent}>{c.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
