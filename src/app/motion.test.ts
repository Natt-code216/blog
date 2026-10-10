import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

let motion: typeof import('./motion');
const mediaListeners = new Set<() => void>();
const preference = {
  matches: false,
  addEventListener: (_event: string, listener: () => void) => mediaListeners.add(listener),
};

beforeAll(async () => {
  vi.stubGlobal('matchMedia', vi.fn(() => preference));
  motion = await import('./motion');
});

beforeEach(() => {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  preference.matches = false;
  motion.setMotionPaused(false);
  localStorage.clear();
});

afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = ''; history.replaceState(null, '', '/'); });
afterAll(() => { vi.unstubAllGlobals(); localStorage.clear(); });

describe('shared motion preferences for main pages and tool documents', () => {
  it('persists user pauses and notifies both CSS and subscribed controls', () => {
    const listener = vi.fn();
    const unsubscribe = motion.subscribeMotion(listener);
    motion.toggleMotion();
    expect(motion.getMotionSnapshot()).toMatchObject({ paused: true, motionEnabled: false });
    expect(localStorage.getItem('blog-motion')).toBe('paused');
    expect(document.documentElement.dataset.motion).toBe('paused');
    expect(listener).toHaveBeenCalledTimes(1);
    motion.setMotionPaused(true);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    motion.toggleMotion();
    expect(document.documentElement.dataset.motion).toBe('playing');
    expect(localStorage.getItem('blog-motion')).toBe('playing');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('restores the choice on document navigation and receives another tab’s preference', () => {
    localStorage.setItem('blog-motion', 'paused');
    window.dispatchEvent(new Event('pageshow'));
    expect(motion.getMotionSnapshot().paused).toBe(true);
    localStorage.setItem('blog-motion', 'playing');
    window.dispatchEvent(new StorageEvent('storage', { key: 'blog-motion' }));
    expect(motion.getMotionSnapshot().motionEnabled).toBe(true);
    motion.setMotionPaused(true);
    localStorage.clear();
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    expect(motion.getMotionSnapshot().paused).toBe(false);
  });

  it('pauses in a hidden tab and resumes only when the user has not paused', () => {
    const visibility = vi.spyOn(document, 'visibilityState', 'get');
    visibility.mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(motion.getMotionSnapshot()).toMatchObject({ hidden: true, paused: false, motionEnabled: false });
    expect(document.documentElement.dataset.motionHidden).toBe('true');
    expect(localStorage.getItem('blog-motion')).toBeNull();
    visibility.mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(motion.getMotionSnapshot().motionEnabled).toBe(true);
    motion.setMotionPaused(true);
    visibility.mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    visibility.mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(motion.getMotionSnapshot()).toMatchObject({ hidden: false, paused: true, motionEnabled: false });
    expect(document.documentElement.dataset.motionHidden).toBe('false');
  });

  it('follows live system reduced-motion changes without overwriting the user’s choice', () => {
    preference.matches = true;
    mediaListeners.forEach(listener => listener());
    expect(motion.getMotionSnapshot()).toMatchObject({ reducedMotion: true, paused: false, motionEnabled: false });
    expect(localStorage.getItem('blog-motion')).toBeNull();
    preference.matches = false;
    mediaListeners.forEach(listener => listener());
    expect(motion.getMotionSnapshot().motionEnabled).toBe(true);
    motion.setMotionPaused(true);
    preference.matches = true;
    mediaListeners.forEach(listener => listener());
    preference.matches = false;
    mediaListeners.forEach(listener => listener());
    expect(motion.getMotionSnapshot().motionEnabled).toBe(false);
  });

  it('keeps the in-page pause when storage is blocked, including history restoration', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage denied'); });
    expect(() => motion.setMotionPaused(true)).not.toThrow();
    window.dispatchEvent(new Event('pageshow'));
    expect(motion.getMotionSnapshot().paused).toBe(true);
    expect(document.documentElement.dataset.motion).toBe('paused');
    motion.toggleMotion();
    expect(motion.getMotionSnapshot().motionEnabled).toBe(true);
  });

  it('keeps a stable snapshot for subscriptions and a static server snapshot', () => {
    expect(motion.getMotionSnapshot()).toBe(motion.getMotionSnapshot());
    expect(motion.getServerMotionSnapshot()).toBe(motion.getServerMotionSnapshot());
    expect(motion.getServerMotionSnapshot().motionEnabled).toBe(false);
  });

  it('connects the independent workbench switch to the shared preference without disturbing form input', async () => {
    history.replaceState(null, '', '/mini-tools/json-formatter.html');
    document.body.innerHTML = '<main><textarea aria-label="JSON 输入">{"draft": true}</textarea></main>';
    const input = document.querySelector('textarea')!;
    await import('../features/tools/workbench/init');
    const button = document.querySelector<HTMLButtonElement>('.motion-switch')!;
    expect(button).toHaveAttribute('aria-label', '暂停全站动效');
    button.click();
    expect(button).toHaveAttribute('aria-label', '播放全站动效');
    expect(motion.getMotionSnapshot().paused).toBe(true);
    expect(localStorage.getItem('blog-motion')).toBe('paused');
    expect(document.querySelector('textarea')).toBe(input);
    expect(input).toHaveValue('{"draft": true}');
    motion.setMotionPaused(false);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(document.querySelector('.theme-switch')).toHaveAttribute('aria-label', '切换到深色模式');
    expect(document.querySelector('.ambient-orbit')).toHaveAttribute('aria-hidden', 'true');
  });
});
