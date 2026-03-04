import type { ApiEssay, ApiTutorial, ApiTool } from '../services/api';
import type { Essay, Tutorial, Tool } from '../types';

export function transformEssays(apiEssays: ApiEssay[]): Essay[] {
  return apiEssays.map(essay => ({
    id: essay.id.toString(),
    category: essay.attributes.category,
    date: formatDate(essay.attributes.date),
    title: essay.attributes.title,
    excerpt: essay.attributes.excerpt,
    link: `/essays/${essay.attributes.slug}`,
  }));
}

export function transformTutorials(apiTutorials: ApiTutorial[]): Tutorial[] {
  return apiTutorials.map(tutorial => ({
    id: tutorial.id.toString(),
    icon: tutorial.attributes.icon,
    title: tutorial.attributes.title,
    description: tutorial.attributes.description,
    level: tutorial.attributes.level,
    status: `${tutorial.attributes.status} (${tutorial.attributes.chapters} 章)`,
    link: `/tutorials/${tutorial.attributes.slug}`,
  }));
}

export function transformTools(apiTools: ApiTool[]): Tool[] {
  return apiTools.map(tool => ({
    id: tool.id.toString(),
    icon: tool.attributes.icon,
    title: tool.attributes.title,
    description: tool.attributes.description,
    link: tool.attributes.url,
  }));
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}