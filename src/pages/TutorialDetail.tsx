import { useParams } from 'react-router-dom';
import { ArticleLayout, ArticleState } from '../components/layout/ArticleLayout';
import { MarkdownContent } from '../components/ui/MarkdownContent';
import { api } from '../services/api';
import { useArticle } from './useArticle';
import { TutorialSectionNav } from '../features/tutorials/TutorialSectionNav';

const levelMap: Record<string, string> = { A_level: '入门', B_level: '中级', C_level: '高级', ALL: '通用' };
const fetchTutorial = (slug: string) => api.getTutorialBySlug(slug);
const shell = { kind: 'tutorial' as const, backTo: '/#tutorials', backLabel: '返回教程列表' };

export function TutorialDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: tutorial, loading, error, refetch } = useArticle(slug, fetchTutorial);

  if (loading) return <ArticleState {...shell} state="loading" />;
  if (error) return <ArticleState {...shell} state="error" onRetry={refetch} />;
  if (!tutorial) return <ArticleState {...shell} state="notFound" missingMessage="没有找到这篇教程。可能它还没发布，或者地址有误。" />;

  const status = tutorial.status?.replace(/^[AB][\s_-]*/, '') || '更新中';
  return (
    <ArticleLayout {...shell} title={tutorial.title} description={tutorial.description} label="教程"
      meta={<><span>{levelMap[tutorial.level] || tutorial.level}</span><span>{tutorial.chapters} 章</span><span>{status}</span></>}
      sidebar={<TutorialSectionNav content={tutorial.content || ''} />}
    >
      <MarkdownContent content={tutorial.content} />
    </ArticleLayout>
  );
}
