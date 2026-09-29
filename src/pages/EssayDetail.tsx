import { useParams } from 'react-router-dom';
import { ArticleLayout, ArticleState } from '../components/layout/ArticleLayout';
import { MarkdownContent } from '../components/ui/MarkdownContent';
import { Comments } from '../features/comments/Comments';
import { api } from '../services/api';
import { useArticle } from './useArticle';

const categoryMap: Record<string, string> = { ESSAY: '随笔', THOUGHTS: '思考', LIFESTYLE: '生活' };
const fetchEssay = (slug: string) => api.getEssayBySlug(slug);
const shell = { kind: 'essay' as const, backTo: '/#essays', backLabel: '返回随笔列表' };

export function EssayDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: essay, loading, error, refetch } = useArticle(slug, fetchEssay);

  if (loading) return <ArticleState {...shell} state="loading" />;
  if (error) return <ArticleState {...shell} state="error" onRetry={refetch} />;
  if (!essay) return <ArticleState {...shell} state="notFound" missingMessage="没有找到这篇随笔。可能它还没发布，或者地址有误。" />;

  const date = new Date(essay.date);
  return (
    <ArticleLayout {...shell} title={essay.title} description={essay.excerpt} label="随笔"
      meta={<><span>{categoryMap[essay.category] || essay.category}</span>{!Number.isNaN(date.getTime()) && <time dateTime={essay.date}>{date.toLocaleDateString('zh-CN')}</time>}</>}
      afterContent={<Comments key={essay.documentId} essayDocumentId={essay.documentId} />}
    >
      <MarkdownContent content={essay.content} emptyMessage="正文尚未填写。" />
    </ArticleLayout>
  );
}
