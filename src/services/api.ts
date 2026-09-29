import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337/api';

// 随笔类型 (Strapi 5 格式)
export interface ApiEssay {
  id: number;
  documentId: string;
  category: 'ESSAY' | 'THOUGHTS' | 'LIFESTYLE';
  title: string;
  excerpt: string;
  content?: string;
  date: string;
  slug: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// 教程类型 (Strapi 5 格式)
export interface ApiTutorial {
  id: number;
  documentId: string;
  title: string;
  description: string;
  content?: string;
  level: string;
  status: string;
  chapters?: number;
  chaptersCount?: number;
  order?: number;
  icon: 'code' | 'layers' | 'zap';
  slug: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

// 工具类型 (Strapi 5 格式)
export interface ApiTool {
  id: number;
  documentId: string;
  title: string;
  description: string;
  icon: 'barChart' | 'droplet' | 'fileText' | 'search';
  url: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiChapter {
  id: number;
  documentId: string;
  title: string;
  order: number;
  content?: string;
  est_read_minutes?: number | null;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

// 评论类型
export interface ApiComment {
  id: number;
  documentId: string;
  content: string;
  author: string;
  email?: string;
  createdAt: string;
}

class ApiService {
  // 随笔列表
  async getEssays(): Promise<ApiEssay[]> {
    const response = await axios.get(`${API_URL}/essays`, {
      params: { 'filters[published][$eq]': true, 'sort[0]': 'date:desc' }
    });
    return response.data.data || [];
  }

  // 单篇随笔（按 slug）
  async getEssayBySlug(slug: string): Promise<ApiEssay | null> {
    const response = await axios.get(`${API_URL}/essays`, {
      params: { 'filters[slug][$eq]': slug, 'filters[published][$eq]': true, 'pagination[limit]': 1 }
    });
    const list: ApiEssay[] = response.data.data || [];
    // A missing or ignored filter must never make another article appear at this URL.
    return list.find(essay => essay.slug === slug && essay.published) || null;
  }

  // 教程列表
  async getTutorials(): Promise<ApiTutorial[]> {
    const response = await axios.get(`${API_URL}/tutorials`, {
      params: { 'filters[published][$eq]': true, 'sort[0]': 'order:asc', 'sort[1]': 'createdAt:desc' }
    });
    return response.data.data || [];
  }

  // 单篇教程（按 slug）
  async getTutorialBySlug(slug: string): Promise<ApiTutorial | null> {
    const response = await axios.get(`${API_URL}/tutorials`, {
      params: { 'filters[slug][$eq]': slug, 'filters[published][$eq]': true, 'pagination[limit]': 1 }
    });
    const list: ApiTutorial[] = response.data.data || [];
    return list.find(tutorial => tutorial.slug === slug && tutorial.published) || null;
  }

  async getChaptersByTutorialSlug(tutorialSlug: string): Promise<ApiChapter[]> {
    try {
      const response = await axios.get(`${API_URL}/chapters`, {
        params: {
          'filters[tutorial][slug][$eq]': tutorialSlug,
          'sort[0]': 'order:asc',
          'fields[0]': 'title',
          'fields[1]': 'order',
          'fields[2]': 'est_read_minutes',
          'fields[3]': 'slug',
        },
      });
      return response.data.data || [];
    } catch {
      return [];
    }
  }

  async getChapter(tutorialSlug: string, order: number): Promise<ApiChapter | null> {
    const response = await axios.get(`${API_URL}/chapters`, {
      params: {
        'filters[tutorial][slug][$eq]': tutorialSlug,
        'filters[order][$eq]': order,
        'pagination[limit]': 1,
      },
    });
    const list: ApiChapter[] = response.data.data || [];
    return list.find(chapter => chapter.order === order) || null;
  }

  // 工具列表
  async getTools(): Promise<ApiTool[]> {
    const response = await axios.get(`${API_URL}/tools`);
    return response.data.data || [];
  }

  // 某篇随笔下的评论
  async getCommentsByEssay(essayDocumentId: string): Promise<ApiComment[]> {
    const response = await axios.get(`${API_URL}/comments`, {
      params: {
        'filters[essay][documentId][$eq]': essayDocumentId,
        'sort[0]': 'createdAt:desc',
      },
    });
    const comments: Array<ApiComment & { authorName?: string }> = response.data.data || [];
    return comments.map(comment => ({ ...comment, author: comment.authorName || comment.author || '匿名访客' }));
  }

  // 提交评论
  async postComment(data: {
    content: string;
    author: string;
    email?: string;
    essayDocumentId: string;
  }): Promise<ApiComment | null> {
    try {
      const response = await axios.post(`${API_URL}/comments`, {
        data: {
          content: data.content,
          authorName: data.author,
          email: data.email,
          essay: data.essayDocumentId,
        },
      });
      const comment = response.data.data;
      return comment ? { ...comment, author: comment.authorName || comment.author || data.author } : null;
    } catch (err) {
      throw err;
    }
  }

  // 健康检查
  async ping(): Promise<boolean> {
    try {
      const res = await axios.get(`${API_URL}/tools`, { timeout: 3000 });
      return res.status === 200;
    } catch {
      return false;
    }
  }
}

export const api = new ApiService();
