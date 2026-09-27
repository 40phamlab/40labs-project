import * as React from 'react';
import { Schedule, ScheduleCategory } from '@40labs/types';
import { SearchInput, Button, FilterTabs } from '@40labs/ui-components';
import { Plus } from 'lucide-react';
import { ScheduleListItem } from './ScheduleListItem';

interface ScheduleListPanelProps {
  schedules: Schedule[];
  selectedId: string | null;
  activeCategory: ScheduleCategory | null;
  onSelectSchedule: (id: string) => void;
  onOpenNewModal: () => void;
  onEditSchedule: (schedule: Schedule) => void;
  onStopSchedule: (id: string) => void;
}

const TYPE_TABS = [
  { id: 'all', label: 'All Types' },
  { id: 'report', label: 'Reports' },
  { id: 'reminder', label: 'Reminders' },
  { id: 'refill', label: 'Refills' },
];

export const ScheduleListPanel: React.FC<ScheduleListPanelProps> = ({
  schedules,
  selectedId,
  activeCategory,
  onSelectSchedule,
  onOpenNewModal,
  onEditSchedule,
  onStopSchedule,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');

  const filteredSchedules = React.useMemo(() => {
    return schedules.filter((s) => {
      if (activeCategory && s.category !== activeCategory) return false;
      if (typeFilter !== 'all' && s.schedule_type !== typeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          s.message_body.toLowerCase().includes(q) ||
          s.channels.some((ch) => ch.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [schedules, activeCategory, typeFilter, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-panel border-r border-border/50 overflow-hidden elevation-raised">
      {/* Search Input sits ABOVE the tabs in this same panel */}
      <div className="p-3 border-b border-border/40 bg-panel-strong/40 flex flex-col gap-2.5 elevation-inset">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Schedules ({filteredSchedules.length})
          </span>
          <Button
            type="button"
            intent="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={onOpenNewModal}
            className="rounded-input h-7 text-xs"
          >
            Add New
          </Button>
        </div>

        <SearchInput
          placeholder="Search name, message..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
        />

        <FilterTabs
          tabs={TYPE_TABS}
          activeTabId={typeFilter}
          onChange={setTypeFilter}
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2 custom-scrollbar">
        {filteredSchedules.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border/40 rounded-card my-auto bg-panel-strong/20">
            <p className="text-xs text-text-muted">No schedules found matching criteria.</p>
          </div>
        ) : (
          filteredSchedules.map((schedule) => (
            <ScheduleListItem
              key={schedule.id}
              schedule={schedule}
              isSelected={schedule.id === selectedId}
              onClick={() => onSelectSchedule(schedule.id)}
              onEdit={() => onEditSchedule(schedule)}
              onStop={onStopSchedule}
            />
          ))
        )}
      </div>
    </div>
  );
};
