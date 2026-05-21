import type { ApiEssay, ApiTutorial, ApiTool } from '../services/api';
import type { Essay, Tutorial, Tool } from '../types';

export function transformEssays(apiEssays: ApiEssay[]): Essay[] {
  return apiEssays.map(essay => ({
    id: essay.id.toString(),
    category: essay.category,
    date: formatDate(essay.date),
    title: essay.title,
    excerpt: essay.excerpt,
    link: `/essays/${essay.slug}`,
  }));
}

export function transformTutorials(apiTutorials: ApiTutorial[]): Tutorial[] {
  return apiTutorials.map(tutorial => ({
    id: tutorial.id.toString(),
    icon: tutorial.icon,
    title: tutorial.title,
    description: tutorial.description,
    level: tutorial.level,
    status: `${tutorial.status} (${tutorial.chapters} 章)`,
    link: `/tutorials/${tutorial.slug}`,
  }));
}

export function transformTools(apiTools: ApiTool[]): Tool[] {
  return apiTools.map(tool => ({
    id: tool.id.toString(),
    icon: tool.icon,
    title: tool.title,
    description: tool.description,
    link: tool.url,
  }));
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}