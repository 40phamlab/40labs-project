import * as React from 'react';
import { ScheduleCategory, Schedule } from '@40labs/types';
import { ScheduleCategoryCard } from './ScheduleCategoryCard';

interface ScheduleCategoryPanelProps {
  schedules: Schedule[];
  activeCategory: ScheduleCategory | null;
  onSelectCategory: (category: ScheduleCategory | null) => void;
}

const CATEGORIES: ScheduleCategory[] = ['reports', 'marketing', 'patients', 'gov'];

export const ScheduleCategoryPanel: React.FC<ScheduleCategoryPanelProps> = ({
  schedules,
  activeCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex flex-col h-full bg-surface border-r border-border overflow-hidden">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surface-strong">
        <h2 className="font-heading text-xs font-bold uppercase tracking-wider text-text">
          Schedule Categories
        </h2>
        <span className="text-xs font-mono text-text-muted px-2 py-0.5 rounded-full bg-panel border border-border">
          {schedules.length} total
        </span>
      </div>

      {/* Categories List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
        {/* All Categories Option */}
        <div
          onClick={() => onSelectCategory(null)}
          className={`cursor-pointer px-4 py-2.5 rounded-input border transition-all text-xs font-bold flex items-center justify-between ${
            activeCategory === null
              ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs'
              : 'bg-panel text-text border-border hover:bg-surface-strong'
          }`}
        >
          <span>All Schedules</span>
          <span className="font-mono">{schedules.length}</span>
        </div>

        {CATEGORIES.map((category) => (
          <ScheduleCategoryCard
            key={category}
            category={category}
            schedules={schedules}
            isActive={activeCategory === category}
            onClick={() => onSelectCategory(activeCategory === category ? null : category)}
          />
        ))}
      </div>
    </div>
  );
};
