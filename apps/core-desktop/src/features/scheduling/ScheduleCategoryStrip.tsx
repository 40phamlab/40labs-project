import * as React from 'react';
import { ScheduleCategory, Schedule } from '@40labs/types';
import { Tooltip, Panel } from '@40labs/ui-components';

interface ScheduleCategoryStripProps {
  schedules: Schedule[];
  activeCategory: ScheduleCategory | null;
  onSelectCategory: (category: ScheduleCategory | null) => void;
}

const CATEGORIES: Array<{ id: ScheduleCategory; label: string }> = [
  { id: 'reports', label: 'Reports & Exports' },
  { id: 'marketing', label: 'Marketing & Promos' },
  { id: 'patients', label: 'Patient Refills' },
  { id: 'gov', label: 'Government & Reg' },
];

export const ScheduleCategoryStrip: React.FC<ScheduleCategoryStripProps> = ({
  schedules,
  activeCategory,
  onSelectCategory,
}) => {
  return (
    <Panel className="p-2.5 flex items-center gap-2.5 overflow-x-auto whitespace-nowrap custom-scrollbar shrink-0 bg-panel border border-border/50 rounded-card elevation-raised">
      {/* All Schedules Pill */}
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        className={`px-3 py-1.5 rounded-input text-xs font-semibold transition-all flex items-center gap-2 border cursor-pointer ${
          activeCategory === null
            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs font-bold'
            : 'bg-panel-strong/40 text-text border-border/60 hover:bg-surface-strong'
        }`}
      >
        <span>All Schedules</span>
        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeCategory === null ? 'bg-white/20 text-white' : 'bg-panel text-text-muted'}`}>
          {schedules.length}
        </span>
      </button>

      {CATEGORIES.map((cat) => {
        const catSchedules = schedules.filter((s) => s.category === cat.id);
        const actvCount = catSchedules.filter((s) => s.status === 'pending').length;
        const sentCount = catSchedules.reduce((acc, s) => acc + s.sent_count, 0);
        const failCount = catSchedules.reduce((acc, s) => acc + s.failure_count, 0);
        const totalCount = catSchedules.length;

        const isActive = activeCategory === cat.id;

        const tooltipContent = `Sent: ${sentCount} | Pending: ${actvCount} | Failures: ${failCount} | Total: ${totalCount}`;

        return (
          <Tooltip key={cat.id} content={tooltipContent} position="bottom">
            <button
              type="button"
              onClick={() => onSelectCategory(isActive ? null : cat.id)}
              className={`px-3 py-1.5 rounded-input text-xs font-semibold transition-all flex items-center gap-2 border cursor-pointer ${
                isActive
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs font-bold'
                  : 'bg-panel-strong/40 text-text border-border/60 hover:bg-surface-strong'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center font-mono text-[10px] ${
                  isActive
                    ? 'bg-white/20 text-white border-white/40'
                    : 'bg-panel border-border text-text-muted'
                }`}
              >
                {actvCount}
              </span>
            </button>
          </Tooltip>
        );
      })}
    </Panel>
  );
};
