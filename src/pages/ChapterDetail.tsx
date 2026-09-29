import { useParams } from 'react-router-dom';
import { ArticleLayout, ArticleState } from '../components/layout/ArticleLayout';
import { MarkdownContent } from '../components/ui/MarkdownContent';
import { TutorialSectionNav } from '../features/tutorials/TutorialSectionNav';
import { api } from '../services/api';
import { useArticle } from './useArticle';

const fetchChapter = (key: string) => {
  const separator = key.lastIndexOf('/');
  return api.getChapter(key.slice(0, separator), Number(key.slice(separator + 1)));
};

export function ChapterDetail() {
  const { slug, order } = useParams<{ slug: string; order: string }>();
  const validOrder = order && /^[1-9]\d*$/.test(order);
  const key = slug && validOrder ? `${slug}/${order}` : undefined;
  const { data: chapter, loading, error, refetch } = useArticle(key, fetchChapter);
  const shell = { kind: 'tutorial' as const, backTo: `/tutorials/${slug || ''}`, backLabel: '返回教程' };

  if (loading) return <ArticleState {...shell} state="loading" />;
  if (error) return <ArticleState {...shell} state="error" onRetry={refetch} />;
  if (!chapter) return <ArticleState {...shell} state="notFound" missingMessage="没有找到这一章。" />;

  return (
    <ArticleLayout {...shell} title={chapter.title} description="" label="教程章节"
      meta={<><span>第 {chapter.order} 章</span>{chapter.est_read_minutes && <span>{chapter.est_read_minutes} 分钟</span>}</>}
      sidebar={<TutorialSectionNav content={chapter.content || ''} />}
    >
      <MarkdownContent content={chapter.content} />
    </ArticleLayout>
  );
}
