import * as React from 'react';
import { Button } from '@40labs/ui-components';
import { CheckCircle2, Download } from 'lucide-react';
import { SummaryReport } from './types';

interface StepSummaryProps {
  summaryReport: SummaryReport;
  onDone: () => void;
}

export const StepSummary: React.FC<StepSummaryProps> = ({ summaryReport, onDone }) => {
  const handleDownloadErrorReport = () => {
    if (summaryReport.failedRows.length === 0) return;
    const header = 'Row,Reason,Data\n';
    const lines = summaryReport.failedRows.map((f) => `${f.rowIdx},"${f.reason}","${JSON.stringify(f.data).replace(/"/g, '""')}"`);
    const csv = '\uFEFF' + header + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import_error_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center gap-5">
      <div className="w-14 h-14 rounded-full bg-success/10 text-success flex items-center justify-center">
        <CheckCircle2 size={32} />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-heading font-bold text-text-primary">Import Completed Successfully</h3>
        <p className="text-xs text-text-muted">Transactions committed securely through established persistence layer.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
        <div className="p-3 rounded bg-surface-secondary/40 border border-border flex flex-col">
          <span className="text-[11px] text-text-muted uppercase font-bold">Imported</span>
          <span className="text-lg font-heading font-bold text-success">{summaryReport.imported}</span>
        </div>
        <div className="p-3 rounded bg-surface-secondary/40 border border-border flex flex-col">
          <span className="text-[11px] text-text-muted uppercase font-bold">Updated</span>
          <span className="text-lg font-heading font-bold text-text-primary">{summaryReport.updated}</span>
        </div>
        <div className="p-3 rounded bg-surface-secondary/40 border border-border flex flex-col">
          <span className="text-[11px] text-text-muted uppercase font-bold">Skipped</span>
          <span className="text-lg font-heading font-bold text-warning">{summaryReport.skipped}</span>
        </div>
        <div className="p-3 rounded bg-surface-secondary/40 border border-border flex flex-col">
          <span className="text-[11px] text-text-muted uppercase font-bold">Failed</span>
          <span className="text-lg font-heading font-bold text-danger">{summaryReport.failed}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        {summaryReport.failedRows.length > 0 && (
          <Button variant="secondary" size="sm" onClick={handleDownloadErrorReport} className="flex items-center gap-1.5">
            <Download size={14} />
            <span>Download Error Report (CSV)</span>
          </Button>
        )}
        <Button size="sm" onClick={onDone} className="bg-action-primary text-text-inverse">
          Done
        </Button>
      </div>
    </div>
  );
};
