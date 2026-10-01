import * as React from 'react';
import {
  PageToolbar,
  Button,
  IconButton,
} from '@40labs/ui-components';
import { Plus, RefreshCw } from 'lucide-react';
import { Schedule, ScheduleCategory } from '@40labs/types';
import { mockSchedules } from '../../lib/mockData';
import { TabContainer } from '../../components/TabContainer';
import { ScheduleCategoryStrip } from './ScheduleCategoryStrip';
import { ScheduleListPanel } from './ScheduleListPanel';
import { ScheduleDetailPanel } from './ScheduleDetailPanel';
import { NewScheduleModal } from './NewScheduleModal';

export const SchedulingScreen: React.FC = () => {
  const [schedules, setSchedules] = React.useState<Schedule[]>(mockSchedules);
  const [activeCategory, setActiveCategory] = React.useState<ScheduleCategory | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(schedules[0]?.id || null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Modal states
  const [isNewModalOpen, setIsNewModalOpen] = React.useState(false);
  const [editingSchedule, setEditingSchedule] = React.useState<Schedule | null>(null);

  const handleRefresh = React.useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setSchedules([...mockSchedules]);
      setIsLoading(false);
    }, 400);
  }, []);

  const selectedSchedule = React.useMemo(() => {
    if (!selectedId) return null;
    return schedules.find((s) => s.id === selectedId) || null;
  }, [schedules, selectedId]);

  const handleSaveSchedule = React.useCallback((saved: Schedule) => {
    setSchedules((prev) => {
      const exists = prev.some((s) => s.id === saved.id);
      if (exists) {
        return prev.map((s) => (s.id === saved.id ? saved : s));
      }
      return [saved, ...prev];
    });
    setSelectedId(saved.id);
  }, []);

  const handleDeleteSchedule = React.useCallback((id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  }, [selectedId]);

  const handleStopSchedule = React.useCallback((id: string) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'cancelled', updated_at: new Date().toISOString() } : s))
    );
  }, []);

  return (
    <TabContainer
      toolbar={
        <PageToolbar
          right={
            <div className="flex items-center gap-2">
              <Button
                type="button"
                intent="primary"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => {
                  setEditingSchedule(null);
                  setIsNewModalOpen(true);
                }}
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
      }
      overlays={
        <NewScheduleModal
          isOpen={isNewModalOpen || Boolean(editingSchedule)}
          onClose={() => {
            setIsNewModalOpen(false);
            setEditingSchedule(null);
          }}
          onSave={handleSaveSchedule}
          editSchedule={editingSchedule}
        />
      }
    >
      {/* Main Content Area — 2-Pane Layout with Top Category Strip */}
      <div className="flex flex-col gap-3.5 flex-1 min-h-0 w-full overflow-hidden">
        {/* Top Category Strip */}
        <ScheduleCategoryStrip
          schedules={schedules}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />

        {/* Two-Pane Row: List Panel (left) + Detail Panel (right) */}
        <div className="flex flex-row gap-3.5 flex-1 min-h-0 overflow-hidden">
          {/* List Panel */}
          <div className="w-[300px] lg:w-[360px] shrink-0 h-full overflow-hidden rounded-card border border-border/50 bg-panel shadow-xs">
            <ScheduleListPanel
              schedules={schedules}
              selectedId={selectedId}
              activeCategory={activeCategory}
              onSelectSchedule={setSelectedId}
              onOpenNewModal={() => {
                setEditingSchedule(null);
                setIsNewModalOpen(true);
              }}
              onEditSchedule={(sch) => setEditingSchedule(sch)}
              onStopSchedule={handleStopSchedule}
            />
          </div>

          {/* Detail Panel */}
          <div className="flex-1 h-full overflow-hidden rounded-card border border-border/50 bg-panel shadow-xs">
            <ScheduleDetailPanel
              schedule={selectedSchedule}
              onEdit={() => selectedSchedule && setEditingSchedule(selectedSchedule)}
              onDelete={handleDeleteSchedule}
              onStop={handleStopSchedule}
              onSendNow={(id) => {
                setSchedules((prev) =>
                  prev.map((s) => (s.id === id ? { ...s, status: 'sent', sent_count: s.sent_count + 1, updated_at: new Date().toISOString() } : s))
                );
              }}
            />
          </div>
        </div>
      </div>
    </TabContainer>
  );
};
