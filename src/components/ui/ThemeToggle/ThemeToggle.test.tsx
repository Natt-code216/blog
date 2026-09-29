import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ThemeProvider } from '../../../app/providers/ThemeContext';
import { setTheme } from '../../../app/theme';
import { ThemeToggle } from './index';

beforeEach(() => { setTheme('light'); });
afterEach(() => { cleanup(); localStorage.clear(); });

describe('visible theme control', () => {
  it('offers night mode in daylight and daylight after switching', () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    const button = screen.getByRole('button', { name: '切换到深色模式' });
    expect(button).toHaveTextContent('夜间模式');
    fireEvent.click(button);
    expect(screen.getByRole('button', { name: '切换到浅色模式' })).toHaveTextContent('白天模式');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('blog-theme')).toBe('dark');
  });
});
