import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SiteFooter } from './site-footer';

describe('SiteFooter Newsletter Validation', () => {
  it('shows error when submitting empty email', () => {
    render(<SiteFooter />);
    const subscribeBtn = screen.getByRole('button', { name: /subscribe/i });

    fireEvent.click(subscribeBtn);

    const errorMsg = screen.getByRole('alert');
    expect(errorMsg).toHaveTextContent(/cannot be empty/i);
  });

  it('shows error for invalid email formats', () => {
    render(<SiteFooter />);
    const emailInput = screen.getByRole('textbox', { name: /email address for newsletter/i });
    const subscribeBtn = screen.getByRole('button', { name: /subscribe/i });

    fireEvent.change(emailInput, { target: { value: 'plainstring' } });
    fireEvent.click(subscribeBtn);
    expect(screen.getByRole('alert')).toHaveTextContent(/valid email address/i);

    fireEvent.change(emailInput, { target: { value: 'missingdomain@' } });
    fireEvent.click(subscribeBtn);
    expect(screen.getByRole('alert')).toHaveTextContent(/valid email address/i);
  });

  it('trims whitespace and accepts valid email', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    render(<SiteFooter />);
    const emailInput = screen.getByRole('textbox', { name: /email address for newsletter/i });
    const subscribeBtn = screen.getByRole('button', { name: /subscribe/i });

    fireEvent.change(emailInput, { target: { value: '  user@example.com  ' } });
    fireEvent.click(subscribeBtn);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/subscribed successfully/i);
    expect(consoleSpy).toHaveBeenCalledWith('Newsletter subscription submitted:', 'user@example.com');

    consoleSpy.mockRestore();
  });

  it('rejects input exceeding 254 characters', () => {
    render(<SiteFooter />);
    const emailInput = screen.getByRole('textbox', { name: /email address for newsletter/i });
    const subscribeBtn = screen.getByRole('button', { name: /subscribe/i });

    const longEmail = 'a'.repeat(250) + '@b.com'; // > 254 chars total
    fireEvent.change(emailInput, { target: { value: longEmail } });
    fireEvent.click(subscribeBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(/too long/i);
  });

  it('rejects HTML and script injection attempts', () => {
    render(<SiteFooter />);
    const emailInput = screen.getByRole('textbox', { name: /email address for newsletter/i });
    const subscribeBtn = screen.getByRole('button', { name: /subscribe/i });

    fireEvent.change(emailInput, { target: { value: '<script>alert(1)</script>@example.com' } });
    fireEvent.click(subscribeBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(/invalid characters/i);
  });

  it('submits successfully on Enter key press', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    render(<SiteFooter />);
    const emailInput = screen.getByRole('textbox', { name: /email address for newsletter/i });

    fireEvent.change(emailInput, { target: { value: 'enterkey@example.com' } });
    fireEvent.submit(emailInput);

    expect(screen.getByRole('status')).toHaveTextContent(/subscribed successfully/i);
    expect(consoleSpy).toHaveBeenCalledWith('Newsletter subscription submitted:', 'enterkey@example.com');

    consoleSpy.mockRestore();
  });
});
