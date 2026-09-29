import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { api } from '../../../services/api';
import { Comments } from './index';

vi.mock('../../../services/api', () => ({ api: { getCommentsByEssay: vi.fn(), postComment: vi.fn() } }));

beforeEach(() => { vi.resetAllMocks(); });

describe('Comments', () => {
  it('distinguishes a failed request from an empty list and retries', async () => {
    vi.mocked(api.getCommentsByEssay).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
    render(<Comments essayDocumentId="essay-1" />);
    expect(await screen.findByRole('alert')).toHaveTextContent('评论暂时没有加载成功');
    expect(screen.queryByText('还没有评论，来留下第一条吧。')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '重试加载评论' }));
    expect(await screen.findByText('还没有评论，来留下第一条吧。')).toBeInTheDocument();
    expect(api.getCommentsByEssay).toHaveBeenCalledTimes(2);
  });

  it('preserves the draft on submission failure and announces success on retry', async () => {
    vi.mocked(api.getCommentsByEssay).mockResolvedValue([]);
    vi.mocked(api.postComment).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(null);
    render(<Comments essayDocumentId="essay-1" />);
    await screen.findByText('还没有评论，来留下第一条吧。');
    fireEvent.change(screen.getByLabelText(/昵称/), { target: { value: '读者' } });
    fireEvent.change(screen.getByLabelText(/评论.*必填/), { target: { value: '我的想法' } });
    fireEvent.click(screen.getByRole('button', { name: '提交评论 ↗' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('你填写的内容已保留');
    expect(screen.getByLabelText(/评论.*必填/)).toHaveValue('我的想法');
    fireEvent.click(screen.getByRole('button', { name: '提交评论 ↗' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('评论已提交，稍后可刷新查看。'));
    expect(screen.getByLabelText(/评论.*必填/)).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
