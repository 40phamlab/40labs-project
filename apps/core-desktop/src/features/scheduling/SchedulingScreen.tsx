// [PHASE: 6D & 6D-1]
import * as React from 'react';
import type { Schedule } from '@40labs/types';
import { mockSchedules } from '../../lib/mockData';
import { TabContainer } from '../../components/TabContainer';
import { SchedulingHeader, StatusFilterTab } from './components/SchedulingHeader';
import { ScheduleListPane } from './components/ScheduleListPane';
import { ScheduleDetailPane } from './components/ScheduleDetailPane';
import { NewScheduleModal } from './NewScheduleModal';

export const SchedulingScreen: React.FC = () => {
  const [schedules, setSchedules] = React.useState<Schedule[]>(() =>
    mockSchedules.map((s) => ({ ...s, enabled: (s as any).enabled !== false }))
  );
  const [selectedId, setSelectedId] = React.useState<string | null>(mockSchedules[0]?.id || null);
  const [activeTab, setActiveTab] = React.useState<StatusFilterTab>('all');
  const [isLoading, setIsLoading] = React.useState(false);

  // Modal states
  const [isNewModalOpen, setIsNewModalOpen] = React.useState(false);
  const [editingSchedule, setEditingSchedule] = React.useState<Schedule | null>(null);

  // Responsive width tracking (< 1100px)
  const [windowWidth, setWindowWidth] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [mobileDetailActive, setMobileDetailActive] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isNarrow = windowWidth < 1100;

  const handleRefresh = React.useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setSchedules([...mockSchedules.map((s) => ({ ...s, enabled: (s as any).enabled !== false }))]);
      setIsLoading(false);
    }, 400);
  }, []);

  const selectedSchedule = React.useMemo(() => {
    if (!selectedId) return null;
    return schedules.find((s) => s.id === selectedId) || null;
  }, [schedules, selectedId]);

  const counts = React.useMemo(() => {
    let all = schedules.length;
    let active = 0;
    let paused = 0;
    let sent = 0;
    let failed = 0;

    for (const s of schedules) {
      const isEnabled = s.enabled !== false;
      const isSent = s.status === 'sent';
      const isFailed = s.status === 'failed';
      const isPendingOrQueued = s.status === 'pending' || s.status === 'queued_offline';

      if (isEnabled && isPendingOrQueued) {
        active++;
      }
      if (!isEnabled && !isSent) {
        paused++;
      }
      if (isSent) {
        sent++;
      }
      if (isFailed) {
        failed++;
      }
    }

    return { all, active, paused, sent, failed };
  }, [schedules]);

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

  const handleToggleEnabled = React.useCallback((id: string, enabled: boolean) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled, updated_at: new Date().toISOString() } : s))
    );
  }, []);

  return (
    <TabContainer
      toolbar={
        <SchedulingHeader
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          counts={counts}
          onNewSchedule={() => {
            setEditingSchedule(null);
            setIsNewModalOpen(true);
          }}
          onRefresh={handleRefresh}
          isLoading={isLoading}
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
      <div className="flex flex-row flex-1 min-h-0 w-full overflow-hidden bg-transparent">
        {/* Responsive Master-Detail */}
        {isNarrow ? (
          mobileDetailActive && selectedSchedule ? (
            <div className="flex-1 h-full overflow-hidden bg-surface-primary">
              <ScheduleDetailPane
                schedule={selectedSchedule}
                onEdit={() => setEditingSchedule(selectedSchedule)}
                onDelete={handleDeleteSchedule}
                onToggleEnabled={handleToggleEnabled}
                onSendNow={(id) => {
                  setSchedules((prev) =>
                    prev.map((s) => (s.id === id ? { ...s, status: 'sent', sent_count: s.sent_count + 1, updated_at: new Date().toISOString() } : s))
                  );
                }}
                onRetryFailed={(id) => {
                  setSchedules((prev) =>
                    prev.map((s) => (s.id === id ? { ...s, status: 'sent', failure_count: 0, sent_count: s.sent_count + s.failure_count, updated_at: new Date().toISOString() } : s))
                  );
                }}
                onBack={() => setMobileDetailActive(false)}
                isMobileView={true}
              />
            </div>
          ) : (
            <div className="flex-1 h-full overflow-hidden bg-surface-primary">
              <ScheduleListPane
                schedules={schedules}
                selectedId={selectedId}
                activeTab={activeTab}
                onSelectSchedule={(id) => {
                  setSelectedId(id);
                  setMobileDetailActive(true);
                }}
              />
            </div>
          )
        ) : (
          <>
            {/* List Pane */}
            <ScheduleListPane
              schedules={schedules}
              selectedId={selectedId}
              activeTab={activeTab}
              onSelectSchedule={setSelectedId}
            />

            {/* Detail Pane */}
            <div className="flex-1 h-full overflow-hidden bg-surface-primary">
              <ScheduleDetailPane
                schedule={selectedSchedule}
                onEdit={() => selectedSchedule && setEditingSchedule(selectedSchedule)}
                onDelete={handleDeleteSchedule}
                onToggleEnabled={handleToggleEnabled}
                onSendNow={(id) => {
                  setSchedules((prev) =>
                    prev.map((s) => (s.id === id ? { ...s, status: 'sent', sent_count: s.sent_count + 1, updated_at: new Date().toISOString() } : s))
                  );
                }}
                onRetryFailed={(id) => {
                  setSchedules((prev) =>
                    prev.map((s) => (s.id === id ? { ...s, status: 'sent', failure_count: 0, sent_count: s.sent_count + s.failure_count, updated_at: new Date().toISOString() } : s))
                  );
                }}
              />
            </div>
          </>
        )}
      </div>
    </TabContainer>
  );
};
