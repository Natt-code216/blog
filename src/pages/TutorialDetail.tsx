import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArticleLayout, ArticleState } from '../components/layout/ArticleLayout';
import { MarkdownContent } from '../components/ui/MarkdownContent';
import { api, type ApiChapter } from '../services/api';
import { useArticle } from './useArticle';
import { TutorialSectionNav } from '../features/tutorials/TutorialSectionNav';
import styles from './TutorialDetail.module.css';

const levelMap: Record<string, string> = { A_level: '入门', B_level: '中级', C_level: '高级', ALL: '通用' };
const fetchTutorial = (slug: string) => api.getTutorialBySlug(slug);
const shell = { kind: 'tutorial' as const, backTo: '/#tutorials', backLabel: '返回教程列表' };

export function TutorialDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: tutorial, loading, error, refetch } = useArticle(slug, fetchTutorial);
  const [chapters, setChapters] = useState<ApiChapter[]>([]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setChapters([]);
    api.getChaptersByTutorialSlug(slug).then(result => {
      if (!cancelled) setChapters(result);
    });
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return <ArticleState {...shell} state="loading" />;
  if (error) return <ArticleState {...shell} state="error" onRetry={refetch} />;
  if (!tutorial) return <ArticleState {...shell} state="notFound" missingMessage="没有找到这篇教程。可能它还没发布，或者地址有误。" />;

  const status = tutorial.status?.replace(/^[AB][\s_-]*/, '') || '更新中';
  return (
    <ArticleLayout {...shell} title={tutorial.title} description={tutorial.description} label="教程"
      meta={<><span>{levelMap[tutorial.level] || tutorial.level}</span><span>{tutorial.chaptersCount ?? tutorial.chapters ?? 0} 章</span><span>{status}</span></>}
      sidebar={<TutorialSectionNav content={tutorial.content || ''} />}
    >
      <MarkdownContent content={tutorial.content} />
      {chapters.length > 0 && (
        <section className={styles.chapterList} aria-labelledby="chapter-list-title">
          <h2 id="chapter-list-title">独立章节</h2>
          <ol>
            {chapters.map(chapter => (
              <li key={chapter.documentId || chapter.id}>
                <Link to={`/tutorials/${tutorial.slug}/chapters/${chapter.order}`}>
                  <span>{String(chapter.order).padStart(2, '0')} · {chapter.title}</span>
                  {chapter.est_read_minutes && <small>{chapter.est_read_minutes} 分钟</small>}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
    </ArticleLayout>
  );
}
