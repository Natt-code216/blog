import axios from 'axios';

const API_URL = 'http://localhost:1337/api';

// 随笔类型
export interface ApiEssay {
  id: number;
  attributes: {
    category: 'ESSAY' | 'THOUGHTS' | 'LIFESTYLE';
    title: string;
    excerpt: string;
    date: string;
    slug: string;
    published: boolean;
  };
}

// 教程类型
export interface ApiTutorial {
  id: number;
  attributes: {
    title: string;
    description: string;
    level: string;
    status: string;
    chapters: number;
    icon: 'code' | 'layers' | 'zap';
    slug: string;
    published: boolean;
  };
}

// 工具类型
export interface ApiTool {
  id: number;
  attributes: {
    title: string;
    description: string;
    icon: 'barChart' | 'droplet' | 'fileText' | 'search';
    url: string;
    slug: string;
  };
}

class ApiService {
  // 随笔
  async getEssays(): Promise<ApiEssay[]> {
    const response = await axios.get(`${API_URL}/essays`, {
      params: { 'filters[published][$eq]': true, sort: 'date:desc' }
    });
    return response.data.data || [];
  }

  // 教程
  async getTutorials(): Promise<ApiTutorial[]> {
    const response = await axios.get(`${API_URL}/tutorials`, {
      params: { 'filters[published][$eq]': true, sort: 'createdAt:desc' }
    });
    return response.data.data || [];
  }

  // 工具
  async getTools(): Promise<ApiTool[]> {
    const response = await axios.get(`${API_URL}/tools`);
    return response.data.data || [];
  }
}

export const api = new ApiService();
export { ApiEssay, ApiTutorial, ApiTool };