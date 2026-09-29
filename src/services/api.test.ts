import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');

const mockedAxios = axios as unknown as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };

// Import after mock so that the api module uses the mocked axios.
import { api } from './api';

const API_URL = 'http://localhost:1337/api';

describe('api service', () => {
  beforeEach(() => {
    mockedAxios.get = vi.fn();
    mockedAxios.post = vi.fn();
  });

  describe('getEssays', () => {
    it('calls /essays with published filter and date desc sort', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { data: [{ id: 1 }] } });
      const result = await api.getEssays();
      expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL}/essays`, {
        params: { 'filters[published][$eq]': true, 'sort[0]': 'date:desc' },
      });
      expect(result).toEqual([{ id: 1 }]);
    });

    it('returns empty array when response data is missing', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: {} });
      const result = await api.getEssays();
      expect(result).toEqual([]);
    });
  });

  describe('getTutorials', () => {
    it('calls /tutorials in learning order, keeping creation date as a tie breaker', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { data: [{ id: 2 }] } });
      const result = await api.getTutorials();
      expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL}/tutorials`, {
        params: { 'filters[published][$eq]': true, 'sort[0]': 'order:asc', 'sort[1]': 'createdAt:desc' },
      });
      expect(result).toEqual([{ id: 2 }]);
    });

    it('returns empty array when response data is missing', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: {} });
      expect(await api.getTutorials()).toEqual([]);
    });
  });

  describe('getTools', () => {
    it('calls /tools without params', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { data: [{ id: 3 }] } });
      const result = await api.getTools();
      expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL}/tools`);
      expect(result).toEqual([{ id: 3 }]);
    });

    it('returns empty array when response data is missing', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: {} });
      expect(await api.getTools()).toEqual([]);
    });
  });

  describe.each([
    { endpoint: 'essays', method: 'getEssayBySlug' as const },
    { endpoint: 'tutorials', method: 'getTutorialBySlug' as const },
  ])('$method', ({ endpoint, method }) => {
    it('requests the exact published slug with Strapi equality operators', async () => {
      const article = { slug: 'second-story', published: true, content: '第二篇的正文' };
      mockedAxios.get.mockResolvedValueOnce({ data: { data: [article] } });

      expect(await api[method]('second-story')).toEqual(article);
      expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL}/${endpoint}`, {
        params: {
          'filters[slug][$eq]': 'second-story',
          'filters[published][$eq]': true,
          'pagination[limit]': 1,
        },
      });
    });

    it('does not substitute the first article when the server returns another slug', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: [{ slug: 'first-story', published: true, content: '不属于这个地址的正文' }] },
      });
      expect(await api[method]('missing-story')).toBeNull();
    });

    it('does not display an unpublished article or an empty response', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: { data: [{ slug: 'hidden-story', published: false }] } })
        .mockResolvedValueOnce({ data: { data: [] } });
      expect(await api[method]('hidden-story')).toBeNull();
      expect(await api[method]('missing-story')).toBeNull();
    });
  });

  describe('ping', () => {
    it('returns true on 200', async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 200 });
      const ok = await api.ping();
      expect(ok).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL}/tools`, { timeout: 3000 });
    });

    it('returns false on non-200', async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 500 });
      expect(await api.ping()).toBe(false);
    });

    it('returns false when axios throws', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('network'));
      expect(await api.ping()).toBe(false);
    });
  });

  describe('comments', () => {
    it('maps the Strapi authorName field for the reader interface', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { data: [{ id: 1, authorName: 'Natt', content: 'Hello' }] } });
      expect(await api.getCommentsByEssay('essay-document')).toEqual([expect.objectContaining({ author: 'Natt' })]);
      expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL}/comments`, {
        params: { 'filters[essay][documentId][$eq]': 'essay-document', 'sort[0]': 'createdAt:desc' },
      });
    });

    it('propagates a failed request instead of reporting an empty discussion', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('offline'));
      await expect(api.getCommentsByEssay('essay-document')).rejects.toThrow('offline');
    });

    it('submits the schema field authorName and normalizes the response', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { data: { id: 1, authorName: 'Natt', content: 'Hello' } } });
      const result = await api.postComment({ author: 'Natt', content: 'Hello', essayDocumentId: 'essay-document' });
      expect(mockedAxios.post).toHaveBeenCalledWith(`${API_URL}/comments`, {
        data: { authorName: 'Natt', content: 'Hello', email: undefined, essay: 'essay-document' },
      });
      expect(result?.author).toBe('Natt');
    });
  });
});
