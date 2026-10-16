import * as React from 'react';
import {
  Panel,
  Button,
  DataTable,
  StatusBadge,
  type ColumnDefinition,
  Field,
  FieldLabel,
  Modal,
} from '@40labs/ui-components';
import {
  ShieldAlert,
  Download,
  Upload,
  Play,
  Lock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  HardDriveDownload,
  Database,
  RefreshCw,
  Info,
} from 'lucide-react';
import type { BackupRecord, ScheduleChannel } from '@40labs/types';
import { useBackup } from '../../../hooks/useBackup';
import { LoaderAnimation } from '../../../components/brand';
import type { BackupPreview, BackupExportResult, RestoreResult } from '../../../api/backupApi';

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
    exportPack,
    previewPack,
    restorePack,
    isExportingPack,
    isPreviewingPack,
    isRestoringPack,
  } = useBackup();

  // Export Modal State
  const [showExportModal, setShowExportModal] = React.useState(false);
  const [exportPath, setExportPath] = React.useState('');
  const [exportPassword, setExportPassword] = React.useState('');
  const [exportConfirmPassword, setExportConfirmPassword] = React.useState('');
  const [exportError, setExportError] = React.useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = React.useState<BackupExportResult | null>(null);

  // Restore Modal State
  const [showRestoreFileModal, setShowRestoreFileModal] = React.useState(false);
  const [restoreFilePath, setRestoreFilePath] = React.useState('');
  const [restorePassword, setRestorePassword] = React.useState('');
  const [restoreError, setRestoreError] = React.useState<string | null>(null);

  // Restore Preview & Confirmation State
  const [previewData, setPreviewData] = React.useState<BackupPreview | null>(null);
  const [showPreviewModal, setShowPreviewModal] = React.useState(false);
  const [restoreSuccess, setRestoreSuccess] = React.useState<RestoreResult | null>(null);

  // Handle Select Export Path
  const handleSelectExportPath = async () => {
    try {
      const dialog = await import('@tauri-apps/plugin-dialog');
      const nowStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const selected = await dialog.save({
        title: 'Save Disaster Recovery Pack (.core)',
        defaultPath: `40Labs_Backup_${nowStr}.core`,
        filters: [{ name: '40Labs Core Backup (*.core)', extensions: ['core'] }],
      });
      if (selected) {
        setExportPath(selected);
      }
    } catch {
      // Fallback path if dialog is unavailable
      const fallback = `C:\\40Labs_Backup_${Date.now()}.core`;
      setExportPath(fallback);
    }
  };

  // Handle Select Restore File
  const handleSelectRestoreFile = async () => {
    try {
      const dialog = await import('@tauri-apps/plugin-dialog');
      const selected = await dialog.open({
        title: 'Select 40Labs Disaster Recovery Pack (.core)',
        multiple: false,
        filters: [{ name: '40Labs Core Backup (*.core)', extensions: ['core'] }],
      });
      if (selected && typeof selected === 'string') {
        setRestoreFilePath(selected);
      }
    } catch {
      // Fallback
    }
  };

  // Submit Export
  const handleExecuteExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setExportError(null);

    if (!exportPath) {
      setExportError('Please select a destination file path.');
      return;
    }
    if (exportPassword.length < 6) {
      setExportError('Password must be at least 6 characters long.');
      return;
    }
    if (exportPassword !== exportConfirmPassword) {
      setExportError('Passwords do not match.');
      return;
    }

    try {
      const result = await exportPack(exportPath, exportPassword);
      setExportSuccess(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setExportError(msg || 'Failed to generate Disaster Recovery Pack.');
    }
  };

  // Submit Preview
  const handleExecutePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setRestoreError(null);

    if (!restoreFilePath) {
      setRestoreError('Please select a .core backup file.');
      return;
    }
    if (!restorePassword) {
      setRestoreError('Please enter the backup password.');
      return;
    }

    try {
      const preview = await previewPack(restoreFilePath, restorePassword);
      setPreviewData(preview);
      setShowRestoreFileModal(false);
      setShowPreviewModal(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setRestoreError(msg || 'Incorrect password or corrupted backup file.');
    }
  };

  // Submit Restore
  const handleExecuteRestore = async () => {
    setRestoreError(null);
    try {
      const result = await restorePack(restoreFilePath, restorePassword);
      setShowPreviewModal(false);
      setRestoreSuccess(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setRestoreError(msg || 'Restoration failed. Application was safely rolled back.');
    }
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
  ];

  return (
    <div className="flex flex-col gap-6 pb-8 max-w-3xl">
      {/* Disaster Recovery Pack Section */}
      <Panel variant="raised" className="p-6 space-y-5 border-l-4 border-l-primary">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert size={20} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-text-primary">
                  Disaster Recovery Pack (.core)
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold font-mono rounded bg-primary/20 text-primary uppercase">
                  Encrypted Format
                </span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Export your complete 40Labs business data, customers, inventory, sales, lab records, users, audit history, and attachments into a portable, password-protected <code className="font-mono text-text-primary font-bold">.core</code> file. Transfer it to another machine or recover your business after a system failure.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            type="button"
            intent="primary"
            size="md"
            leftIcon={<Download size={16} />}
            onClick={() => {
              setExportError(null);
              setExportSuccess(null);
              setExportPath('');
              setExportPassword('');
              setExportConfirmPassword('');
              setShowExportModal(true);
            }}
          >
            Export Disaster Recovery Pack
          </Button>

          <Button
            type="button"
            variant="neutral"
            size="md"
            leftIcon={<Upload size={16} />}
            onClick={() => {
              setRestoreError(null);
              setRestoreFilePath('');
              setRestorePassword('');
              setShowRestoreFileModal(true);
            }}
          >
            Restore Business from .core File
          </Button>
        </div>
      </Panel>

      {/* Cloud Backup & Scheduled Snapshots */}
      <Panel variant="raised" className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-panel-subtle text-text-muted flex items-center justify-center shrink-0 border border-border/50">
              <Database size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Local SQLite Snapshots & Scheduled Backups
              </h3>
              <p className="text-xs text-text-muted">
                Automatic background snapshots saved locally to your device. Cloud account backup and Google Drive sync can be configured once cloud authentication is enabled.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 bg-panel-subtle rounded-card border border-border/50">
          <Field>
            <FieldLabel>Local Snapshot Frequency</FieldLabel>
            <select
              value={schedule?.frequency || 'daily'}
              onChange={(e) => updateSchedule({ frequency: e.target.value as 'daily' | 'weekly' | 'monthly' })}
              disabled={isLoadingSchedule || isUpdatingSchedule}
              className="w-full bg-panel border border-border rounded-input px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="daily">Daily Snapshot</option>
              <option value="weekly">Weekly Schedule</option>
              <option value="monthly">Monthly Archive</option>
            </select>
          </Field>

          <Field>
            <FieldLabel>Backup Destination</FieldLabel>
            <select
              value={schedule?.channel || 'in_app'}
              onChange={(e) => updateSchedule({ channel: e.target.value as ScheduleChannel })}
              disabled={isLoadingSchedule || isUpdatingSchedule}
              className="w-full bg-panel border border-border rounded-input px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="in_app">Local Storage Snapshot Only</option>
              <option value="google_drive" disabled>
                Google Drive (Cloud Sync - Coming Soon)
              </option>
              <option value="gmail" disabled>
                Email Relay (Cloud Sync - Coming Soon)
              </option>
            </select>
          </Field>
        </div>

        {isRunningBackup && (
          <div className="p-4 bg-panel-subtle rounded-card border border-primary/30 flex items-center justify-center my-2">
            <LoaderAnimation variant="long" size={48} label="Inahifadhi data ya nakala..." />
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-text-muted">
            Last local snapshot:{' '}
            <span className="font-mono font-semibold text-text-primary">
              {schedule?.last_run_at ? new Date(schedule.last_run_at).toLocaleString() : 'Never'}
            </span>
          </div>

          <Button
            type="button"
            variant="neutral"
            size="sm"
            leftIcon={<Play size={14} />}
            onClick={() => runBackup()}
            disabled={isRunningBackup}
          >
            {isRunningBackup ? 'Executing...' : 'Create Local Snapshot Now'}
          </Button>
        </div>
      </Panel>

      {/* History Log */}
      <Panel variant="raised" className="p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Backup Audit & Snapshot History</h3>
          <p className="text-xs text-text-muted">
            Historical audit log of local snapshot creations and disaster recovery exports.
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

      {/* MODAL: Export Disaster Recovery Pack */}
      <Modal
        isOpen={showExportModal}
        onClose={() => !isExportingPack && setShowExportModal(false)}
        title="Export Disaster Recovery Pack (.core)"
        size="md"
      >
        {exportSuccess ? (
          <div className="space-y-4 p-2 text-center">
            <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <h4 className="text-base font-bold text-text-primary">Export Successful!</h4>
              <p className="text-xs text-text-muted mt-1">
                Your Disaster Recovery Pack has been encrypted and saved. Keep your password in a safe place.
              </p>
            </div>

            <div className="p-4 bg-panel-subtle rounded-card border border-border/50 text-left space-y-2 text-xs font-mono text-text-secondary">
              <div>
                <span className="text-text-muted">Business:</span> {exportSuccess.business_name} ({exportSuccess.business_id})
              </div>
              <div>
                <span className="text-text-muted">File Path:</span> {exportSuccess.archive_path}
              </div>
              <div>
                <span className="text-text-muted">Archive Size:</span> {formatBytes(exportSuccess.size_bytes)}
              </div>
              <div>
                <span className="text-text-muted">Total Records:</span> {exportSuccess.total_records.toLocaleString()}
              </div>
            </div>

            <Button
              type="button"
              intent="primary"
              size="md"
              className="w-full mt-2"
              onClick={() => setShowExportModal(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleExecuteExport} className="space-y-4">
            <div className="p-3 bg-primary/5 rounded-card border border-primary/20 text-xs text-text-secondary flex gap-2.5 items-start">
              <Info size={16} className="text-primary shrink-0 mt-0.5" />
              <span>
                This pack contains your database snapshot, customer records, inventory, sales, lab results, user credentials, and attached files encrypted with Argon2id + AES-256-GCM.
              </span>
            </div>

            <Field>
              <FieldLabel required>Destination File Path</FieldLabel>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={exportPath}
                  onChange={(e) => setExportPath(e.target.value)}
                  placeholder="Select save destination..."
                  readOnly
                  className="flex-1 bg-panel border border-border rounded-input px-3 py-2 text-xs font-mono text-text focus:outline-none"
                />
                <Button
                  type="button"
                  variant="neutral"
                  size="sm"
                  leftIcon={<HardDriveDownload size={14} />}
                  onClick={handleSelectExportPath}
                >
                  Browse
                </Button>
              </div>
            </Field>

            <Field>
              <FieldLabel required>Encryption Password</FieldLabel>
              <div className="relative">
                <input
                  type="password"
                  value={exportPassword}
                  onChange={(e) => setExportPassword(e.target.value)}
                  placeholder="Enter a strong password (min 6 chars)"
                  className="w-full bg-panel border border-border rounded-input px-3 py-2 pr-9 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Lock size={14} className="absolute right-3 top-2.5 text-text-muted pointer-events-none" />
              </div>
            </Field>

            <Field>
              <FieldLabel required>Confirm Password</FieldLabel>
              <input
                type="password"
                value={exportConfirmPassword}
                onChange={(e) => setExportConfirmPassword(e.target.value)}
                placeholder="Re-enter encryption password"
                className="w-full bg-panel border border-border rounded-input px-3 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </Field>

            {exportError && (
              <div className="p-3 bg-error/10 border border-error/30 rounded-card text-xs text-error flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{exportError}</span>
              </div>
            )}

            {isExportingPack ? (
              <div className="p-4 bg-panel-subtle rounded-card border border-primary/30 flex items-center justify-center">
                <LoaderAnimation variant="long" size={48} label="Creating encrypted .core backup..." />
              </div>
            ) : (
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="neutral"
                  size="sm"
                  onClick={() => setShowExportModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  intent="primary"
                  size="sm"
                  disabled={!exportPath || !exportPassword || exportPassword.length < 6}
                >
                  Generate & Export Pack
                </Button>
              </div>
            )}
          </form>
        )}
      </Modal>

      {/* MODAL: Select Restore File & Enter Password */}
      <Modal
        isOpen={showRestoreFileModal}
        onClose={() => !isPreviewingPack && setShowRestoreFileModal(false)}
        title="Open Disaster Recovery Pack (.core)"
        size="md"
      >
        <form onSubmit={handleExecutePreview} className="space-y-4">
          <p className="text-xs text-text-muted leading-relaxed">
            Select a <code className="font-mono font-bold text-text-primary">.core</code> backup file and enter its encryption password to preview contents before restoring.
          </p>

          <Field>
            <FieldLabel required>Select .core File</FieldLabel>
            <div className="flex gap-2">
              <input
                type="text"
                value={restoreFilePath}
                onChange={(e) => setRestoreFilePath(e.target.value)}
                placeholder="Select .core file location..."
                readOnly
                className="flex-1 bg-panel border border-border rounded-input px-3 py-2 text-xs font-mono text-text focus:outline-none"
              />
              <Button
                type="button"
                variant="neutral"
                size="sm"
                leftIcon={<FileCheck size={14} />}
                onClick={handleSelectRestoreFile}
              >
                Browse
              </Button>
            </div>
          </Field>

          <Field>
            <FieldLabel required>Backup Password</FieldLabel>
            <div className="relative">
              <input
                type="password"
                value={restorePassword}
                onChange={(e) => setRestorePassword(e.target.value)}
                placeholder="Enter backup encryption password"
                className="w-full bg-panel border border-border rounded-input px-3 py-2 pr-9 text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Lock size={14} className="absolute right-3 top-2.5 text-text-muted pointer-events-none" />
            </div>
          </Field>

          {restoreError && (
            <div className="p-3 bg-error/10 border border-error/30 rounded-card text-xs text-error flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{restoreError}</span>
            </div>
          )}

          {isPreviewingPack ? (
            <div className="p-4 bg-panel-subtle rounded-card border border-primary/30 flex items-center justify-center">
              <LoaderAnimation variant="long" size={48} label="Decrypting and inspecting backup pack..." />
            </div>
          ) : (
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="neutral"
                size="sm"
                onClick={() => setShowRestoreFileModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                intent="primary"
                size="sm"
                disabled={!restoreFilePath || !restorePassword}
              >
                Preview Contents
              </Button>
            </div>
          )}
        </form>
      </Modal>

      {/* MODAL: Restore Preview & Final Confirmation */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => !isRestoringPack && setShowPreviewModal(false)}
        title="Restore Business Preview & Safety Warning"
        size="lg"
      >
        {previewData && (
          <div className="space-y-5">
            {/* Business Header Summary */}
            <div className="p-4 bg-panel-subtle rounded-card border border-border/50 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase font-bold text-text-muted">Target Business Identity</span>
                <h4 className="text-base font-bold text-text-primary mt-0.5">
                  {previewData.business_name}{' '}
                  <span className="font-mono text-xs text-primary font-semibold">({previewData.business_id})</span>
                </h4>
                <p className="text-xs text-text-muted mt-1">
                  Backup Created:{' '}
                  <span className="font-mono text-text-primary">
                    {new Date(previewData.created_at).toLocaleString()}
                  </span>
                </p>
              </div>

              <div className="text-right">
                <StatusBadge
                  status={previewData.is_schema_compatible ? 'success' : 'error'}
                  label={previewData.is_schema_compatible ? 'Compatible' : 'Incompatible'}
                />
                <p className="text-[11px] font-mono text-text-muted mt-1">
                  Schema v{previewData.schema_version} • App v{previewData.app_version}
                </p>
              </div>
            </div>

            {/* Record Breakdown Matrix */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Backup Data Contents
              </h5>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 bg-panel rounded-card border border-border/50 text-center">
                  <div className="text-lg font-mono font-bold text-text-primary">
                    {previewData.total_records.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-text-muted">Total Database Records</div>
                </div>

                <div className="p-3 bg-panel rounded-card border border-border/50 text-center">
                  <div className="text-lg font-mono font-bold text-text-primary">
                    {previewData.file_count.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-text-muted">
                    Attachments ({formatBytes(previewData.total_file_bytes)})
                  </div>
                </div>

                <div className="p-3 bg-panel rounded-card border border-border/50 text-center">
                  <div className="text-lg font-mono font-bold text-success">
                    {previewData.checksum_valid ? '100% Valid' : 'Checksum Warning'}
                  </div>
                  <div className="text-[11px] text-text-muted">SHA-256 Integrity</div>
                </div>
              </div>
            </div>

            {/* Safety Warning Alert */}
            <div className="p-4 bg-warning/10 border border-warning/40 rounded-card space-y-2 text-xs text-text-secondary">
              <div className="flex items-center gap-2 font-bold text-warning text-sm">
                <AlertTriangle size={18} className="shrink-0" />
                <span>Warning: Full Database State Replacement</span>
              </div>
              <p className="leading-relaxed">
                Restoring this backup will replace the live database on this device with the records from <strong>{previewData.business_name}</strong>.
              </p>
              <p className="text-text-muted">
                A recoverable safety backup of your current database will be created automatically at <code className="font-mono text-text-primary font-bold">App_Data/backups/pre_restore_safety_*</code> before swapping states.
              </p>
            </div>

            {restoreError && (
              <div className="p-3 bg-error/10 border border-error/30 rounded-card text-xs text-error flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{restoreError}</span>
              </div>
            )}

            {isRestoringPack ? (
              <div className="p-5 bg-panel-subtle rounded-card border border-primary/30 flex items-center justify-center">
                <LoaderAnimation variant="long" size={48} label="Safely applying database restoration..." />
              </div>
            ) : (
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="neutral"
                  size="sm"
                  onClick={() => setShowPreviewModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  intent="danger"
                  size="sm"
                  disabled={!previewData.is_schema_compatible}
                  onClick={handleExecuteRestore}
                >
                  Confirm & Execute Restoration
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL: Restoration Success Modal */}
      <Modal
        isOpen={!!restoreSuccess}
        onClose={() => setRestoreSuccess(null)}
        title="Restoration Complete"
        size="md"
      >
        {restoreSuccess && (
          <div className="space-y-4 text-center p-2">
            <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <h4 className="text-base font-bold text-text-primary">Business Restored Successfully!</h4>
              <p className="text-xs text-text-muted mt-1">
                Your application has switched to the restored state for {restoreSuccess.business_name}.
              </p>
            </div>

            <div className="p-4 bg-panel-subtle rounded-card border border-border/50 text-left space-y-2 text-xs font-mono text-text-secondary">
              <div>
                <span className="text-text-muted">Business Name:</span> {restoreSuccess.business_name} ({restoreSuccess.business_id})
              </div>
              <div>
                <span className="text-text-muted">Records Restored:</span> {restoreSuccess.total_records_restored.toLocaleString()}
              </div>
              <div>
                <span className="text-text-muted">Files Restored:</span> {restoreSuccess.files_restored.toLocaleString()}
              </div>
              <div>
                <span className="text-text-muted">Safety Backup:</span> {restoreSuccess.safety_backup_path}
              </div>
            </div>

            <Button
              type="button"
              intent="primary"
              size="md"
              leftIcon={<RefreshCw size={16} />}
              className="w-full mt-2"
              onClick={() => {
                setRestoreSuccess(null);
                window.location.reload();
              }}
            >
              Reload Application Workspace
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
