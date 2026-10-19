import * as React from 'react';
import type { Schedule } from '@40labs/types';
import { StatusBadge, Select, EmptyState } from '@40labs/ui-components';
import { Search, X, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { formatDateTime } from '@40labs/i18n';
import { StatusFilterTab } from './SchedulingHeader';

interface ScheduleListPaneProps {
  readonly schedules: Schedule[];
  readonly selectedId: string | null;
  readonly onSelectSchedule: (id: string) => void;
  readonly activeTab: StatusFilterTab;
}

export const ScheduleListPane: React.FC<ScheduleListPaneProps> = ({
  schedules,
  selectedId,
  onSelectSchedule,
  activeTab,
}) => {
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('scheduling_panel_open') !== 'false';
    }
    return true;
  });

  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('scheduling_panel_open', String(next));
    }
  };

  const filteredSchedules = React.useMemo(() => {
    return schedules.filter((s) => {
      // Active Tab filtering logic
      const isEnabled = s.enabled !== false;
      const isSent = s.status === 'sent';

      if (activeTab === 'active') {
        if (!isEnabled || (s.status !== 'pending' && s.status !== 'queued_offline')) return false;
      } else if (activeTab === 'paused') {
        if (isEnabled || isSent) return false;
      } else if (activeTab === 'sent') {
        if (!isSent) return false;
      } else if (activeTab === 'failed') {
        if (s.status !== 'failed') return false;
      }

      if (categoryFilter !== 'all' && s.category !== categoryFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          s.message_body.toLowerCase().includes(q) ||
          s.channels.some((ch) => ch.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [schedules, activeTab, categoryFilter, searchQuery]);

  if (!isOpen) {
    return (
      <div className="w-12 h-full bg-panel border-r border-border/50 flex flex-col items-center py-4 relative">
        <button
          type="button"
          onClick={toggleOpen}
          className="p-2 rounded-lg bg-panel-strong border border-border/60 text-text hover:text-accent cursor-pointer shadow-xs"
          title="Expand schedule list"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-[400px] shrink-0 h-full bg-panel border-r border-border/50 flex flex-col overflow-hidden relative">
      {/* Header row: search & compact category filter (8px radius) */}
      <div className="p-3 border-b border-border/40 bg-panel-strong/40 flex items-center justify-between gap-2">
        <div className="w-48">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs h-8 rounded-[8px]"
          >
            <option value="all">All Categories</option>
            <option value="gov">Gov & Reg</option>
            <option value="patients">Patient Refills</option>
            <option value="reports">Reports & Exports</option>
            <option value="marketing">Marketing</option>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {isSearchExpanded ? (
            <div className="flex items-center gap-1 bg-panel px-2 py-1 rounded-[8px] border border-border">
              <Search size={14} className="text-text-muted shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-24 text-xs bg-transparent focus:outline-none text-text"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchExpanded(false);
                }}
                className="text-text-muted hover:text-text cursor-pointer"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsSearchExpanded(true)}
              className="p-2 rounded-[8px] bg-panel border border-border/60 text-text-muted hover:text-text cursor-pointer"
              title="Search schedules"
            >
              <Search size={14} />
            </button>
          )}

          {/* Collapse chevron on pane edge */}
          <button
            type="button"
            onClick={toggleOpen}
            className="p-2 rounded-[8px] bg-panel border border-border/60 text-text-muted hover:text-text cursor-pointer"
            title="Collapse list"
          >
            <ChevronLeft size={14} />
          </button>
        </div>
      </div>

      {/* List Cards */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar">
        {filteredSchedules.length === 0 ? (
          <EmptyState variant="filtered" compact />
        ) : (
          filteredSchedules.map((schedule) => {
            const isSelected = schedule.id === selectedId;
            const isEnabled = schedule.enabled !== false;
            const statusType =
              schedule.status === 'sent'
                ? 'success'
                : schedule.status === 'failed'
                ? 'error'
                : 'pending';

            return (
              <div
                key={schedule.id}
                onClick={() => onSelectSchedule(schedule.id)}
                className={`cursor-pointer transition-all rounded-[12px] border p-4 flex flex-col gap-3 shadow-xs bg-surface-primary ${
                  isSelected ? 'border-[#F97316]' : 'border-border/60 hover:border-border'
                }`}
              >
                {/* Title */}
                <h4 className="text-xs font-bold text-text line-clamp-2 font-heading leading-snug">
                  {schedule.title}
                </h4>

                {/* Single meta row: category tag, status badge(s), date */}
                <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border/30">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-secondary border border-border/40">
                    {schedule.category}
                  </span>
                  <div className="flex items-center gap-2">
                    {!isEnabled && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-secondary border border-border/40 text-text-muted">
                        Paused
                      </span>
                    )}
                    <StatusBadge status={statusType as any} label={schedule.status} size="sm" />
                    <div className="flex items-center gap-1 font-mono text-[11px] text-text-muted">
                      <Clock size={12} className="text-accent" />
                      <span>{formatDateTime(schedule.scheduled_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
