import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');

const mockedAxios = axios as unknown as { get: ReturnType<typeof vi.fn> };

// Import after mock so that the api module uses the mocked axios.
import { api } from './api';

const API_URL = 'http://localhost:1337/api';

describe('api service', () => {
  beforeEach(() => {
    mockedAxios.get = vi.fn();
  });

  describe('getEssays', () => {
    it('calls /essays with published filter and date desc sort', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { data: [{ id: 1 }] } });
      const result = await api.getEssays();
      expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL}/essays`, {
        params: { 'filters[published][eq]': true, 'sort[0]': 'date:desc' },
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
    it('calls /tutorials with published filter and createdAt desc sort', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { data: [{ id: 2 }] } });
      const result = await api.getTutorials();
      expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL}/tutorials`, {
        params: { 'filters[published][eq]': true, 'sort[0]': 'createdAt:desc' },
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
});
