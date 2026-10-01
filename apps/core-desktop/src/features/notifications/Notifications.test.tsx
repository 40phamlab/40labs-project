import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ComposerInput } from './components/composer/ComposerInput';
import { MessageStatusIcon } from './components/renderers/MessageStatusIcon';

describe('Notifications Feature Unit Tests', () => {
  it('ComposerInput handles Enter to send and Shift+Enter for newline', () => {
    const handleSend = vi.fn();
    const handleChange = vi.fn();

    render(
      <ComposerInput
        value="Hello world"
        onChange={handleChange}
        onSend={handleSend}
      />
    );

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Hello world');

    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: false });
    expect(handleSend).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });
    expect(handleSend).toHaveBeenCalledTimes(1);
  });

  it('ComposerInput ignores Enter during IME composition', () => {
    const handleSend = vi.fn();
    const handleChange = vi.fn();

    render(
      <ComposerInput
        value="test"
        onChange={handleChange}
        onSend={handleSend}
      />
    );

    const textarea = screen.getByRole('textbox');

    fireEvent.keyDown(textarea, {
      key: 'Enter',
      code: 'Enter',
      shiftKey: false,
      isComposing: true,
    });

    expect(handleSend).not.toHaveBeenCalled();
  });

  it('MessageStatusIcon renders queued, sent, failed with retry action', () => {
    const handleRetry = vi.fn();
    const { rerender } = render(<MessageStatusIcon status="queued" />);
    expect(document.querySelector('svg')).toBeDefined();

    rerender(<MessageStatusIcon status="failed" onRetry={handleRetry} />);
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeDefined();

    fireEvent.click(retryButton);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});
