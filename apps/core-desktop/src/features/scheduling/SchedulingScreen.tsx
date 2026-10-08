// [PHASE: MVP]
import * as React from 'react';
import { PageToolbar, Button, IconButton } from '@40labs/ui-components';
import { Plus, RefreshCw, CheckCircle2, Clock, AlertTriangle, Send } from 'lucide-react';
import type { Schedule } from '@40labs/types';
import { mockSchedules } from '../../lib/mockData';
import { TabContainer } from '../../components/TabContainer';
import { ScheduleListPanel } from './ScheduleListPanel';
import { ScheduleDetailPanel } from './ScheduleDetailPanel';
import { NewScheduleModal } from './NewScheduleModal';

export const SchedulingScreen: React.FC = () => {
  const [schedules, setSchedules] = React.useState<Schedule[]>(mockSchedules);
  const [selectedId, setSelectedId] = React.useState<string | null>(mockSchedules[0]?.id || null);
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
      setSchedules([...mockSchedules]);
      setIsLoading(false);
    }, 400);
  }, []);

  const selectedSchedule = React.useMemo(() => {
    if (!selectedId) return null;
    return schedules.find((s) => s.id === selectedId) || null;
  }, [schedules, selectedId]);

  const stats = React.useMemo(() => {
    const active = schedules.filter((s) => s.status === 'pending').length;
    const pending = active;
    const sentToday = schedules.filter((s) => s.status === 'sent').length;
    const failed = schedules.filter((s) => s.status === 'failed').length;
    return { active, pending, sentToday, failed };
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

  return (
    <TabContainer
      toolbar={
        <PageToolbar
          left={
            <div className="flex items-center gap-4">
              <h2 className="text-base font-heading font-bold text-text">Scheduling & Campaigns</h2>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-panel-strong/40 border border-border/40 text-[11px] font-mono">
                  <Clock size={12} className="text-accent" /> Active: <strong>{stats.active}</strong>
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-panel-strong/40 border border-border/40 text-[11px] font-mono">
                  <Send size={12} className="text-warning" /> Pending: <strong>{stats.pending}</strong>
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-panel-strong/40 border border-border/40 text-[11px] font-mono">
                  <CheckCircle2 size={12} className="text-success" /> Sent Today: <strong>{stats.sentToday}</strong>
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-panel-strong/40 border border-border/40 text-[11px] font-mono">
                  <AlertTriangle size={12} className="text-danger" /> Failed: <strong>{stats.failed}</strong>
                </span>
              </div>
            </div>
          }
          right={
            <div className="flex items-center gap-3">
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
                + New Schedule
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
      <div className="flex flex-row flex-1 min-h-0 w-full overflow-hidden bg-transparent">
        {/* Responsive Master-Detail */}
        {isNarrow ? (
          mobileDetailActive && selectedSchedule ? (
            <div className="flex-1 h-full overflow-hidden bg-surface-primary">
              <ScheduleDetailPanel
                schedule={selectedSchedule}
                onEdit={() => setEditingSchedule(selectedSchedule)}
                onDelete={handleDeleteSchedule}
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
              <ScheduleListPanel
                schedules={schedules}
                selectedId={selectedId}
                onSelectSchedule={(id) => {
                  setSelectedId(id);
                  setMobileDetailActive(true);
                }}
              />
            </div>
          )
        ) : (
          <>
            {/* List Column (380–420px) */}
            <div className="w-[400px] shrink-0 h-full overflow-hidden border-r border-border/50 bg-surface-primary elevation-raised">
              <ScheduleListPanel
                schedules={schedules}
                selectedId={selectedId}
                onSelectSchedule={setSelectedId}
              />
            </div>

            {/* Detail Pane */}
            <div className="flex-1 h-full overflow-hidden bg-surface-primary">
              <ScheduleDetailPanel
                schedule={selectedSchedule}
                onEdit={() => selectedSchedule && setEditingSchedule(selectedSchedule)}
                onDelete={handleDeleteSchedule}
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
