import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337/api';

// 随笔类型 (Strapi 5 格式)
export interface ApiEssay {
  id: number;
  documentId: string;
  category: 'ESSAY' | 'THOUGHTS' | 'LIFESTYLE';
  title: string;
  excerpt: string;
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
  level: string;
  status: string;
  chapters: number;
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

class ApiService {
  // 随笔
  async getEssays(): Promise<ApiEssay[]> {
    const response = await axios.get(`${API_URL}/essays`, {
      params: { 'filters[published][eq]': true, 'sort[0]': 'date:desc' }
    });
    return response.data.data || [];
  }

  // 教程
  async getTutorials(): Promise<ApiTutorial[]> {
    const response = await axios.get(`${API_URL}/tutorials`, {
      params: { 'filters[published][eq]': true, 'sort[0]': 'createdAt:desc' }
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
