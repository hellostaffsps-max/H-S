import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CookieConsent from './CookieConsent';

describe('CookieConsent', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not render when consent already given', () => {
    localStorage.setItem('cookie-consent', 'accepted');
    const { container } = render(<CookieConsent />);
    expect(container.firstChild).toBeNull();
  });

  it('renders after delay when no consent stored', async () => {
    render(<CookieConsent />);
    expect(screen.queryByText(/ملفات تعريف الارتباط/)).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1600);
    });

    expect(screen.getByText(/ملفات تعريف الارتباط/)).toBeInTheDocument();
  });

  it('hides and stores accept when clicking accept', async () => {
    render(<CookieConsent />);
    
    await act(async () => {
      vi.advanceTimersByTime(1600);
    });

    const acceptButton = screen.getByText('موافق');
    expect(acceptButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(acceptButton);
    });

    expect(localStorage.getItem('cookie-consent')).toBe('accepted');
    expect(screen.queryByText(/ملفات تعريف الارتباط/)).not.toBeInTheDocument();
  });

  it('hides and stores decline when clicking decline', async () => {
    render(<CookieConsent />);
    
    await act(async () => {
      vi.advanceTimersByTime(1600);
    });

    const declineButton = screen.getByRole('button', { name: '' }); // X button has no text
    expect(declineButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(declineButton);
    });

    expect(localStorage.getItem('cookie-consent')).toBe('declined');
  });
});
