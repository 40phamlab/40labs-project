import * as React from 'react';
import {
  Panel,
  Button,
  DataTable,
  StatusBadge,
  type ColumnDefinition,
  Field,
  FieldLabel,
} from '@40labs/ui-components';
import { Database, Download, Play, Wifi, WifiOff } from 'lucide-react';
import type { BackupRecord, ScheduleChannel } from '@40labs/types';
import { useBackup } from '../../../hooks/useBackup';

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const BackupPanel: React.FC = () => {
  const {
    schedule,
    isLoadingSchedule,
    updateSchedule,
    isUpdatingSchedule,
    history,
    isLoadingHistory,
    runBackup,
    isRunningBackup,
  } = useBackup();

  const [isOnline] = React.useState(true);

  const handleFrequencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const frequency = e.target.value as 'daily' | 'weekly' | 'monthly';
    await updateSchedule({ frequency });
  };

  const handleChannelChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const channel = e.target.value as ScheduleChannel;
    await updateSchedule({ channel });
  };

  const handleRunBackupNow = async () => {
    await runBackup();
  };

  const columns: ColumnDefinition<BackupRecord>[] = [
    {
      key: 'created_at',
      header: 'Backup Date & Time',
      render: (rec) => (
        <span className="text-xs font-mono text-text-primary">
          {new Date(rec.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'triggered_by',
      header: 'Triggered By',
      render: (rec) => (
        <span className="text-xs font-medium text-text-secondary uppercase">
          {rec.triggered_by}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (rec) => {
        const badgeStatus =
          rec.status === 'completed'
            ? 'success'
            : rec.status === 'failed'
            ? 'error'
            : 'pending';
        return <StatusBadge status={badgeStatus} label={rec.status.toUpperCase()} />;
      },
    },
    {
      key: 'size_bytes',
      header: 'Archive Size',
      render: (rec) => (
        <span className="text-xs font-mono text-text-muted">
          {formatBytes(rec.size_bytes)}
        </span>
      ),
    },
    {
      key: 'destination',
      header: 'Destination Channel',
      render: (rec) => (
        <span className="text-xs font-mono text-text-secondary uppercase">
          {rec.destination.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      align: 'right',
      render: (rec) => (
        <Button
          variant="neutral"
          size="sm"
          disabled={!isOnline || rec.status !== 'completed'}
          leftIcon={<Download size={12} />}
          onClick={() => alert(`Downloading local snapshot backup archive: ${rec.id}`)}
        >
          Download
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-8 max-w-3xl">
      {/* Schedule & Immediate Action Panel */}
      <Panel variant="raised" className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Database size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Local SQLite & Cloud Export Backup</h3>
              <p className="text-xs text-text-muted">
                Automatic scheduled snapshots and manual backup exports. Toggling schedules and local SQLite snapshots work offline; remote cloud upload requires active internet connection.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 bg-panel-subtle rounded-full border border-border/50 text-[11px] font-mono text-text-muted">
            {isOnline ? (
              <>
                <Wifi size={12} className="text-success shrink-0" />
                <span>Cloud Sync Online</span>
              </>
            ) : (
              <>
                <WifiOff size={12} className="text-warning shrink-0" />
                <span>Offline Mode</span>
              </>
            )}
          </div>
        </div>

        {/* Schedule Controls */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-panel-subtle rounded-card border border-border/50">
          <Field>
            <FieldLabel>Backup Frequency</FieldLabel>
            <select
              value={schedule?.frequency || 'daily'}
              onChange={handleFrequencyChange}
              disabled={isLoadingSchedule || isUpdatingSchedule}
              className="w-full bg-panel border border-border rounded-input px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="daily">Daily Automatic Backup</option>
              <option value="weekly">Weekly Schedule</option>
              <option value="monthly">Monthly Archive</option>
            </select>
          </Field>

          <Field>
            <FieldLabel>Export Destination Channel</FieldLabel>
            <select
              value={schedule?.channel || 'google_drive'}
              onChange={handleChannelChange}
              disabled={isLoadingSchedule || isUpdatingSchedule}
              className="w-full bg-panel border border-border rounded-input px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary uppercase"
            >
              <option value="google_drive">Google Drive</option>
              <option value="gmail">Gmail Relay</option>
              <option value="in_app">Local Storage Only</option>
            </select>
          </Field>
        </div>

        {/* Action Button Row */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-text-muted">
            Last successful run:{' '}
            <span className="font-mono font-semibold text-text-primary">
              {schedule?.last_run_at ? new Date(schedule.last_run_at).toLocaleString() : 'Never'}
            </span>
          </div>

          <Button
            type="button"
            intent="primary"
            size="sm"
            leftIcon={<Play size={14} />}
            onClick={handleRunBackupNow}
            disabled={isRunningBackup}
          >
            {isRunningBackup ? 'Executing Backup...' : 'Create Backup Now'}
          </Button>
        </div>
      </Panel>

      {/* Backup History Table Panel */}
      <Panel variant="raised" className="p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Backup Execution History</h3>
          <p className="text-xs text-text-muted">
            Historical audit log of local snapshot creations and remote cloud backup exports.
          </p>
        </div>

        <div className="border border-border/50 rounded-card overflow-hidden">
          <DataTable
            data={history}
            columns={columns}
            loading={isLoadingHistory}
            emptyMessage="No backup history records found."
            keyExtractor={(rec) => rec.id}
            density="compact"
          />
        </div>
      </Panel>
    </div>
  );
};
