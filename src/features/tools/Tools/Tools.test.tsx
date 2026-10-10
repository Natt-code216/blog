import type { ReactNode } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../../services/api';
import { Tools } from './index';

vi.mock('../../../components/ui/ScrollReveal', () => ({
  ScrollReveal: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('../../home/Exhibition/Sculpture', () => ({ Sculpture: () => null }));
vi.mock('../../../services/api', () => ({ api: { getTools: vi.fn() } }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.getTools).mockResolvedValue([]);
});
afterEach(cleanup);

describe('Tools category directory', () => {
  it('changes the visible tools and their destinations with pointer and keyboard selection', async () => {
    const user = userEvent.setup();
    render(<Tools />);
    const categories = within(screen.getByRole('group', { name: '工具分类' }));
    const code = categories.getByRole('button', { name: /代码与文字/ });
    const files = categories.getByRole('button', { name: /图像与文件/ });
    const daily = categories.getByRole('button', { name: /日常小事/ });

    expect(code).toHaveAttribute('aria-pressed', 'true');
    expect(await screen.findByRole('link', { name: /JSON 格式化/ }))
      .toHaveAttribute('href', '/mini-tools/json-formatter.html');
    expect(screen.queryByRole('link', { name: /PDF 合并/ })).not.toBeInTheDocument();

    await user.click(files);
    expect(files).toHaveAttribute('aria-pressed', 'true');
    expect(code).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('link', { name: /PDF 合并/ }))
      .toHaveAttribute('href', '/mini-tools/pdf-merger.html');
    expect(screen.getByRole('link', { name: /图片压缩 \/ 转换/ }))
      .toHaveAttribute('href', '/mini-tools/image-compressor.html');
    expect(screen.queryByRole('link', { name: /JSON 格式化/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /二维码生成/ })).not.toBeInTheDocument();

    await user.tab();
    expect(daily).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(daily).toHaveAttribute('aria-pressed', 'true');
    expect(files).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('link', { name: /二维码生成/ }))
      .toHaveAttribute('href', '/mini-tools/qrcode.html');
    expect(screen.getByRole('link', { name: /时间戳转换/ }))
      .toHaveAttribute('href', '/mini-tools/timestamp.html');
    expect(screen.queryByRole('link', { name: /PDF 合并/ })).not.toBeInTheDocument();
  });

  it('keeps all eleven local tools reachable across the categories when recommendations fail', async () => {
    vi.mocked(api.getTools).mockRejectedValue(new Error('Offline'));
    const user = userEvent.setup();
    render(<Tools />);

    expect(await screen.findByText('更多工具推荐暂时无法加载，以上工具仍可使用。'))
      .toBeVisible();
    expect(screen.getByRole('link', { name: '打开工具箱，11 个实用小工具' }))
      .toHaveAttribute('href', '/mini-tools/index.html');

    const destinations: string[] = [];
    for (const name of [/代码与文字/, /图像与文件/, /日常小事/]) {
      await user.click(screen.getByRole('button', { name }));
      const visibleTools = screen.getAllByRole('link').filter(link =>
        link.getAttribute('href')?.startsWith('/mini-tools/') &&
        link.getAttribute('href') !== '/mini-tools/index.html',
      );
      visibleTools.forEach(link => {
        expect(link).toBeVisible();
        destinations.push(link.getAttribute('href')!);
      });
    }

    expect(destinations).toHaveLength(11);
    expect(new Set(destinations)).toEqual(new Set([
      '/mini-tools/json-formatter.html',
      '/mini-tools/markdown-html.html',
      '/mini-tools/csv-json.html',
      '/mini-tools/base64.html',
      '/mini-tools/image-compressor.html',
      '/mini-tools/pdf-merger.html',
      '/mini-tools/pdf-splitter.html',
      '/mini-tools/image-to-pdf.html',
      '/mini-tools/qrcode.html',
      '/mini-tools/word-counter.html',
      '/mini-tools/timestamp.html',
    ]));
  });

  it('restores recommendations on retry without resetting the selected local category', async () => {
    vi.mocked(api.getTools).mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce([{
      id: 1, documentId: 'color-reference', title: '色彩参考库', description: '寻找配色灵感。',
      icon: 'droplet', url: 'https://example.com/colors', slug: 'color-reference',
      createdAt: '', updatedAt: '',
    }]);
    const user = userEvent.setup();
    render(<Tools />);
    await screen.findByRole('button', { name: '重试' });
    await user.click(screen.getByRole('button', { name: /图像与文件/ }));
    await user.click(screen.getByRole('button', { name: '重试' }));

    expect(await screen.findByRole('link', { name: /色彩参考库/ }))
      .toHaveAttribute('href', 'https://example.com/colors');
    expect(screen.getByRole('button', { name: /图像与文件/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('link', { name: /PDF 合并/ }))
      .toHaveAttribute('href', '/mini-tools/pdf-merger.html');
    expect(screen.queryByRole('link', { name: /JSON 格式化/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '重试' })).not.toBeInTheDocument();
  });
});
