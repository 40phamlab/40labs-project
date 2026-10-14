import * as React from 'react';
import type { Thread, NotificationMessage } from '@40labs/types';
import { MessageBubble } from './MessageBubble';
import { Composer } from './composer/Composer';
import { getInitials } from './ThreadListItem';
import { Archive, Trash2 } from 'lucide-react';

export interface ChatPaneProps {
  thread: Thread | null;
  messages: NotificationMessage[];
  onSendReply: (body: string, attachmentIds?: string[]) => Promise<void>;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ChatPane: React.FC<ChatPaneProps> = ({
  thread,
  messages,
  onSendReply,
  onArchive,
  onDelete,
}) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!thread) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-panel text-text-muted p-8 text-center">
        <p className="text-sm">No Conversation Selected</p>
      </div>
    );
  }

  const isReadOnly = thread.counterparty_type === 'gov' || thread.display_name.toUpperCase().includes('TMDA') || thread.display_name.toUpperCase().includes('TRA');

  return (
    <div className="flex-1 h-full flex flex-col bg-surface-secondary/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-panel border-b border-border/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
            {getInitials(thread.display_name)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-text-primary">{thread.display_name}</h3>
              {isReadOnly && <span className="px-1.5 py-0.5 rounded bg-warning/20 text-warning text-[9px] font-bold">Gov Read-Only</span>}
            </div>
            <span className="text-[10px] font-mono text-text-muted capitalize">{thread.counterparty_type} channel</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onArchive(thread.id)}
            className="p-1.5 rounded hover:bg-surface-hover text-text-muted hover:text-text-primary"
            title="Archive Thread"
          >
            <Archive size={16} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(thread.id)}
            className="p-1.5 rounded hover:bg-surface-hover text-text-muted hover:text-danger"
            title="Delete Thread"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Composer */}
      <Composer onSend={(body, atts) => onSendReply(body, atts)} isReadOnly={isReadOnly} />
    </div>
  );
};
