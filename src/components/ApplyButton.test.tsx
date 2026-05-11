import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ApplyButton from './ApplyButton';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/app/actions/applications', () => ({
  applyToJob: vi.fn(),
}));

import { applyToJob } from '@/app/actions/applications';

describe('ApplyButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows login prompt when not logged in', () => {
    render(<ApplyButton jobId="job-1" isLoggedIn={false} />);
    expect(screen.getByText('سجل دخولك للتقديم')).toBeInTheDocument();
  });

  it('redirects to login when clicked while not logged in', () => {
    render(<ApplyButton jobId="job-1" isLoggedIn={false} />);
    fireEvent.click(screen.getByText('سجل دخولك للتقديم'));
    expect(mockPush).toHaveBeenCalledWith('/auth/login?redirect=%2Fjobs%2Fjob-1');
  });

  it('shows apply text when logged in', () => {
    render(<ApplyButton jobId="job-1" isLoggedIn={true} />);
    expect(screen.getByText('قدم الآن')).toBeInTheDocument();
  });

  it('shows success state after successful application', async () => {
    vi.mocked(applyToJob).mockResolvedValue({ success: true });
    render(<ApplyButton jobId="job-1" isLoggedIn={true} />);

    fireEvent.click(screen.getByText('قدم الآن'));

    await waitFor(() => {
      expect(screen.getByText('تم التقديم بنجاح')).toBeInTheDocument();
    });
  });

  it('shows error message on failed application', async () => {
    vi.mocked(applyToJob).mockResolvedValue({ success: false, error: 'لقد تقدمت مسبقاً' });
    render(<ApplyButton jobId="job-1" isLoggedIn={true} />);

    fireEvent.click(screen.getByText('قدم الآن'));

    await waitFor(() => {
      expect(screen.getByText('لقد تقدمت مسبقاً')).toBeInTheDocument();
    });
  });

  it('shows loading state while applying', async () => {
    let resolveApply: (value: any) => void;
    vi.mocked(applyToJob).mockImplementation(
      () => new Promise((resolve) => { resolveApply = resolve; })
    );

    render(<ApplyButton jobId="job-1" isLoggedIn={true} />);
    fireEvent.click(screen.getByText('قدم الآن'));

    expect(screen.getByRole('button')).toBeDisabled();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();

    resolveApply!({ success: true });
  });
});
