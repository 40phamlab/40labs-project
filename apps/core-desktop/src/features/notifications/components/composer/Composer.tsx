import * as React from 'react';
import { Send, Paperclip, Smile, Mic } from 'lucide-react';
import { IconButton } from '@40labs/ui-components';
import { ComposerInput } from './ComposerInput';
import { AttachMenu } from './AttachMenu';
import { AttachmentTray } from './AttachmentTray';
import { EmojiPicker } from './EmojiPicker';
import { VoiceRecorder } from './VoiceRecorder';
import type { MessageAttachment } from '@40labs/types';
import { useToast } from '../../../../hooks/useToast';

export interface ComposerProps {
  onSend: (body: string, attachmentIds?: string[]) => Promise<void>;
  isReadOnly?: boolean;
  attachments?: MessageAttachment[];
  onAddAttachment?: (att: MessageAttachment) => void;
  onRemoveAttachment?: (id: string) => void;
}

export const Composer: React.FC<ComposerProps> = ({
  onSend,
  isReadOnly = false,
  attachments: externalAttachments,
  onAddAttachment: externalAddAttachment,
  onRemoveAttachment: externalRemoveAttachment,
}) => {
  const { toast } = useToast();
  const [text, setText] = React.useState('');
  const [internalAttachments, setInternalAttachments] = React.useState<MessageAttachment[]>([]);
  const [showAttachMenu, setShowAttachMenu] = React.useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  const attachments = externalAttachments !== undefined ? externalAttachments : internalAttachments;
  const handleAddAttachment = externalAddAttachment || ((att) => setInternalAttachments((prev) => [...prev, att]));
  const handleRemoveAttachment = externalRemoveAttachment || ((id) => setInternalAttachments((prev) => prev.filter((a) => a.id !== id)));

  if (isReadOnly) {
    return (
      <div className="p-3 bg-panel border-t border-border/40 text-center text-xs text-text-muted font-ui">
        Read-only conversation.
      </div>
    );
  }

  const handleAttachSaved = (att: MessageAttachment) => {
    handleAddAttachment(att);
    setShowAttachMenu(false);
  };

  const handleSend = async () => {
    if ((!text.trim() && attachments.length === 0) || sending) return;
    setSending(true);
    try {
      const attIds = attachments.map((a) => a.id);
      await onSend(text.trim(), attIds.length > 0 ? attIds : undefined);
      setText('');
      if (externalRemoveAttachment) {
        attachments.forEach((a) => externalRemoveAttachment(a.id));
      } else {
        setInternalAttachments([]);
      }
    } catch (err) {
      console.error('Send reply error:', err);
      toast.error('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col bg-panel border-t border-border/40 shrink-0 relative">
      <AttachmentTray attachments={attachments} onRemove={handleRemoveAttachment} className="mx-3 mt-2" />
      {showVoiceRecorder && (
        <div className="mx-3 my-2">
          <VoiceRecorder
            messageId="temp"
            onAudioRecorded={(att) => {
              handleAttachSaved(att);
              setShowVoiceRecorder(false);
            }}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        </div>
      )}
      <div className="flex items-center gap-2 p-3 relative">
        <div className="relative">
          <IconButton
            icon={<Paperclip size={18} />}
            label="Attach file"
            intent="ghost"
            size="sm"
            type="button"
            onClick={() => {
              setShowAttachMenu((prev) => !prev);
              setShowEmojiPicker(false);
            }}
          />
          {showAttachMenu && (
            <AttachMenu
              messageId="temp"
              onAttachSaved={handleAttachSaved}
              onClose={() => setShowAttachMenu(false)}
            />
          )}
        </div>

        <div className="relative flex-1 flex items-center bg-surface border border-border rounded-full px-4 py-1.5 focus-within:ring-1 focus-within:ring-primary">
          <ComposerInput
            value={text}
            onChange={setText}
            onSend={handleSend}
            placeholder="Type a message..."
          />
          <IconButton
            icon={<Smile size={18} />}
            label="Emoji"
            intent="ghost"
            size="sm"
            type="button"
            onClick={() => {
              setShowEmojiPicker((prev) => !prev);
              setShowAttachMenu(false);
            }}
            className="text-text-muted hover:text-text-primary ml-1"
          />
          {showEmojiPicker && (
            <EmojiPicker
              onSelect={(emoji) => setText((prev) => prev + emoji)}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
        </div>

        {!text.trim() && attachments.length === 0 ? (
          <IconButton
            icon={<Mic size={18} />}
            label="Voice Note"
            intent="ghost"
            size="sm"
            type="button"
            onClick={() => setShowVoiceRecorder(true)}
          />
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center hover:opacity-90 disabled:opacity-50 cursor-pointer transition-opacity shrink-0"
            aria-label="Send message"
          >
            <Send size={15} />
          </button>
        )}
      </div>
    </div>
  );
};
