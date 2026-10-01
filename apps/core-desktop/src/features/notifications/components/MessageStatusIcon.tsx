import * as React from 'react';
import { Check, CheckCheck } from 'lucide-react';

export interface MessageStatusIconProps {
  status?: 'sent' | 'delivered' | 'read' | string;
  className?: string;
}

export const MessageStatusIcon: React.FC<MessageStatusIconProps> = ({ status = 'sent', className = '' }) => {
  if (status === 'read') {
    return <CheckCheck size={13} className={`text-primary shrink-0 ${className}`} />;
  }
  if (status === 'delivered') {
    return <CheckCheck size={13} className={`text-text-muted shrink-0 ${className}`} />;
  }
  return <Check size={13} className={`text-text-muted shrink-0 ${className}`} />;
};
