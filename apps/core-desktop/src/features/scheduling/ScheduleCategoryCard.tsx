import * as React from 'react';
import { ScheduleCategory, Schedule } from '@40labs/types';
import { Button, Tooltip } from '@40labs/ui-components';

interface ScheduleCategoryCardProps {
  category: ScheduleCategory;
  schedules: Schedule[];
  isActive: boolean;
  onClick: () => void;
}

const CATEGORY_TITLES: Record<ScheduleCategory, string> = {
  reports: 'Reports & Exports',
  marketing: 'Marketing & Promos',
  patients: 'Patient Refills',
  gov: 'Government & Reg',
};

const CATEGORY_DESCRIPTIONS: Record<ScheduleCategory, string> = {
  reports: 'Daily sales, tax, and inventory logs',
  marketing: 'SMS & WhatsApp broadcasts',
  patients: 'Chronic refill reminders & alerts',
  gov: 'TMDA and NHIF compliance bundles',
};

export const ScheduleCategoryCard: React.FC<ScheduleCategoryCardProps> = ({
  category,
  schedules,
  isActive,
  onClick,
}) => {
  const categorySchedules = React.useMemo(() => {
    return schedules.filter((s) => s.category === category);
  }, [schedules, category]);

  // actv = count where status === 'pending'
  const actvCount = React.useMemo(() => {
    return categorySchedules.filter((s) => s.status === 'pending').length;
  }, [categorySchedules]);

  // sent / pending / failure = sum of sent_count / pending_count / failure_count across category rows
  const stats = React.useMemo(() => {
    return categorySchedules.reduce(
      (acc, s) => {
        acc.sent += s.sent_count;
        acc.pending += s.pending_count;
        acc.failure += s.failure_count;
        return acc;
      },
      { sent: 0, pending: 0, failure: 0 }
    );
  }, [categorySchedules]);

  // today / month / total
  const timeCounts = React.useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let today = 0;
    let month = 0;
    const total = categorySchedules.length;

    for (const s of categorySchedules) {
      const d = new Date(s.scheduled_at);
      if (d.toDateString() === todayStr) {
        today++;
      }
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        month++;
      }
    }

    return { today, month, total };
  }, [categorySchedules]);

  // Last updated date
  const lastUpdated = React.useMemo(() => {
    if (categorySchedules.length === 0) return 'No schedules';
    const latest = categorySchedules.reduce((latest, s) => {
      return new Date(s.updated_at) > new Date(latest.updated_at) ? s : latest;
    }, categorySchedules[0]);
    try {
      return new Date(latest.updated_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recently';
    }
  }, [categorySchedules]);

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer transition-all rounded-card bg-panel border p-4 flex flex-col gap-3 shadow-sm hover:border-[var(--color-primary)] ${
        isActive ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)] bg-surface' : 'border-border'
      }`}
    >
      {/* Top Row: Title & Active Count Ring Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <h3 className="font-heading text-sm font-bold text-text truncate">
            {CATEGORY_TITLES[category]}
          </h3>
          <p className="text-xs text-text-muted truncate">
            {CATEGORY_DESCRIPTIONS[category]}
          </p>
        </div>

        {/* Circular Stat Badge (actv count ring) */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div
            className="w-11 h-11 rounded-full border-2 border-[var(--color-primary)] bg-surface flex items-center justify-center shadow-xs"
          >
            <span className="font-mono text-sm font-bold text-text">
              {actvCount}
            </span>
          </div>
          <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider mt-0.5">
            actv
          </span>
        </div>
      </div>

      {/* Middle Row: Sent / Pending / Failure Column */}
      <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-input bg-surface border border-border/50 text-center">
        <div className="flex flex-col">
          <span className="text-[10px] text-text-muted uppercase font-medium">Sent</span>
          <span className="font-mono text-xs font-bold text-text">{stats.sent}</span>
        </div>
        <div className="flex flex-col border-x border-border/50">
          <span className="text-[10px] text-text-muted uppercase font-medium">Pend</span>
          <span className="font-mono text-xs font-bold text-text">{stats.pending}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-text-muted uppercase font-medium">Fail</span>
          <span className="font-mono text-xs font-bold text-[var(--color-danger)]">{stats.failure}</span>
        </div>
      </div>

      {/* Today / Month / Total row */}
      <div className="flex items-center justify-between text-xs text-text-muted px-1">
        <div className="flex items-center gap-2">
          <span>Today: <strong className="font-mono text-text">{timeCounts.today}</strong></span>
          <span>·</span>
          <span>Month: <strong className="font-mono text-text">{timeCounts.month}</strong></span>
          <span>·</span>
          <span>Total: <strong className="font-mono text-text">{timeCounts.total}</strong></span>
        </div>
      </div>

      {/* Footer Row: "Alter que" button (disabled with Tooltip) & Trailing date */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <Tooltip content="Coming soon..." position="top">
          <div>
            <Button
              type="button"
              intent="neutral"
              size="sm"
              disabled
              className="rounded-input text-xs opacity-60 pointer-events-none"
            >
              Alter que
            </Button>
          </div>
        </Tooltip>

        <span className="text-[11px] text-text-muted font-mono">
          {lastUpdated}
        </span>
      </div>
    </div>
  );
};
