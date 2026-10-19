import * as React from 'react';
import { Button, Input, Select } from '@40labs/ui-components';
import { FileText, BarChart2, X, Plus } from 'lucide-react';
import type { ScheduleAttachment, ReportTabId, ReportPeriodToken, RepeatInterval } from '@40labs/types';

interface AttachmentPickerProps {
  readonly attachments: ScheduleAttachment[];
  readonly onChange: (attachments: ScheduleAttachment[]) => void;
  readonly repeatInterval: RepeatInterval;
}

const REPORT_OPTIONS: Array<{ id: ReportTabId; title: string }> = [
  { id: 'sales', title: 'Sales & Revenue' },
  { id: 'inventory', title: 'Inventory & Stock' },
  { id: 'customers', title: 'Customer Analytics' },
  { id: 'purchases', title: 'Purchases & Suppliers' },
  { id: 'compliance', title: 'Compliance & Audit' },
];

export const AttachmentPicker: React.FC<AttachmentPickerProps> = ({
  attachments,
  onChange,
  repeatInterval,
}) => {
  const [sourceMode, setSourceMode] = React.useState<'reports' | 'file'>('reports');
  const [selectedReport, setSelectedReport] = React.useState<ReportTabId>('sales');

  const getDefaultPeriodForRepeat = (rep: RepeatInterval): ReportPeriodToken => {
    switch (rep) {
      case 'monthly': return 'previous_month';
      case 'weekly': return 'previous_week';
      case 'daily': return 'previous_day';
      case 'none': default: return 'previous_day';
    }
  };

  const [selectedPeriod, setSelectedPeriod] = React.useState<ReportPeriodToken>(() => getDefaultPeriodForRepeat(repeatInterval));
  const [customFrom, setCustomFrom] = React.useState('');
  const [customTo, setCustomTo] = React.useState('');
  const [fileName, setFileName] = React.useState('');

  const handleAddReport = () => {
    let periodToken: ReportPeriodToken = selectedPeriod;
    if (selectedPeriod === 'custom' as any) {
      periodToken = { from: customFrom || new Date().toISOString().split('T')[0], to: customTo || new Date().toISOString().split('T')[0] };
    }
    const newAtt: ScheduleAttachment = {
      kind: 'report',
      report: selectedReport,
      period: periodToken,
    };
    onChange([...attachments, newAtt]);
  };

  const handleAddFile = () => {
    if (!fileName.trim()) return;
    const newAtt: ScheduleAttachment = {
      kind: 'file',
      file_id: `file_${Date.now()}`,
      name: fileName.trim(),
      size: '240 KB',
    };
    onChange([...attachments, newAtt]);
    setFileName('');
  };

  const handleRemove = (index: number) => {
    onChange(attachments.filter((_, i) => i !== index));
  };

  const getReportTitle = (reportId: ReportTabId) => {
    return REPORT_OPTIONS.find((r) => r.id === reportId)?.title || reportId;
  };

  const getPeriodLabel = (period: ReportPeriodToken) => {
    if (typeof period === 'string') {
      switch (period) {
        case 'previous_day': return 'Previous day';
        case 'previous_week': return 'Previous week';
        case 'previous_month': return 'Previous month';
        default: return period;
      }
    }
    return `Custom (${period.from} - ${period.to})`;
  };

  return (
    <div className="space-y-4">
      {/* Segmented Control: Reports | File */}
      <div className="flex bg-panel p-1 rounded-input border border-border/60 text-xs font-semibold w-fit">
        <button
          type="button"
          onClick={() => setSourceMode('reports')}
          className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
            sourceMode === 'reports' ? 'bg-panel-strong text-accent shadow-xs' : 'text-text-muted hover:text-text'
          }`}
        >
          <BarChart2 size={14} /> Reports
        </button>
        <button
          type="button"
          onClick={() => setSourceMode('file')}
          className={`px-3 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
            sourceMode === 'file' ? 'bg-panel-strong text-accent shadow-xs' : 'text-text-muted hover:text-text'
          }`}
        >
          <FileText size={14} /> File
        </button>
      </div>

      {sourceMode === 'reports' ? (
        <div className="space-y-3 p-3 rounded-xl bg-panel-strong/30 border border-border/40">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-text-muted">Report Type</label>
              <Select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value as ReportTabId)}
                className="text-xs h-8"
              >
                {REPORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.title}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-text-muted">Period</label>
              <Select
                value={typeof selectedPeriod === 'string' ? selectedPeriod : 'custom'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'custom') {
                    setSelectedPeriod({ from: new Date().toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] });
                  } else {
                    setSelectedPeriod(val as ReportPeriodToken);
                  }
                }}
                className="text-xs h-8"
              >
                <option value="previous_day">Previous day</option>
                <option value="previous_week">Previous week</option>
                <option value="previous_month">Previous month</option>
                <option value="custom">Custom range</option>
              </Select>
            </div>
          </div>

          {typeof selectedPeriod !== 'string' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => {
                  setCustomFrom(e.target.value);
                  setSelectedPeriod({ from: e.target.value, to: customTo });
                }}
                placeholder="From"
              />
              <Input
                type="date"
                value={customTo}
                onChange={(e) => {
                  setCustomTo(e.target.value);
                  setSelectedPeriod({ from: customFrom, to: e.target.value });
                }}
                placeholder="To"
              />
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button intent="primary" size="sm" leftIcon={<Plus size={14} />} onClick={handleAddReport}>
              Add Report Attachment
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 p-3 rounded-xl bg-panel-strong/30 border border-border/40">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-text-muted">File Name / ID</label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. policy_doc.pdf"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
              <Button intent="primary" size="sm" onClick={handleAddFile}>
                Attach
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Removable Chips Display */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {attachments.map((att, idx) => {
            const isReport = att.kind === 'report';
            const title = isReport ? getReportTitle(att.report) : (att.name || att.file_id);
            const subLabel = isReport ? getPeriodLabel(att.period) : (att.size || 'File');

            return (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-panel-strong border border-border/60 text-xs font-mono"
              >
                {isReport ? <BarChart2 size={14} className="text-accent" /> : <FileText size={14} className="text-accent" />}
                <span className="text-text font-bold">{title}</span>
                <span className="text-text-muted">·</span>
                <span className="text-text-muted">{subLabel}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="text-text-muted hover:text-danger cursor-pointer ml-1"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
