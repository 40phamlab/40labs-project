import * as React from 'react';
import { Paperclip, Smile, Mic, Send } from 'lucide-react';
import { IconButton, Tooltip } from '@40labs/ui-components';
import type { MessageChannel, MessageAttachment } from '@40labs/types';
import { CHANNEL_CONFIGS } from '@40labs/types';
import { ComposerInput } from './ComposerInput';
import { AttachMenu } from './AttachMenu';
import { AttachmentTray } from './AttachmentTray';
import { VoiceRecorder } from './VoiceRecorder';
import { EmojiPicker } from './EmojiPicker';
import { useNotificationsStore } from '../../../../stores/useNotificationsStore';

export interface ComposerProps {
  notificationId: string;
  channel: MessageChannel;
  onSend: (text: string, attachmentIds: string[]) => void;
  className?: string;
}

export const Composer: React.FC<ComposerProps> = ({
  notificationId,
  channel,
  onSend,
  className = '',
}) => {
  const { drafts, setDraft, clearDraft } = useNotificationsStore();
  const text = drafts[notificationId] || '';

  const [attachments, setAttachments] = React.useState<MessageAttachment[]>([]);
  const [isAttachOpen, setIsAttachOpen] = React.useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = React.useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = React.useState(false);

  const channelCfg = CHANNEL_CONFIGS[channel] || CHANNEL_CONFIGS.amob;
  const capabilities = channelCfg.capabilities;

  // Check if MediaRecorder is supported for WebKitGTK / platform detection
  const hasMediaRecorder = typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined';

  const handleTextChange = (val: string) => {
    setDraft(notificationId, val);
  };

  const handleSend = () => {
    if (!text.trim() && attachments.length === 0) return;
    onSend(text.trim(), attachments.map((a) => a.id));
    clearDraft(notificationId);
    setAttachments([]);
    setIsAttachOpen(false);
    setIsEmojiOpen(false);
  };

  const handleAttachSaved = (att: MessageAttachment) => {
    setAttachments((prev) => [...prev, att]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleEmojiSelect = (emoji: string) => {
    setDraft(notificationId, text + emoji);
  };

  const hasContent = text.trim().length > 0 || attachments.length > 0;

  return (
    <div className={`p-3 bg-panel-strong/30 border-t border-border/30 shrink-0 flex flex-col gap-2 relative ${className}`}>
      <AttachmentTray attachments={attachments} onRemove={handleRemoveAttachment} />

      {isRecordingVoice ? (
        <VoiceRecorder
          messageId={`msg_draft_${Date.now()}`}
          onAudioRecorded={(att) => {
            setAttachments((prev) => [...prev, att]);
            setIsRecordingVoice(false);
          }}
          onCancel={() => setIsRecordingVoice(false)}
        />
      ) : (
        <div className="flex flex-col relative">
          {isAttachOpen && (
            <AttachMenu
              messageId={`msg_draft_${Date.now()}`}
              onAttachSaved={handleAttachSaved}
              onClose={() => setIsAttachOpen(false)}
            />
          )}

          {isEmojiOpen && (
            <EmojiPicker
              onSelect={handleEmojiSelect}
              onClose={() => setIsEmojiOpen(false)}
            />
          )}

          <div className="flex items-center gap-2 bg-panel px-3 py-2 rounded-card border border-border/40 shadow-2xs relative">
            {capabilities.images && channel !== 'sms' && (
              <Tooltip content="Attach file or media">
                <IconButton
                  icon={<Paperclip size={18} />}
                  label="Attach"
                  intent="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAttachOpen(!isAttachOpen);
                    setIsEmojiOpen(false);
                  }}
                  className="text-text-muted hover:text-text shrink-0"
                />
              </Tooltip>
            )}

            <Tooltip content="Emoji picker">
              <IconButton
                icon={<Smile size={18} />}
                label="Emoji"
                intent="ghost"
                size="sm"
                onClick={() => {
                  setIsEmojiOpen(!isEmojiOpen);
                  setIsAttachOpen(false);
                }}
                className="text-text-muted hover:text-text shrink-0"
              />
            </Tooltip>

            <ComposerInput
              value={text}
              onChange={handleTextChange}
              onSend={handleSend}
              placeholder={`Type a message via ${channelCfg.displayName}...`}
            />

            {hasContent ? (
              <IconButton
                icon={<Send size={15} className="text-white" />}
                label="Send message"
                intent="primary"
                size="md"
                onClick={handleSend}
                className="rounded-full w-8 h-8 bg-primary hover:bg-primary-hover flex items-center justify-center shrink-0"
              />
            ) : capabilities.audio && hasMediaRecorder ? (
              <Tooltip content="Record voice note">
                <IconButton
                  icon={<Mic size={18} />}
                  label="Record voice note"
                  intent="ghost"
                  size="sm"
                  onClick={() => setIsRecordingVoice(true)}
                  className="text-text-muted hover:text-text shrink-0"
                />
              </Tooltip>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
