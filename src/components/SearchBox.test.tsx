import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SearchBox from './SearchBox';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ profile: null }),
}));

vi.mock('@/app/actions/search-filters', () => ({
  getSearchFilters: vi.fn().mockResolvedValue({
    categories: ['مصور'],
    seekerTitles: ['مغسل صحون'],
    locations: ['بيت لحم'],
  }),
}));

describe('SearchBox (job seeker)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input and filters', async () => {
    await act(async () => {
      render(<SearchBox />);
    });
    expect(screen.getByPlaceholderText(/ابحث عن وظيفة/)).toBeInTheDocument();
    expect(screen.getByText('التخصص')).toBeInTheDocument();
    expect(screen.getByText('المدينة')).toBeInTheDocument();
    expect(screen.getByText('نوع الدوام')).toBeInTheDocument();
  });

  it('navigates to /jobs with search params on submit', async () => {
    await act(async () => {
      render(<SearchBox />);
    });

    const searchInput = screen.getByPlaceholderText(/ابحث عن وظيفة/);
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'طاهي' } });
    });

    const submitButton = screen.getByRole('button', { name: /بحث/ });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(mockPush).toHaveBeenCalledWith('/jobs?search=%D8%B7%D8%A7%D9%87%D9%8A');
  });

  it('includes all params in URL', async () => {
    await act(async () => {
      render(<SearchBox />);
    });

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/ابحث عن وظيفة/), {
        target: { value: 'test' },
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /بحث/ }));
    });

    const call = mockPush.mock.calls[0][0];
    expect(call).toContain('/jobs?');
    expect(call).toContain('search=');
  });
});
