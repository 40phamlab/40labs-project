import * as React from 'react';
import { Clock, Check, CheckCheck, RefreshCw } from 'lucide-react';
import { Tooltip } from '@40labs/ui-components';

export interface MessageStatusIconProps {
  status?: 'queued' | 'sent' | 'failed' | 'read' | string;
  onRetry?: () => void;
  className?: string;
}

export const MessageStatusIcon: React.FC<MessageStatusIconProps> = ({
  status = 'sent',
  onRetry,
  className = '',
}) => {
  if (status === 'queued') {
    return (
      <Tooltip content="Queued (offline)">
        <Clock size={13} className={`text-text-muted shrink-0 animate-pulse ${className}`} />
      </Tooltip>
    );
  }
  if (status === 'failed') {
    return (
      <Tooltip content="Send failed. Click to retry.">
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1 text-danger hover:underline cursor-pointer bg-danger/10 px-1.5 py-0.5 rounded text-[11px]"
        >
          <RefreshCw size={11} className="shrink-0 animate-spin" />
          <span>Retry</span>
        </button>
      </Tooltip>
    );
  }
  if (status === 'read') {
    return <CheckCheck size={13} className={`text-primary shrink-0 ${className}`} />;
  }
  return <Check size={13} className={`text-text-muted shrink-0 ${className}`} />;
};
