import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Hero } from './index';

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

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Hero planet motion', () => {
  it('lets visitors pause and resume the planet', () => {
    mockMotionPreference(false);
    render(<Hero />);

    const toggle = screen.getByRole('button', { name: '暂停星球动效' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: '播放星球动效' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: '暂停星球动效' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('starts static for reduced motion and reacts to changes in the system preference', () => {
    const preference = mockMotionPreference(true);
    const { unmount } = render(<Hero />);

    const toggle = screen.getByRole('button', { name: '已遵循系统设置减少动态效果' });
    expect(toggle).toBeDisabled();
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    preference.setReducedMotion(false);
    expect(toggle).toBeEnabled();
    expect(toggle).toHaveAttribute('aria-pressed', 'true');

    preference.setReducedMotion(true);
    expect(toggle).toBeDisabled();
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    unmount();
    expect(preference.listeners.size).toBe(0);
  });

  it('preserves a visitor’s pause choice when the system preference changes', () => {
    const preference = mockMotionPreference(false);
    render(<Hero />);
    fireEvent.click(screen.getByRole('button', { name: '暂停星球动效' }));

    preference.setReducedMotion(true);
    preference.setReducedMotion(false);

    expect(screen.getByRole('button', { name: '播放星球动效' })).toHaveAttribute('aria-pressed', 'false');
  });
});
