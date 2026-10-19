import * as React from 'react';
import { Button, IconButton } from '@40labs/ui-components';
import { Plus, RefreshCw } from 'lucide-react';

export type StatusFilterTab = 'all' | 'active' | 'paused' | 'sent' | 'failed';

interface SchedulingHeaderProps {
  readonly activeTab: StatusFilterTab;
  readonly onSelectTab: (tab: StatusFilterTab) => void;
  readonly counts: Record<StatusFilterTab, number>;
  readonly onNewSchedule: () => void;
  readonly onRefresh: () => void;
  readonly isLoading: boolean;
}

export const SchedulingHeader: React.FC<SchedulingHeaderProps> = ({
  activeTab,
  onSelectTab,
  counts,
  onNewSchedule,
  onRefresh,
  isLoading,
}) => {
  const tabs: Array<{ id: StatusFilterTab; label: string; dotColor: string }> = [
    { id: 'all', label: 'All', dotColor: 'bg-text-muted' },
    { id: 'active', label: 'Active', dotColor: 'bg-accent' },
    { id: 'paused', label: 'Paused', dotColor: 'bg-text-muted' },
    { id: 'sent', label: 'Sent', dotColor: 'bg-success' },
    { id: 'failed', label: 'Failed', dotColor: 'bg-danger' },
  ];

  return (
    <div className="flex items-center justify-between w-full py-1">
      <div className="flex items-center gap-4 flex-wrap">
        <h2 className="text-base font-heading font-bold text-text">Scheduling & Campaigns</h2>
        <div className="flex items-center gap-2">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-panel-strong border-accent text-accent font-bold shadow-xs'
                    : 'bg-panel-strong/40 border-border/40 text-text-muted hover:text-text'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${tab.dotColor}`} />
                <span>{tab.label}</span>
                <span className="opacity-70">({counts[tab.id]})</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          intent="primary"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={onNewSchedule}
          style={{ backgroundColor: '#16A34A' }}
        >
          New Schedule
        </Button>
        <IconButton
          icon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
          label="Refresh schedules"
          intent="ghost"
          size="sm"
          onClick={onRefresh}
        />
      </div>
    </div>
  );
};
