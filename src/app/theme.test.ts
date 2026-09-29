import { afterEach, describe, expect, it, vi } from 'vitest';
import { getTheme, setTheme, subscribeTheme, toggleTheme } from './theme';

afterEach(() => {
  vi.restoreAllMocks();
  setTheme('dark');
  localStorage.clear();
});

describe('shared theme for main site and tool documents', () => {
  it('updates the rendered theme, persisted choice and subscribed controls together', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeTheme(listener);
    toggleTheme();
    expect(getTheme()).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
    expect(localStorage.getItem('blog-theme')).toBe('light');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    setTheme('dark');
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

  it('still switches when storage is blocked by the browser', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage denied'); });
    expect(() => setTheme('light')).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(getTheme()).toBe('light');
    window.dispatchEvent(new Event('pageshow'));
    expect(getTheme()).toBe('light');
  });

  it('keeps the in-page choice if storage cannot be read after history restoration', () => {
    setTheme('light');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage denied'); });
    window.dispatchEvent(new Event('pageshow'));
    expect(getTheme()).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
