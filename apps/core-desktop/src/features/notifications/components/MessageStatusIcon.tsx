import * as React from 'react';
import { Check, CheckCheck } from 'lucide-react';

export interface MessageStatusIconProps {
  status?: 'sent' | 'delivered' | 'read' | 'queued' | string;
  className?: string;
}

export const MessageStatusIcon: React.FC<MessageStatusIconProps> = ({ status = 'sent', className = '' }) => {
  if (status === 'read') {
    return <CheckCheck size={13} className={`text-primary shrink-0 ${className}`} />;
  }
  if (status === 'delivered') {
    return <CheckCheck size={13} className={`text-text-muted shrink-0 ${className}`} />;
  }
  if (status === 'queued') {
    return <span className={`text-[10px] shrink-0 ${className}`}>🕒</span>;
  }
  return <Check size={13} className={`text-text-muted shrink-0 ${className}`} />;
};
