import * as React from 'react';
import {
  PageViewport,
  PageToolbar,
  PageContent,
  Button,
  IconButton,
} from '@40labs/ui-components';
import { Calendar, Plus, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { ScheduleCategory } from '@40labs/types';
import { mockSchedules } from '../../lib/mockData';
import { ScheduleCategoryPanel } from './ScheduleCategoryPanel';

export const SchedulingScreen: React.FC = () => {
  const [schedules, setSchedules] = React.useState(mockSchedules);
  const [activeCategory, setActiveCategory] = React.useState<ScheduleCategory | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleRefresh = React.useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setSchedules([...mockSchedules]);
      setIsLoading(false);
    }, 400);
  }, []);

  return (
    <PageViewport>
      {/* Top Toolbar */}
      <PageToolbar
        left={
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
              <Calendar size={18} />
            </div>
            <div>
              <h1 className="font-heading text-sm font-bold text-text">Scheduling & Automation</h1>
              <p className="text-xs text-text-muted">
                Manage automated reports, patient refills, reminders, and regulatory syncs.
              </p>
            </div>
          </div>
        }
        right={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              intent="primary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={() => console.log('New schedule clicked')}
            >
              New Schedule
            </Button>
            <IconButton
              icon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
              label="Refresh schedules"
              intent="ghost"
              size="sm"
              onClick={handleRefresh}
            />
          </div>
        }
      />

      {/* Main Content Area — 3-Pane Layout */}
      <PageContent scrollable={false} padding="normal">
        <div className="flex flex-row gap-6 w-full h-full overflow-hidden">
          {/* Left Pane: Category Cards & Stats (w-[360px]) */}
          <div className="w-[360px] flex-shrink-0 h-full overflow-hidden rounded-card border border-border shadow-xs">
            <ScheduleCategoryPanel
              schedules={schedules}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
            />
          </div>

          {/* Middle Pane: Placeholder until Phase 6B-3 */}
          <div className="w-1/3 flex-shrink-0 h-full overflow-hidden rounded-card border border-border bg-surface p-6 flex flex-col items-center justify-center text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-surface-strong border border-border flex items-center justify-center text-text-muted mb-3">
              <SlidersHorizontal size={20} />
            </div>
            <h3 className="font-heading text-sm font-bold text-text mb-1">Schedule List Panel</h3>
            <p className="text-xs text-text-muted max-w-[260px]">
              Coming in Phase 6B-3. Displays filtered schedules by type (report, reminder, refill) with search and status badges.
            </p>
            {activeCategory && (
              <span className="mt-3 text-[11px] font-mono px-2.5 py-1 rounded-full bg-panel border border-border text-[var(--color-primary)]">
                Active Category: {activeCategory.toUpperCase()}
              </span>
            )}
          </div>

          {/* Right Pane: Placeholder until Phase 6B-3 */}
          <div className="flex-1 h-full overflow-hidden rounded-card border border-border bg-surface p-6 flex flex-col items-center justify-center text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-surface-strong border border-border flex items-center justify-center text-text-muted mb-3">
              <Calendar size={20} />
            </div>
            <h3 className="font-heading text-sm font-bold text-text mb-1">Schedule Details & Preview</h3>
            <p className="text-xs text-text-muted max-w-[280px]">
              Coming in Phase 6B-3. View schedule metadata, message body preview, attachment list, and management actions.
            </p>
          </div>
        </div>
      </PageContent>
    </PageViewport>
  );
};
