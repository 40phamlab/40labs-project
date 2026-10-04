// [PHASE: MVP]
import * as React from 'react';
import type { Schedule } from '@40labs/types';
import { StatusBadge } from '@40labs/ui-components';
import { Clock } from 'lucide-react';
import { formatDateTime } from '@40labs/i18n';

interface ScheduleListItemProps {
  schedule: Schedule;
  isSelected: boolean;
  onClick: () => void;
}

export const ScheduleListItem: React.FC<ScheduleListItemProps> = ({
  schedule,
  isSelected,
  onClick,
}) => {
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

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer transition-all rounded-xl border p-4 flex flex-col gap-3 shadow-xs ${
        isSelected
          ? 'bg-panel-strong border-accent text-text'
          : 'bg-panel border-border/60 hover:bg-surface-strong'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-xs font-bold text-text line-clamp-2 font-heading leading-snug flex-1" title={schedule.title}>
          {schedule.title}
        </h4>
        <StatusBadge status={statusType as any} label={schedule.status} size="sm" />
      </div>

      <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border/30">
        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-panel-strong border border-border/40">
          {schedule.category}
        </span>
        <div className="flex items-center gap-1 font-mono text-[11px] text-text-muted">
          <Clock size={12} className="text-accent" />
          <span>{formatDateTime(schedule.scheduled_at)}</span>
        </div>
      </div>
    </div>
  );
};
