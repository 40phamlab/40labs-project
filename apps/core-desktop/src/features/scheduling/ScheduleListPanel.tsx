// [PHASE: MVP]
import * as React from 'react';
import type { Schedule } from '@40labs/types';
import { Select, EmptyState } from '@40labs/ui-components';
import { Search, X } from 'lucide-react';
import { ScheduleListItem } from './ScheduleListItem';

interface ScheduleListPanelProps {
  schedules: Schedule[];
  selectedId: string | null;
  onSelectSchedule: (id: string) => void;
}

type StatusFilter = 'all' | 'pending' | 'sent' | 'failed' | 'queued';

export const ScheduleListPanel: React.FC<ScheduleListPanelProps> = ({
  schedules,
  selectedId,
  onSelectSchedule,
}) => {
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);

  const filteredSchedules = React.useMemo(() => {
    return schedules.filter((s) => {
      if (statusFilter !== 'all') {
        if (statusFilter === 'queued') {
          if (s.status !== 'pending') return false;
        } else if (s.status !== statusFilter) {
          return false;
        }
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
  }, [schedules, statusFilter, categoryFilter, searchQuery]);

  const statuses: Array<{ id: StatusFilter; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'sent', label: 'Sent' },
    { id: 'failed', label: 'Failed' },
    { id: 'queued', label: 'Queued' },
  ];

  return (
    <div className="flex flex-col h-full bg-panel border-r border-border/50 overflow-hidden">
      {/* Unified Single Filter Row */}
      <div className="p-3 border-b border-border/40 bg-panel-strong/40 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Status Segmented Control */}
          <div className="flex bg-panel p-0.5 rounded-input border border-border/60 text-[11px] font-semibold overflow-x-auto">
            {statuses.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter === st.id ? 'bg-panel-strong text-accent shadow-xs' : 'text-text-muted hover:text-text'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Icon-expand search button / input */}
          <div className="flex items-center">
            {isSearchExpanded ? (
              <div className="flex items-center gap-1 bg-panel px-2 py-1 rounded-input border border-border">
                <Search size={14} className="text-text-muted shrink-0" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-28 text-xs bg-transparent focus:outline-none text-text"
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
                className="p-1.5 rounded-input bg-panel border border-border/60 text-text-muted hover:text-text cursor-pointer"
                title="Search schedules"
              >
                <Search size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center justify-between gap-2">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs h-8"
          >
            <option value="all">All Categories ({schedules.length})</option>
            <option value="gov">Government & Reg ({schedules.filter((s) => s.category === 'gov').length})</option>
            <option value="patients">Patient Refills ({schedules.filter((s) => s.category === 'patients').length})</option>
            <option value="reports">Reports & Exports ({schedules.filter((s) => s.category === 'reports').length})</option>
            <option value="marketing">Marketing & Promos ({schedules.filter((s) => s.category === 'marketing').length})</option>
          </Select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar">
        {filteredSchedules.length === 0 ? (
          <EmptyState variant="filtered" compact />
        ) : (
          filteredSchedules.map((schedule) => (
            <ScheduleListItem
              key={schedule.id}
              schedule={schedule}
              isSelected={schedule.id === selectedId}
              onClick={() => onSelectSchedule(schedule.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
