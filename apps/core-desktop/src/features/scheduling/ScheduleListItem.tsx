import * as React from 'react';
import { Schedule } from '@40labs/types';
import { Button, StatusBadge } from '@40labs/ui-components';
import { Clock, Edit3, Square } from 'lucide-react';

interface ScheduleListItemProps {
  schedule: Schedule;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onStop: (id: string) => void;
}

function getLiveCountdown(scheduledAt: string): string {
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff <= 0) return 'Due / Past due';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `in ${days}d ${hours % 24}h`;
  }
  return `remain ${hours}hr ${minutes}min`;
}

function getRecipientSummary(schedule: Schedule): string {
  if (schedule.recipient_scope === 'all') return 'All contacts';
  if (schedule.recipient_ids && schedule.recipient_ids.length > 0) {
    return `${schedule.recipient_ids.length} ${schedule.recipient_scope}`;
  }
  return schedule.recipient_scope;
}

export const ScheduleListItem: React.FC<ScheduleListItemProps> = ({
  schedule,
  isSelected,
  onClick,
  onEdit,
  onStop,
}) => {
  const [, setTick] = React.useState(0);

  // Live countdown update ticker
  React.useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const statusType = React.useMemo(() => {
    switch (schedule.status) {
      case 'sent':
        return 'success';
      case 'pending':
        return 'pending';
      case 'failed':
        return 'error';
      case 'cancelled':
      default:
        return 'cancelled';
    }
  }, [schedule.status]);

  const countdown = getLiveCountdown(schedule.scheduled_at);
  const recipientSummary = getRecipientSummary(schedule);

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer transition-all rounded-card border p-2.5 flex flex-col gap-1.5 elevation-raised ${
        isSelected
          ? 'bg-panel-strong border-border-strong elevation-inset text-text'
          : 'bg-panel border-border/60 hover:bg-surface-strong'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-text truncate font-heading">
            {schedule.title}
          </span>
          <span className="text-[11px] text-text-muted font-mono truncate">
            {recipientSummary} · {schedule.category}
          </span>
        </div>
        <StatusBadge status={statusType as any} label={schedule.status} size="sm" />
      </div>

      <div className="flex items-center justify-between text-xs text-text-muted pt-1 border-t border-border/30">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-text-muted">
          <Clock size={12} className="text-accent" />
          <span>{countdown}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {schedule.status === 'pending' && (
            <Button
              type="button"
              intent="neutral"
              size="sm"
              leftIcon={<Square size={12} />}
              onClick={(e) => {
                e.stopPropagation();
                onStop(schedule.id);
              }}
              className="h-6 text-[10px] rounded-input text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
            >
              Stop
            </Button>
          )}
          <Button
            type="button"
            intent="neutral"
            size="sm"
            leftIcon={<Edit3 size={12} />}
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="h-6 text-[10px] rounded-input"
          >
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
};
