import * as React from 'react';
import { MessageSquare, MessageCircle, Smartphone, Mail } from 'lucide-react';
import { MessageChannel, CHANNEL_CONFIGS } from '@40labs/types';
import { Tooltip, Badge } from '@40labs/ui-components';

export interface ChannelIconProps {
  channel: MessageChannel;
  size?: number;
  className?: string;
}

export const ChannelIcon: React.FC<ChannelIconProps> = ({ channel, size = 14, className = '' }) => {
  const config = CHANNEL_CONFIGS[channel] || CHANNEL_CONFIGS.amob;

  const getIcon = () => {
    switch (channel) {
      case 'whatsapp':
        return <MessageCircle size={size} className={`text-emerald-500 ${className}`} />;
      case 'sms':
        return <Smartphone size={size} className={`text-amber-500 ${className}`} />;
      case 'email':
        return <Mail size={size} className={`text-blue-500 ${className}`} />;
      case 'amob':
      default:
        return <MessageSquare size={size} className={`text-primary ${className}`} />;
    }
  };

  return (
    <Tooltip content={config.accessibleLabel}>
      <span className="inline-flex items-center justify-center shrink-0 cursor-help">
        {getIcon()}
      </span>
    </Tooltip>
  );
};

export interface ChannelBadgeProps {
  channel: MessageChannel;
  size?: 'sm' | 'md';
  className?: string;
}

export const ChannelBadge: React.FC<ChannelBadgeProps> = ({ channel, size = 'sm', className = '' }) => {
  const config = CHANNEL_CONFIGS[channel] || CHANNEL_CONFIGS.amob;
  return (
    <Badge variant={config.badgeVariant} size={size} className={`flex items-center gap-1 font-mono uppercase ${className}`}>
      <ChannelIcon channel={channel} size={11} />
      <span>{config.displayName}</span>
    </Badge>
  );
};
