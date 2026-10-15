import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ComposerInput } from './components/composer/ComposerInput';
import { MessageStatusIcon } from './components/renderers/MessageStatusIcon';
import { Composer } from './components/composer/Composer';
import { AttachmentTray } from './components/composer/AttachmentTray';
import { MessageBubble } from './components/MessageBubble';
import { MarkdownRenderer } from './components/renderers/MarkdownRenderer';
import { formatInlineText, sanitizeHtml } from './components/renderers/sanitize';
import { FilePreviewProvider } from '../../providers/FilePreviewProvider';
import type { MessageAttachment, NotificationMessage } from '@40labs/types';

describe('Notifications Feature Unit Tests', () => {
  afterEach(() => {
    cleanup();
  });

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

  it('Read-only thread shows read-only bar and no input', () => {
    const handleSend = vi.fn();
    render(<Composer onSend={handleSend} isReadOnly={true} />);
    expect(screen.getByText(/Read-only conversation/i)).toBeDefined();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('AttachmentTray renders attachments and allows removal', () => {
    const handleRemove = vi.fn();
    const mockAttachments: MessageAttachment[] = [
      {
        id: 'att_1',
        workspace_id: 'ws_1',
        branch_id: 'b_1',
        message_id: null,
        kind: 'file',
        file_name: 'report.pdf',
        mime_type: 'application/pdf',
        size_bytes: 10240,
        storage_path: 'attachments/ws_1/att_1',
        sha256: 'abc',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    render(<AttachmentTray attachments={mockAttachments} onRemove={handleRemove} />);
    expect(screen.getByText('report.pdf')).toBeDefined();

    const removeButton = screen.getByTitle('Remove attachment');
    fireEvent.click(removeButton);
    expect(handleRemove).toHaveBeenCalledWith('att_1');
  });

  it('MessageBubble renders queued status correctly', () => {
    const msg: NotificationMessage = {
      id: 'msg_1',
      workspace_id: 'ws_1',
      branch_id: 'b_1',
      notification_id: 'notif_1',
      thread_id: 'thread_1',
      direction: 'outgoing',
      content_type: 'text',
      body: 'Queued message',
      html_content: null,
      status: 'queued',
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    render(
      <FilePreviewProvider>
        <MessageBubble message={msg} />
      </FilePreviewProvider>
    );
    expect(screen.getByText('Queued message')).toBeDefined();
    expect(screen.getByText('🕒')).toBeDefined();
  });

  it('MarkdownRenderer renders receipt table and total correctly', () => {
    const markdownReceipt = `### Receipt #sale_44a
| Item | Qty | Price |
|---|---|---|
| Paracetamol | 3 | 1,500 |
**Total: TZS 4,500** — Cash`;

    render(<MarkdownRenderer content={markdownReceipt} />);
    expect(screen.getByText('Receipt #sale_44a')).toBeDefined();
    expect(screen.getByText('Paracetamol')).toBeDefined();
    expect(screen.getByText('Total: TZS 4,500')).toBeDefined();
  });

  it('Security sanitizer makes XSS payloads inert', () => {
    const xssScript = '<script>alert("xss")</script>';
    const sanitizedScript = sanitizeHtml(xssScript);
    expect(sanitizedScript).not.toContain('<script>');

    const xssImg = '<img src=x onerror=alert("xss")>';
    const sanitizedImg = sanitizeHtml(xssImg);
    expect(sanitizedImg).not.toContain('onerror');

    const unsafeLink = '[click](javascript:alert("xss"))';
    const formattedLink = formatInlineText(unsafeLink);
    expect(formattedLink).not.toContain('javascript:');
  });

  it('Guard: no bg-*/(10|20|30) on pane/area wrappers and pane roots have rounded-card & elevation-raised', () => {
    const modules = import.meta.glob<string>('./**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true });

    // Check ThreadList.tsx content
    const threadListCode = modules['./components/ThreadList.tsx'];
    expect(threadListCode).toBeDefined();
    expect(threadListCode).toContain('rounded-card');
    expect(threadListCode).toContain('elevation-raised');

    // Check NotificationsScreen.tsx content for right pane wrapper
    const screenCode = modules['./NotificationsScreen.tsx'];
    expect(screenCode).toBeDefined();
    expect(screenCode).toContain('rounded-card');
    expect(screenCode).toContain('elevation-raised');

    // Check no bg-*/(10|20|30) on pane/area wrappers across features/notifications/**
    const alphaBgRegex = /bg-[a-z-]+\/(10|20|30)\b/;

    for (const [filePath, content] of Object.entries(modules)) {
      if (filePath.includes('.test.')) continue;

      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (alphaBgRegex.test(line)) {
          // Check if it's explicitly allowed via comment or small inline element
          const isAllowed =
            line.includes('overlay-highlight') ||
            line.includes('/* overlay-highlight */') ||
            line.includes('role="alert"') ||
            line.includes('role="status"') ||
            line.includes('rounded-full') ||
            line.includes('selected');

          if (!isAllowed) {
            throw new Error(`Forbidden alpha background on area wrapper in ${filePath}:${idx + 1}: ${line.trim()}`);
          }
        }
      });
    }
  });
});
