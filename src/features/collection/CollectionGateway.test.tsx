import type { ReactNode } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CollectionGateway } from './CollectionGateway';

vi.mock('../../components/ui/ScrollReveal', () => ({
  ScrollReveal: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('../../components/ui/InteractiveSurface', () => ({
  InteractiveSurface: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('../../components/ui/LivingArtwork', () => ({
  LivingArtwork: ({ src, variant }: { src: string; variant: string }) => (
    <div aria-hidden="true" data-testid="live-artwork" data-src={src} data-variant={variant} />
  ),
}));

afterEach(cleanup);

function Location() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}{location.search}</span>;
}

function renderGateway() {
  const result = render(<MemoryRouter><CollectionGateway /><button>离开展区</button><Location /></MemoryRouter>);
  const entries = within(screen.getByRole('navigation', { name: '探索好的分享' }));
  return {
    reading: entries.getByRole('link', { name: /值得一读/ }),
    sites: entries.getByRole('link', { name: /私藏网站/ }),
    surface: result.container.querySelector('[data-art-surface]') as HTMLElement,
    outside: screen.getByRole('button', { name: '离开展区' }),
  };
}

function expectArtwork(variant: 'water' | 'stars') {
  expect(screen.getAllByTestId('live-artwork')).toHaveLength(1);
  expect(screen.getByTestId('live-artwork')).toHaveAttribute('data-variant', variant);
  expect(screen.getByTestId('live-artwork')).toHaveAttribute('data-src',
    variant === 'water' ? '/images/cosmic-waterlilies.webp' : '/images/cosmic-starry-field.webp');
}

describe('CollectionGateway artwork selection', () => {
  it('switches the single live painting on hover and restores water when the pointer leaves', () => {
    const { reading, sites, surface } = renderGateway();
    expectArtwork('water');
    fireEvent.pointerEnter(sites);
    expectArtwork('stars');
    fireEvent.pointerEnter(reading);
    expectArtwork('water');
    fireEvent.pointerEnter(sites);
    expectArtwork('stars');
    fireEvent.pointerLeave(surface);
    expectArtwork('water');
  });

  it('lets new focus replace stale hover and restores focused artwork after a later pointer leave', () => {
    const { reading, sites, surface, outside } = renderGateway();
    fireEvent.pointerEnter(reading);
    act(() => sites.focus());
    expectArtwork('stars');
    fireEvent.pointerEnter(reading);
    expectArtwork('water');
    fireEvent.pointerLeave(surface);
    expectArtwork('stars');
    act(() => outside.focus());
    expectArtwork('water');
  });

  it('falls back to the current hover when focus leaves and then to water when both leave', () => {
    const { reading, sites, surface, outside } = renderGateway();
    act(() => reading.focus());
    fireEvent.pointerEnter(sites);
    expectArtwork('stars');
    act(() => outside.focus());
    expectArtwork('stars');
    fireEvent.pointerLeave(surface);
    expectArtwork('water');
  });

  it('keeps both collection destinations directly linked and navigable', () => {
    const { reading, sites } = renderGateway();
    expect(reading).toHaveAttribute('href', '/collection?view=reading');
    expect(sites).toHaveAttribute('href', '/collection?view=sites');
    fireEvent.click(sites);
    expect(screen.getByTestId('location')).toHaveTextContent('/collection?view=sites');
    fireEvent.click(reading);
    expect(screen.getByTestId('location')).toHaveTextContent('/collection?view=reading');
  });
});
