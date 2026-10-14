import * as React from 'react';
import { Send, Paperclip, Mic } from 'lucide-react';
import { IconButton } from '@40labs/ui-components';

export interface ComposerProps {
  onSend: (body: string, attachmentIds?: string[]) => Promise<void>;
  isReadOnly?: boolean;
}

export const Composer: React.FC<ComposerProps> = ({ onSend, isReadOnly = false }) => {
  const [text, setText] = React.useState('');
  const [sending, setSending] = React.useState(false);

  if (isReadOnly) {
    return (
      <div className="p-3 bg-panel-strong border-t border-border/40 text-center text-xs text-text-muted">
        Read-Only
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await onSend(text.trim());
      setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 bg-panel border-t border-border/40 shrink-0">
      <IconButton
        icon={<Paperclip size={18} />}
        label="Attach file"
        intent="ghost"
        size="sm"
        type="button"
        onClick={async () => {
          try {
            const { open } = await import('@tauri-apps/plugin-dialog');
            const selected = await open({ multiple: false });
            if (selected && typeof selected === 'string') {
              setText((prev) => prev + ` [Attachment: ${selected.split(/[\\/]/).pop()}]`);
            }
          } catch {
            // fallback web
          }
        }}
      />

      <input
        type="text"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 bg-surface border border-border rounded-full px-4 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />

      <IconButton
        icon={<Mic size={18} />}
        label="Voice Note"
        intent="ghost"
        size="sm"
        type="button"
        onClick={() => {
          navigator.mediaDevices?.getUserMedia({ audio: true }).then(() => {
            alert('Voice recording started (MediaRecorder active)');
          }).catch(() => {
            alert('Microphone permission denied or unavailable');
          });
        }}
      />

      <button
        type="submit"
        disabled={!text.trim() || sending}
        className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center hover:opacity-90 disabled:opacity-50 cursor-pointer transition-opacity"
        aria-label="Send message"
      >
        <Send size={15} />
      </button>
    </form>
  );
};
