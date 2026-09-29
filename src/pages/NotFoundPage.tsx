import { ArticleState } from '../components/layout/ArticleLayout';

export function NotFoundPage() {
  return <ArticleState kind="page" state="notFound" backTo="/" backLabel="返回首页" />;
}
