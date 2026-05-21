import { describe, it, expect } from 'vitest';
import { transformEssays, transformTutorials, transformTools } from './transformData';
import type { ApiEssay, ApiTutorial, ApiTool } from '../services/api';

describe('transformEssays', () => {
  it('maps API fields to UI shape and builds link from slug', () => {
    const input: ApiEssay[] = [
      {
        id: 7,
        documentId: 'doc-7',
        category: 'ESSAY',
        title: 'Hello',
        excerpt: 'World',
        date: '2024-01-15T00:00:00.000Z',
        slug: 'hello-world',
        published: true,
        createdAt: '',
        updatedAt: '',
      },
    ];
    const result = transformEssays(input);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('7');
    expect(result[0].category).toBe('ESSAY');
    expect(result[0].title).toBe('Hello');
    expect(result[0].excerpt).toBe('World');
    expect(result[0].link).toBe('/essays/hello-world');
    // date should be formatted (non-empty, not the raw ISO string)
    expect(result[0].date).toBeTruthy();
    expect(result[0].date).not.toBe('2024-01-15T00:00:00.000Z');
  });

  it('preserves each category value', () => {
    const categories: Array<ApiEssay['category']> = ['ESSAY', 'THOUGHTS', 'LIFESTYLE'];
    const input: ApiEssay[] = categories.map((category, i) => ({
      id: i + 1,
      documentId: `d${i}`,
      category,
      title: `T${i}`,
      excerpt: 'e',
      date: '2024-01-01',
      slug: `s${i}`,
      published: true,
      createdAt: '',
      updatedAt: '',
    }));
    const result = transformEssays(input);
    expect(result.map(r => r.category)).toEqual(categories);
  });

  it('returns empty array when given empty input', () => {
    expect(transformEssays([])).toEqual([]);
  });
});

describe('transformTutorials', () => {
  it('maps fields and composes status with chapter count', () => {
    const input: ApiTutorial[] = [
      {
        id: 2,
        documentId: 'd',
        title: 'React',
        description: 'desc',
        level: '初级',
        status: '进行中',
        chapters: 5,
        icon: 'code',
        slug: 'react',
        published: true,
        createdAt: '',
        updatedAt: '',
      },
    ];
    const result = transformTutorials(input);
    expect(result[0]).toEqual({
      id: '2',
      icon: 'code',
      title: 'React',
      description: 'desc',
      level: '初级',
      status: '进行中 (5 章)',
      link: '/tutorials/react',
    });
  });

  it('handles all icon enum values', () => {
    const icons: Array<ApiTutorial['icon']> = ['code', 'layers', 'zap'];
    const input: ApiTutorial[] = icons.map((icon, i) => ({
      id: i,
      documentId: `d${i}`,
      title: 't',
      description: 'd',
      level: 'L',
      status: 'S',
      chapters: 0,
      icon,
      slug: `s${i}`,
      published: true,
      createdAt: '',
      updatedAt: '',
    }));
    expect(transformTutorials(input).map(r => r.icon)).toEqual(icons);
  });

  it('returns empty array when given empty input', () => {
    expect(transformTutorials([])).toEqual([]);
  });
});

describe('transformTools', () => {
  it('maps fields and uses url as link', () => {
    const input: ApiTool[] = [
      {
        id: 9,
        documentId: 'd',
        title: 'Tool',
        description: 'desc',
        icon: 'search',
        url: 'https://example.com',
        slug: 'tool',
        createdAt: '',
        updatedAt: '',
      },
    ];
    const result = transformTools(input);
    expect(result[0]).toEqual({
      id: '9',
      icon: 'search',
      title: 'Tool',
      description: 'desc',
      link: 'https://example.com',
    });
  });

  it('handles all icon enum values', () => {
    const icons: Array<ApiTool['icon']> = ['barChart', 'droplet', 'fileText', 'search'];
    const input: ApiTool[] = icons.map((icon, i) => ({
      id: i,
      documentId: `d${i}`,
      title: 't',
      description: 'd',
      icon,
      url: `https://e.com/${i}`,
      slug: `s${i}`,
      createdAt: '',
      updatedAt: '',
    }));
    expect(transformTools(input).map(r => r.icon)).toEqual(icons);
  });

  it('returns empty array when given empty input', () => {
    expect(transformTools([])).toEqual([]);
  });
});
