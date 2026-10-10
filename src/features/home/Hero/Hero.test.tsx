import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Hero } from './index';
import styles from './Hero.module.css';

interface SceneProps {
  playing: boolean;
  onReady?: () => void;
  onUnavailable?: () => void;
}

// Keep the real Hero and motion preference hook, replacing only the GPU boundary.
const scene = vi.hoisted(() => ({ props: null as SceneProps | null }));
vi.mock('./OrbitalScene', () => ({
  default: (props: SceneProps) => {
    scene.props = props;
    return null;
  },
}));

async function renderHero() {
  const result = render(<Hero />);
  // React.lazy resolves asynchronously on the first render, even with a mock.
  await waitFor(() => expect(scene.props).not.toBeNull());
  return result;
}

function mockMotionPreference(initial: boolean) {
  const listeners = new Set<() => void>();
  const preference = {
    matches: initial,
    addEventListener: vi.fn((_type: string, listener: () => void) => listeners.add(listener)),
    removeEventListener: vi.fn((_type: string, listener: () => void) => listeners.delete(listener)),
  };
  vi.stubGlobal('matchMedia', vi.fn(() => preference));

  return {
    listeners,
    setReducedMotion(value: boolean) {
      act(() => {
        preference.matches = value;
        listeners.forEach(listener => listener());
      });
    },
  };
}

beforeEach(() => { scene.props = null; });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Hero planet motion', () => {
  it('lets visitors pause and resume the planet', async () => {
    mockMotionPreference(false);
    await renderHero();

    const toggle = screen.getByRole('button', { name: '暂停星球动效' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(scene.props?.playing).toBe(true);
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: '播放星球动效' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('已暂停 · 让思绪停留片刻')).toBeInTheDocument();
    expect(scene.props?.playing).toBe(false);
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: '暂停星球动效' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('移动光标，改变观察的角度')).toBeInTheDocument();
    expect(scene.props?.playing).toBe(true);
  });

  it('starts static for reduced motion and reacts to changes in the system preference', async () => {
    const preference = mockMotionPreference(true);
    const { unmount } = await renderHero();

    const toggle = screen.getByRole('button', { name: '已遵循系统设置减少动态效果' });
    expect(toggle).toBeDisabled();
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(scene.props?.playing).toBe(false);
    expect(screen.getByText('静态星球 · 保持好奇')).toBeInTheDocument();

    preference.setReducedMotion(false);
    expect(toggle).toBeEnabled();
    expect(toggle).toHaveAttribute('aria-pressed', 'true');

    preference.setReducedMotion(true);
    expect(toggle).toBeDisabled();
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    unmount();
    expect(preference.listeners.size).toBe(0);
  });

  it('preserves a visitor’s pause choice when the system preference changes', async () => {
    const preference = mockMotionPreference(false);
    await renderHero();
    fireEvent.click(screen.getByRole('button', { name: '暂停星球动效' }));

    preference.setReducedMotion(true);
    preference.setReducedMotion(false);

    expect(screen.getByRole('button', { name: '播放星球动效' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('restores static artwork and disables motion controls when the GPU becomes unavailable', async () => {
    mockMotionPreference(false);
    const { container } = await renderHero();
    // The decorative fallback intentionally has no accessible role.
    const poster = container.querySelector(`.${styles.poster}`);
    expect(poster).not.toBeNull();
    expect(poster).not.toHaveClass(styles.posterHidden);

    act(() => scene.props?.onReady?.());
    expect(poster).toHaveClass(styles.posterHidden);
    act(() => scene.props?.onUnavailable?.());

    expect(poster).not.toHaveClass(styles.posterHidden);
    const toggle = screen.getByRole('button', { name: '当前展示静态星球' });
    expect(toggle).toBeDisabled();
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('静态星球 · 保持好奇')).toBeInTheDocument();
    expect(scene.props?.playing).toBe(false);
    expect(screen.getByRole('link', { name: '进入我的小宇宙' })).toHaveAttribute('href', '#essays');
  });
});
