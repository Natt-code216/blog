import type { ReactNode } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Essays } from '../../features/essays/Essays';
import { Tutorials } from '../../features/tutorials/Tutorials';
import { api } from '../../services/api';
import { ScrollToTop } from './index';

vi.mock('../../components/ui/ScrollReveal', () => ({ ScrollReveal: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('../../services/api', () => ({ api: { getEssays: vi.fn(), getTutorials: vi.fn() } }));

const scrollIntoView = vi.fn();
const scrollTo = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
  vi.stubGlobal('scrollTo', scrollTo);
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function renderAnchor(entry = '/#tools', pending = true) {
  return render(<MemoryRouter initialEntries={[entry]}>
    <ScrollToTop />
    <Link to="/essays/example">阅读文章</Link>
    <main><section id="essays" aria-busy={pending} /><section id="tools" /></main>
  </MemoryRouter>);
}

async function finishLoading() {
  await act(async () => { document.getElementById('essays')!.setAttribute('aria-busy', 'false'); });
}

describe('hash navigation after asynchronous content loads', () => {
  it('corrects the tools anchor after both preceding homepage lists finish', async () => {
    let finishEssays!: () => void;
    let finishTutorials!: () => void;
    vi.mocked(api.getEssays).mockImplementation(() => new Promise(resolve => { finishEssays = () => resolve([]); }));
    vi.mocked(api.getTutorials).mockImplementation(() => new Promise(resolve => { finishTutorials = () => resolve([]); }));
    render(<MemoryRouter initialEntries={['/#tools']}>
      <ScrollToTop /><main><Essays /><Tutorials /><section id="tools" /></main>
    </MemoryRouter>);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    await act(async () => finishEssays());
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    await act(async () => finishTutorials());
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
    expect(scrollIntoView.mock.instances.every(element => element.id === 'tools')).toBe(true);
    expect(scrollTo).not.toHaveBeenCalled();
    await act(async () => { document.querySelector('main')!.append(document.createElement('p')); });
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it.each(['wheel', 'touchstart', 'pointerdown', 'keydown'])('does not override user %s input while loading', async event => {
    renderAnchor();
    if (event === 'keydown') fireEvent.keyDown(window, { key: 'PageDown' });
    else window.dispatchEvent(new Event(event));
    await finishLoading();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('cleans up a pending correction when navigating to another page', async () => {
    renderAnchor();
    fireEvent.click(screen.getByRole('link', { name: '阅读文章' }));
    await finishLoading();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
  });

  it('respects reduced motion for initial and corrected scrolls', async () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList);
    renderAnchor();
    await finishLoading();
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
    expect(scrollIntoView.mock.calls.every(([options]) => options.behavior === 'instant')).toBe(true);
  });

  it.each(['/', '/#missing', '/#%E0%A4%A'])('safely resets the viewport for %s', entry => {
    renderAnchor(entry);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' });
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('does not wait for loading content after the target', async () => {
    render(<MemoryRouter initialEntries={['/#tools']}><ScrollToTop />
      <main><section id="tools" /><section id="essays" aria-busy="true" /></main>
    </MemoryRouter>);
    await finishLoading();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });
});
