import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import earlyThemeScript from '../../public/theme.js?raw';
import { getServerTheme, getTheme, setTheme, subscribeTheme, toggleTheme } from './theme';

beforeEach(() => {
  setTheme('light');
  localStorage.clear();
  document.head.innerHTML = '<meta name="theme-color" content="#f7f8f3">';
});

afterEach(() => {
  vi.restoreAllMocks();
  setTheme('light');
  localStorage.clear();
  document.head.innerHTML = '';
});

describe('shared theme for main site and tool documents', () => {
  it('uses daylight without a stored preference and for the server snapshot', () => {
    window.dispatchEvent(new Event('pageshow'));
    expect(getTheme()).toBe('light');
    expect(getServerTheme()).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('blog-theme')).toBeNull();
  });

  it('updates the rendered theme, persisted choice and subscribed controls together', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeTheme(listener);
    toggleTheme();
    expect(getTheme()).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', '#080b0c');
    expect(localStorage.getItem('blog-theme')).toBe('dark');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    setTheme('light');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('syncs choices from another tab and when returning through browser history', () => {
    localStorage.setItem('blog-theme', 'light');
    window.dispatchEvent(new StorageEvent('storage', { key: 'blog-theme', newValue: 'light' }));
    expect(getTheme()).toBe('light');
    localStorage.setItem('blog-theme', 'dark');
    window.dispatchEvent(new Event('pageshow'));
    expect(getTheme()).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it.each([null, 'system', 'corrupted'])('returns to daylight for a missing or invalid saved value (%s)', saved => {
    setTheme('dark');
    if (saved === null) localStorage.removeItem('blog-theme');
    else localStorage.setItem('blog-theme', saved);
    window.dispatchEvent(new StorageEvent('storage', { key: 'blog-theme', newValue: saved }));
    expect(getTheme()).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('still switches when storage is blocked by the browser', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage denied'); });
    expect(() => setTheme('dark')).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(getTheme()).toBe('dark');
    window.dispatchEvent(new Event('pageshow'));
    expect(getTheme()).toBe('dark');
  });

  it('keeps the in-page choice if storage cannot be read after history restoration', () => {
    setTheme('light');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage denied'); });
    window.dispatchEvent(new Event('pageshow'));
    expect(getTheme()).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});

describe('theme before the first paint', () => {
  it.each([
    [null, 'light'], ['invalid', 'light'], ['light', 'light'], ['dark', 'dark'],
  ])('applies %s as %s before the app loads', (saved, expected) => {
    if (saved !== null) localStorage.setItem('blog-theme', saved);
    new Function(earlyThemeScript)();
    expect(document.documentElement.dataset.theme).toBe(expected);
    expect(document.documentElement.style.colorScheme).toBe(expected);
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute('content', expected === 'dark' ? '#080b0c' : '#f7f8f3');
  });

  it('starts in daylight even when the browser blocks local storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage denied'); });
    expect(() => new Function(earlyThemeScript)()).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });
});
