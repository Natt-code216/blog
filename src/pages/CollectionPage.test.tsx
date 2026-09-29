import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { CollectionPage } from './CollectionPage';

afterEach(cleanup);

function HistoryControls() {
  const location = useLocation();
  const navigate = useNavigate();
  return <><span data-testid="url">{location.pathname}{location.search}</span><button onClick={() => navigate(-1)}>浏览器后退</button><button onClick={() => navigate(1)}>浏览器前进</button></>;
}

function renderCollection(url = '/collection') {
  return render(<HelmetProvider><MemoryRouter initialEntries={[url]}><CollectionPage /><HistoryControls /></MemoryRouter></HelmetProvider>);
}

describe('collection navigation', () => {
  it.each(['/collection', '/collection?view=unknown&topic=unknown'])('shows all articles for the default or unknown selection: %s', url => {
    renderCollection(url);
    const region = screen.getByRole('region', { name: '关于学习，也关于生活' });
    expect(within(region).getAllByRole('link')).toHaveLength(12);
    expect(screen.getByRole('button', { name: '全部 12' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('link', { name: /返回首页收藏区/ })).toHaveAttribute('href', '/#collection');
    const article = within(region).getByRole('link', { name: /如何自学困难的东西/ });
    expect(article).toHaveAttribute('href', 'https://jvns.ca/blog/2018/09/01/learning-skills-you-can-practice/');
    expect(article).toHaveAttribute('target', '_blank');
    expect(article).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('restores a shared topic on a fresh visit and retains it through browser back and forward', async () => {
    const user = userEvent.setup();
    renderCollection('/collection?view=reading&topic=writing');
    expect(screen.getByRole('status')).toHaveTextContent('表达与知识积累 · 2 篇');
    expect(screen.getByRole('heading', { name: '公开学习' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '学习与认知' }));
    expect(screen.getByTestId('url')).toHaveTextContent('topic=learning');
    expect(screen.queryByRole('heading', { name: '公开学习' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '私藏网站 3' }));
    expect(screen.getByTestId('url')).toHaveTextContent('/collection?view=sites');
    expect(screen.queryByRole('group', { name: '阅读主题' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '浏览器后退' }));
    expect(screen.getByRole('status')).toHaveTextContent('学习与认知 · 2 篇');
    expect(screen.getByRole('button', { name: '学习与认知' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: '浏览器前进' }));
    expect(screen.getByRole('status')).toHaveTextContent('3 个网站');
  });

  it('opens the website view directly and preserves the supplied destination fragment', async () => {
    const user = userEvent.setup();
    renderCollection('/collection?view=sites');
    const region = screen.getByRole('region', { name: '我的互联网书签' });
    expect(within(region).getAllByRole('link')).toHaveLength(3);
    expect(within(region).getByRole('link', { name: /完美小站/ })).toHaveAttribute('href', 'https://www.9eip.com/#term-80223');
    for (const link of within(region).getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
    await user.click(screen.getByRole('button', { name: '值得一读 12' }));
    await user.click(screen.getByRole('button', { name: '时间、人生与关系' }));
    expect(screen.getByRole('heading', { name: '人生短暂' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '所剩的尾声' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '全部 12' }));
    expect(screen.getByTestId('url')).not.toHaveTextContent('topic=');
    expect(screen.getByRole('status')).toHaveTextContent('全部阅读 · 12 篇');
  });
});
