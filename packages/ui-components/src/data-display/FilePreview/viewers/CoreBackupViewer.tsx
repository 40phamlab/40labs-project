import * as React from 'react';
import { Spinner } from '../../../feedback/Spinner';
import { Alert } from '../../../feedback/Alert';
import { Button } from '../../../primitives/Button';
import { Badge } from '../../../primitives/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../Table';
import { DatabaseBackup, ShieldCheck, Lock, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

export interface BackupPreviewData {
  business_id: string;
  business_name: string;
  workspace_id: string;
  branch_id: string;
  created_at: string;
  app_version: string;
  schema_version: number;
  is_schema_compatible: boolean;
  total_records: number;
  record_counts: Record<string, number>;
  file_count: number;
  total_file_bytes: number;
  checksum_valid: boolean;
}

export interface RestoreResultData {
  business_id: string;
  business_name: string;
  total_records_restored: number;
  files_restored: number;
  safety_backup_path: string;
  restored_at: string;
}

export interface CoreBackupViewerProps {
  url: string;
  fileName?: string;
  sizeBytes?: number;
  onPreview?: (password: string) => Promise<BackupPreviewData>;
  onRestore?: (password: string) => Promise<RestoreResultData>;
}

export const CoreBackupViewer: React.FC<CoreBackupViewerProps> = ({
  url: _url,
  fileName = 'backup.core',
  sizeBytes,
  onPreview,
  onRestore,
}) => {
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [previewData, setPreviewData] = React.useState<BackupPreviewData | null>(null);

  // Restore modal state
  const [showRestoreModal, setShowRestoreModal] = React.useState(false);
  const [restorePassword, setRestorePassword] = React.useState('');
  const [restoring, setRestoring] = React.useState(false);
  const [restoreResult, setRestoreResult] = React.useState<RestoreResultData | null>(null);

  const handlePreviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the backup password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (!onPreview) {
        throw new Error('Disaster recovery preview handler is not configured.');
      }

      const res = await onPreview(password);
      setPreviewData(res);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Incorrect password or corrupted backup archive.');
    }
  };

  const handleRestoreConfirm = async () => {
    if (!restorePassword.trim()) {
      setError('Please confirm the backup password for restoration.');
      return;
    }

    try {
      setRestoring(true);
      setError(null);

      if (!onRestore) {
        throw new Error('Disaster recovery restore handler is not configured.');
      }

      const res = await onRestore(restorePassword);

      setRestoring(false);
      setShowRestoreModal(false);
      setRestoreResult(res);
    } catch (err: any) {
      setRestoring(false);
      setError(err?.message || 'Failed to restore backup pack.');
    }
  };

  if (restoreResult) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-surface-elevated font-ui">
        <div className="max-w-md w-full bg-surface-secondary/40 border border-success/30 rounded-card p-6 flex flex-col items-center text-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center">
            <CheckCircle2 size={28} />
          </div>
          <h2 className="text-lg font-heading font-bold text-text-primary">Disaster Recovery Restored Successfully</h2>
          <p className="text-xs text-text-muted">
            Business <strong className="text-text-primary">{restoreResult.business_name}</strong> was successfully restored. {restoreResult.total_records_restored.toLocaleString()} records and {restoreResult.files_restored} files were recovered.
          </p>
          <div className="text-[11px] font-mono bg-app-bg p-3 rounded border border-border w-full text-left text-text-secondary space-y-1">
            <div><strong>Safety Backup Created At:</strong></div>
            <div className="truncate">{restoreResult.safety_backup_path}</div>
          </div>
          <Button size="sm" onClick={() => window.location.reload()} className="w-full mt-2">
            Reload Application Workspace
          </Button>
        </div>
      </div>
    );
  }

  if (!previewData) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-surface-elevated font-ui">
        <div className="max-w-md w-full bg-surface-secondary/40 border border-border rounded-card p-8 flex flex-col items-center text-center gap-5 shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-action-primary/10 text-action-primary flex items-center justify-center">
            <DatabaseBackup size={32} />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-heading font-bold text-text-primary">Inspect Disaster Recovery Pack</h2>
            <p className="text-xs text-text-muted">
              {fileName} ({sizeBytes ? `${(sizeBytes / 1024 / 1024).toFixed(2)} MB` : 'Encrypted Archive'})
            </p>
          </div>

          <form onSubmit={handlePreviewSubmit} className="w-full flex flex-col gap-3 text-left">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
                <Lock size={13} />
                <span>Backup Encryption Password</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-3 py-2 bg-app-bg border border-border rounded-md text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-focus-ring"
                autoFocus
              />
            </div>

            {error && (
              <Alert intent="danger" title="Inspection Error">
                {error}
              </Alert>
            )}

            <Button type="submit" disabled={loading} className="w-full mt-2 flex items-center justify-center gap-2">
              {loading ? <Spinner size="sm" /> : <ShieldCheck size={16} />}
              <span>{loading ? 'Decrypting & Inspecting...' : 'Preview Backup Safely'}</span>
            </Button>
          </form>

          <p className="text-[11px] text-text-muted">
            🔒 Opening a backup in preview mode inspects its contents without modifying live application data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-surface-elevated overflow-hidden font-ui">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-secondary/50 shrink-0 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-heading font-bold text-text-primary">{previewData.business_name}</h2>
              <Badge variant="success" size="sm">Valid .core Pack</Badge>
              {previewData.checksum_valid ? (
                <Badge variant="success" size="sm">Integrity Verified</Badge>
              ) : (
                <Badge variant="danger" size="sm">Checksum Warning</Badge>
              )}
            </div>
            <span className="text-xs text-text-muted font-mono">
              ID: {previewData.business_id} • Created: {new Date(previewData.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setPreviewData(null);
              setPassword('');
            }}
          >
            Lock / Close Preview
          </Button>
          <Button
            size="sm"
            onClick={() => setShowRestoreModal(true)}
            className="flex items-center gap-1.5 bg-danger text-white hover:bg-danger/90"
          >
            <RefreshCw size={14} />
            <span>Restore Backup...</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-card bg-surface-secondary/40 border border-border flex flex-col gap-1">
            <span className="text-xs text-text-muted uppercase tracking-wider font-bold">Total Records</span>
            <span className="text-xl font-heading font-bold text-text-primary">{previewData.total_records.toLocaleString()}</span>
          </div>
          <div className="p-4 rounded-card bg-surface-secondary/40 border border-border flex flex-col gap-1">
            <span className="text-xs text-text-muted uppercase tracking-wider font-bold">Attachments / Files</span>
            <span className="text-xl font-heading font-bold text-text-primary">{previewData.file_count} ({(previewData.total_file_bytes / 1024 / 1024).toFixed(2)} MB)</span>
          </div>
          <div className="p-4 rounded-card bg-surface-secondary/40 border border-border flex flex-col gap-1">
            <span className="text-xs text-text-muted uppercase tracking-wider font-bold">App / Schema Version</span>
            <span className="text-xl font-heading font-bold text-text-primary">v{previewData.app_version} (Schema v{previewData.schema_version})</span>
          </div>
          <div className="p-4 rounded-card bg-surface-secondary/40 border border-border flex flex-col gap-1">
            <span className="text-xs text-text-muted uppercase tracking-wider font-bold">Schema Compatibility</span>
            <span className="text-sm font-bold mt-1">
              {previewData.is_schema_compatible ? (
                <span className="text-success flex items-center gap-1">✓ Compatible</span>
              ) : (
                <span className="text-warning flex items-center gap-1">⚠ Newer Schema Version</span>
              )}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-text-primary font-heading">Database Tables & Record Breakdown</h3>
          <div className="border border-border rounded-card overflow-hidden bg-surface-elevated shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Table Name</TableCell>
                  <TableCell isHeader>Record Count</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(previewData.record_counts).map(([table, count]) => (
                  <TableRow key={table}>
                    <TableCell className="font-mono font-bold">{table}</TableCell>
                    <TableCell className="font-mono">{count.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {showRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="max-w-md w-full bg-surface-elevated border border-border rounded-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-danger">
              <AlertTriangle size={24} />
              <h3 className="text-base font-heading font-bold text-text-primary">Confirm Disaster Recovery Restoration</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              You are about to restore backup <strong className="text-text-primary">{fileName}</strong> for business <strong className="text-text-primary">{previewData.business_name}</strong>.
            </p>
            <div className="p-3 rounded bg-warning/10 border border-warning/30 text-xs text-warning space-y-1">
              <div><strong>Important Notice:</strong></div>
              <div>• Live database and attached documents will be overwritten with backup contents.</div>
              <div>• A verified pre-restore safety backup of your current state will be created automatically before restoration.</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">Confirm Backup Password</label>
              <input
                type="password"
                value={restorePassword}
                onChange={(e) => setRestorePassword(e.target.value)}
                placeholder="Confirm backup password..."
                className="w-full px-3 py-2 bg-app-bg border border-border rounded-md text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-focus-ring"
              />
            </div>

            {error && (
              <Alert intent="danger" title="Restore Error">
                {error}
              </Alert>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={restoring}
                onClick={() => setShowRestoreModal(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={restoring}
                onClick={handleRestoreConfirm}
                className="bg-danger text-white hover:bg-danger/90 flex items-center gap-1.5"
              >
                {restoring ? <Spinner size="sm" /> : <RefreshCw size={14} />}
                <span>{restoring ? 'Restoring & Creating Safety Backup...' : 'Proceed with Restore'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
