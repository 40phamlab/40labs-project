import * as React from 'react';
import {
  Panel,
  Avatar,
  Badge,
  Button,
  IconButton,
  Textarea,
  Tooltip,
} from '@40labs/ui-components';
import {
  Mail,
  Tag,
  CheckCircle2,
  Archive,
  Trash2,
  Send,
  MessageSquare,
  Paperclip,
  Image as ImageIcon,
  Link as LinkIcon,
  Mic,
  FileText,
  Video,
  X,
  Smile,
  Camera,
  User,
  BarChart2,
  AlertCircle,
} from 'lucide-react';
import type { Notification, NotificationCategory } from '@40labs/types';
import { CHANNEL_CONFIGS } from '@40labs/types';
import { CAN_REPLY_BY_CATEGORY } from '../replyPolicy';
import { ChannelBadge } from './ChannelIndicator';

export interface AttachmentItem {
  id: string;
  type: 'image' | 'file' | 'audio' | 'video' | 'link';
  name: string;
  size?: string;
  url?: string;
}

export interface NotificationDetailPanelProps {
  notification?: Notification | null;
  onMarkAsRead?: (id: string) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSendReply?: (id: string, replyText: string, attachments?: AttachmentItem[]) => void;
  className?: string;
}

const SENDER_TONES: Array<'primary' | 'accent' | 'danger' | 'neutral'> = [
  'primary',
  'accent',
  'danger',
  'neutral',
];

function getSenderTone(key: string): 'primary' | 'accent' | 'danger' | 'neutral' {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % SENDER_TONES.length;
  return SENDER_TONES[index];
}

const categoryBadgeVariants: Record<
  NotificationCategory,
  'warning' | 'primary' | 'neutral' | 'surface'
> = {
  gov: 'warning',
  customers: 'primary',
  marketing: 'neutral',
  business: 'surface',
};

interface MessageBubble {
  id: string;
  sender: 'incoming' | 'outgoing';
  senderName: string;
  text: string;
  timestamp: string;
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
}

function parseConversationMessages(notification: Notification): MessageBubble[] {
  const messages: MessageBubble[] = [];
  const rawBody = notification.body || '';
  const initialTime = formatTime(notification.received_at || notification.created_at);

  const parts = rawBody.split(/--- You replied \((.*?)\) ---/);

  const initialText = parts[0]?.trim() || notification.subject;
  messages.push({
    id: `${notification.id}-initial`,
    sender: 'incoming',
    senderName: notification.sender_name,
    text: initialText,
    timestamp: initialTime,
  });

  for (let i = 1; i < parts.length; i += 2) {
    const timeLabel = parts[i] || 'Just now';
    const replyText = parts[i + 1]?.trim() || '';
    if (replyText) {
      messages.push({
        id: `${notification.id}-reply-${i}`,
        sender: 'outgoing',
        senderName: 'You',
        text: replyText,
        timestamp: timeLabel,
      });
    }
  }

  return messages;
}

const getAttachmentIcon = (type: string) => {
  switch (type) {
    case 'image':
      return <ImageIcon size={13} className="text-primary" />;
    case 'audio':
      return <Mic size={13} className="text-accent" />;
    case 'video':
      return <Video size={13} className="text-warning" />;
    case 'link':
      return <LinkIcon size={13} className="text-info" />;
    default:
      return <FileText size={13} className="text-text-muted" />;
  }
};

export const NotificationDetailPanel: React.FC<NotificationDetailPanelProps> = ({
  notification,
  onMarkAsRead,
  onArchive,
  onDelete,
  onSendReply,
  className = '',
}) => {
  const [replyText, setReplyText] = React.useState('');
  const [attachments, setAttachments] = React.useState<AttachmentItem[]>([]);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const channel = notification?.channel || 'amob';
  const channelCfg = CHANNEL_CONFIGS[channel] || CHANNEL_CONFIGS.amob;
  const capabilities = channelCfg.capabilities;

  React.useEffect(() => {
    setReplyText('');
    setAttachments([]);
    setIsAttachMenuOpen(false);
  }, [notification?.id]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [notification?.body, notification?.id]);

  if (!notification) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-panel border border-border/40 rounded-card p-8 text-center ${className}`}>
        <Panel variant="flat" className="p-8 max-w-sm mx-auto flex flex-col items-center gap-3 bg-panel-strong/30 border border-border/30 rounded-card">
          <div className="w-12 h-12 rounded-full bg-panel-strong flex items-center justify-center text-text-muted">
            <Mail size={24} />
          </div>
          <h3 className="text-sm font-bold text-text">No Conversation Selected</h3>
          <p className="text-xs text-text-muted">
            Select a conversation from the inbox list to view the message thread and reply.
          </p>
        </Panel>
      </div>
    );
  }

  const senderKey = notification.sender_business_id ?? notification.sender_name;
  const tone = getSenderTone(senderKey);
  const canReply = CAN_REPLY_BY_CATEGORY[notification.category] ?? false;
  const messages = parseConversationMessages(notification);

  const handleAddAttachment = (type: 'image' | 'file' | 'audio' | 'video' | 'link') => {
    // Check capability
    if (
      (type === 'image' && !capabilities.images) ||
      ((type === 'file' || type === 'video') && !capabilities.files) ||
      (type === 'audio' && !capabilities.audio)
    ) {
      return; // Capability restricted
    }

    const id = Math.random().toString(36).substring(2, 9);
    let name = 'document.pdf';
    if (type === 'image') name = `photo_${Math.floor(Math.random() * 1000)}.png`;
    if (type === 'audio') name = `voice_memo_${Math.floor(Math.random() * 1000)}.wav`;
    if (type === 'video') name = `clip_${Math.floor(Math.random() * 1000)}.mp4`;
    if (type === 'link') name = 'https://portal.40labs.io/ref';

    setAttachments((prev) => [
      ...prev,
      {
        id,
        type,
        name,
        size: type === 'image' ? '1.2 MB' : type === 'file' ? '450 KB' : '2.4 MB',
      },
    ]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSendReply = () => {
    if ((!replyText.trim() && attachments.length === 0) || !notification) return;

    let fullText = replyText.trim();
    if (attachments.length > 0) {
      const attSummary = attachments.map((a) => `[Attachment: ${a.type} - ${a.name}]`).join('\n');
      fullText = fullText ? `${fullText}\n${attSummary}` : attSummary;
    }

    onSendReply?.(notification.id, fullText, attachments);
    setReplyText('');
    setAttachments([]);
    setIsAttachMenuOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const hasContent = replyText.trim().length > 0 || attachments.length > 0;

  return (
    <div className={`w-full h-full flex flex-col bg-panel border border-border/40 rounded-card overflow-hidden shadow-xs ${className}`}>
      {/* Compact Conversation Header */}
      <div className="bg-panel-strong/50 flex flex-col gap-2 p-3.5 border-b border-border/30 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Avatar name={notification.sender_name} tone={tone} size="md" />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold text-text truncate">
                  {notification.sender_name}
                </h2>
                {notification.sender_business_id && (
                  <span className="text-[10px] text-text-muted font-mono hidden sm:inline">
                    ({notification.sender_business_id})
                  </span>
                )}
                <ChannelBadge channel={channel} size="sm" />
              </div>
              <span className="text-[10px] text-text-muted flex items-center gap-1 font-mono">
                <MessageSquare size={11} /> {channelCfg.accessibleLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={categoryBadgeVariants[notification.category] || 'neutral'} size="sm">
              {notification.category}
            </Badge>

            <div className="flex items-center gap-1">
              {onMarkAsRead && notification.status === 'unread' && (
                <Tooltip content="Mark as read">
                  <Button
                    type="button"
                    intent="neutral"
                    size="sm"
                    onClick={() => onMarkAsRead(notification.id)}
                    className="h-7 text-[11px] px-2"
                    leftIcon={<CheckCircle2 size={12} />}
                  >
                    Read
                  </Button>
                </Tooltip>
              )}
              {onArchive && notification.status !== 'archived' && (
                <Tooltip content="Archive conversation">
                  <Button
                    type="button"
                    intent="neutral"
                    size="sm"
                    onClick={() => onArchive(notification.id)}
                    className="h-7 text-[11px] px-2"
                    leftIcon={<Archive size={12} />}
                  >
                    Archive
                  </Button>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip content="Delete conversation">
                  <IconButton
                    icon={<Trash2 size={13} />}
                    label="Delete"
                    intent="ghost"
                    size="sm"
                    onClick={() => onDelete(notification.id)}
                    className="text-danger hover:bg-danger/10"
                  />
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        {/* Conversation Subject Context Bar */}
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-panel-strong/30 border border-border/20 rounded-input">
          <span className="text-xs font-semibold text-text truncate">
            Subject: {notification.subject}
          </span>
          <span className="text-[10px] text-text-muted font-mono shrink-0">
            {new Date(notification.received_at || notification.created_at).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Continuous Message Thread Workspace (Primary Focus) */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
        {messages.map((msg) => {
          const isOutgoing = msg.sender === 'outgoing';
          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 max-w-[85%] ${
                isOutgoing ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div className="flex items-center gap-1.5 px-1">
                <span className="text-[10px] font-bold text-text-muted">
                  {msg.senderName}
                </span>
                <span className="text-[10px] text-text-muted">•</span>
                <span className="text-[10px] font-mono text-text-muted">{msg.timestamp}</span>
              </div>

              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap font-ui shadow-2xs ${
                  isOutgoing
                    ? 'bg-primary/15 text-text border border-primary/30 rounded-tr-sm'
                    : 'bg-panel-strong/60 text-text border border-border/30 rounded-tl-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {/* Related Entity Reference */}
        {notification.related_entity_type && (
          <div className="my-2">
            <Panel
              variant="flat"
              className="p-2.5 bg-panel-strong/30 border border-border/30 rounded-card flex items-center justify-between text-xs shrink-0"
            >
              <div className="flex items-center gap-2 text-text-muted">
                <Tag size={13} />
                <span>
                  Related Entity: <strong className="text-text">{notification.related_entity_type}</strong>
                </span>
                {notification.related_entity_id && (
                  <span className="font-mono text-[11px]">({notification.related_entity_id})</span>
                )}
              </div>
            </Panel>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* WhatsApp-Style Simple Chat Input at bottom */}
      <div className="p-3 bg-panel-strong/30 border-t border-border/30 shrink-0">
        {canReply ? (
          <div className="flex flex-col gap-2 relative">
            {/* Capability Warning Banner if restricted */}
            {(!capabilities.images || !capabilities.files || !capabilities.audio) && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-warning/10 border border-warning/30 rounded text-[11px] text-text-muted">
                <AlertCircle size={13} className="text-warning shrink-0" />
                <span>
                  {channelCfg.displayName} channel does not support{' '}
                  {!capabilities.images ? 'images/files' : 'attachments'}. Text messages only.
                </span>
              </div>
            )}

            {/* Attachment Preview Tray */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-panel rounded-card border border-border/40 shadow-2xs">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-1.5 bg-panel-strong/80 border border-border/30 px-2.5 py-1 rounded-full text-xs text-text shadow-2xs"
                  >
                    {getAttachmentIcon(att.type)}
                    <span className="max-w-[140px] truncate">{att.name}</span>
                    {att.size && <span className="text-[10px] text-text-muted">({att.size})</span>}
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="text-text-muted hover:text-danger ml-0.5 transition-colors"
                      title="Remove attachment"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* WhatsApp Attachment Popup Menu */}
            {isAttachMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2.5 w-52 bg-panel border border-border/40 rounded-card shadow-xl py-1.5 z-50 flex flex-col gap-0.5 animate-fadeIn">
                <Tooltip content={capabilities.files ? 'Attach document' : `${channelCfg.displayName} channel does not support file attachments`} position="right">
                  <button
                    type="button"
                    disabled={!capabilities.files}
                    onClick={() => { handleAddAttachment('file'); setIsAttachMenuOpen(false); }}
                    className={`flex items-center gap-3 px-3.5 py-2 text-xs w-full text-left transition-colors ${capabilities.files ? 'text-text hover:bg-panel-strong/60' : 'text-text-muted/40 cursor-not-allowed'}`}
                  >
                    <FileText size={16} className={capabilities.files ? 'text-primary' : 'text-text-muted/40'} />
                    <span>Document</span>
                  </button>
                </Tooltip>

                <Tooltip content={capabilities.images ? 'Attach photos & videos' : `${channelCfg.displayName} channel does not support image attachments`} position="right">
                  <button
                    type="button"
                    disabled={!capabilities.images}
                    onClick={() => { handleAddAttachment('image'); setIsAttachMenuOpen(false); }}
                    className={`flex items-center gap-3 px-3.5 py-2 text-xs w-full text-left transition-colors ${capabilities.images ? 'text-text hover:bg-panel-strong/60' : 'text-text-muted/40 cursor-not-allowed'}`}
                  >
                    <ImageIcon size={16} className={capabilities.images ? 'text-accent' : 'text-text-muted/40'} />
                    <span>Photos & videos</span>
                  </button>
                </Tooltip>

                <Tooltip content={capabilities.images ? 'Take photo with camera' : `${channelCfg.displayName} channel does not support camera capture`} position="right">
                  <button
                    type="button"
                    disabled={!capabilities.images}
                    onClick={() => { handleAddAttachment('image'); setIsAttachMenuOpen(false); }}
                    className={`flex items-center gap-3 px-3.5 py-2 text-xs w-full text-left transition-colors ${capabilities.images ? 'text-text hover:bg-panel-strong/60' : 'text-text-muted/40 cursor-not-allowed'}`}
                  >
                    <Camera size={16} className={capabilities.images ? 'text-danger' : 'text-text-muted/40'} />
                    <span>Camera</span>
                  </button>
                </Tooltip>

                <Tooltip content={capabilities.audio ? 'Record audio' : `${channelCfg.displayName} channel does not support audio messages`} position="right">
                  <button
                    type="button"
                    disabled={!capabilities.audio}
                    onClick={() => { handleAddAttachment('audio'); setIsAttachMenuOpen(false); }}
                    className={`flex items-center gap-3 px-3.5 py-2 text-xs w-full text-left transition-colors ${capabilities.audio ? 'text-text hover:bg-panel-strong/60' : 'text-text-muted/40 cursor-not-allowed'}`}
                  >
                    <Mic size={16} className={capabilities.audio ? 'text-warning' : 'text-text-muted/40'} />
                    <span>Audio</span>
                  </button>
                </Tooltip>

                <Tooltip content="Share contact" position="right">
                  <button
                    type="button"
                    onClick={() => { handleAddAttachment('file'); setIsAttachMenuOpen(false); }}
                    className="flex items-center gap-3 px-3.5 py-2 text-xs text-text hover:bg-panel-strong/60 transition-colors text-left"
                  >
                    <User size={16} className="text-info" />
                    <span>Contact</span>
                  </button>
                </Tooltip>

                <Tooltip content="Create poll" position="right">
                  <button
                    type="button"
                    onClick={() => { handleAddAttachment('file'); setIsAttachMenuOpen(false); }}
                    className="flex items-center gap-3 px-3.5 py-2 text-xs text-text hover:bg-panel-strong/60 transition-colors text-left"
                  >
                    <BarChart2 size={16} className="text-success" />
                    <span>Poll</span>
                  </button>
                </Tooltip>
              </div>
            )}

            {/* WhatsApp-Style Pill Input Bar */}
            <div className="flex items-center gap-2 bg-panel px-3 py-2 rounded-full border border-border/40 shadow-2xs">
              {/* Attachment Plus / Paperclip Button */}
              <Tooltip content={capabilities.images || capabilities.files ? 'Attach' : 'Attachments not supported on this channel'}>
                <IconButton
                  icon={<Paperclip size={18} />}
                  label="Attach"
                  intent="ghost"
                  size="sm"
                  onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                  className="text-text-muted hover:text-text hover:bg-panel-strong/50 shrink-0"
                />
              </Tooltip>

              {/* Emoji Button */}
              <Tooltip content="Emoji">
                <IconButton
                  icon={<Smile size={18} />}
                  label="Emoji"
                  intent="ghost"
                  size="sm"
                  onClick={() => {
                    setReplyText((prev) => prev + ' 👍');
                  }}
                  className="text-text-muted hover:text-text hover:bg-panel-strong/50 shrink-0"
                />
              </Tooltip>

              {/* Text Input */}
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Type a message via ${channelCfg.displayName}...`}
                className="flex-1 text-xs min-h-[36px] max-h-[100px] resize-none border-0 bg-transparent py-1 px-1 focus:ring-0 shadow-none leading-relaxed"
              />

              {/* Right Action: Send Button when typing/has attachment, Microphone when empty */}
              {hasContent ? (
                <IconButton
                  icon={<Send size={14} className="text-white" />}
                  label="Send message"
                  intent="primary"
                  size="md"
                  onClick={handleSendReply}
                  className="shrink-0 rounded-full w-8 h-8 bg-primary hover:bg-primary-hover shadow-xs flex items-center justify-center"
                />
              ) : (
                <Tooltip content={capabilities.audio ? 'Record voice note' : 'Voice notes not supported on this channel'}>
                  <IconButton
                    icon={<Mic size={18} />}
                    label="Record voice note"
                    intent="ghost"
                    size="sm"
                    onClick={() => {
                      if (capabilities.audio) handleAddAttachment('audio');
                    }}
                    className={`shrink-0 ${capabilities.audio ? 'text-text-muted hover:text-text hover:bg-panel-strong/50' : 'text-text-muted/30 cursor-not-allowed'}`}
                  />
                </Tooltip>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-text-muted italic text-center py-1.5">
            This sender channel does not accept replies in-app.
          </p>
        )}
      </div>
    </div>
  );
};
