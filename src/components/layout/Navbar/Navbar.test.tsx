import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { Navbar } from './index';
import { ThemeProvider } from '../../../app/providers/ThemeContext';

afterEach(cleanup);

describe('toolbox navigation', () => {
  it.each(['/', '/essays/example', '/tutorials/example', '/collection?view=sites'])('opens the tool document from %s', route => {
    const { container } = render(<MemoryRouter initialEntries={[route]}><ThemeProvider><Navbar /></ThemeProvider></MemoryRouter>);
    const link = screen.getByRole('link', { name: '工具集' });
    expect(link).toHaveAttribute('href', '/mini-tools/index.html');
    let intercepted: boolean | undefined;
    container.addEventListener('click', event => {
      intercepted = event.defaultPrevented;
      event.preventDefault();
    }, { once: true });
    fireEvent.click(link);
    expect(intercepted).toBe(false);
    expect(screen.getByRole('link', { name: '随笔' })).toHaveAttribute('href', route === '/' ? '#essays' : '/#essays');
    expect(screen.getByRole('link', { name: '好的分享' })).toHaveAttribute('href', '/collection?view=reading');
    if (route.startsWith('/collection')) expect(screen.getByRole('link', { name: '好的分享' })).toHaveAttribute('aria-current', 'page');
  });
});
