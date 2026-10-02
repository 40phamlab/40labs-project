import * as React from 'react';
import {
  Modal,
  Button,
} from '@40labs/ui-components';
import { Download, ZoomIn, ZoomOut, Check } from 'lucide-react';
import { CanonicalReport, ExportFormat } from '../types/reportModel';
import { downloadReportPdf } from '../utils/exportReportPdf';
import { downloadReportDocx } from '../utils/exportReportDocx';
import { downloadReportXlsx } from '../utils/exportReportXlsx';
import { downloadReportCsv } from '../utils/exportReportCsv';

export interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: CanonicalReport;
  defaultFormat?: ExportFormat;
  onExportComplete?: (format: ExportFormat) => void;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  onClose,
  report,
  defaultFormat = 'pdf',
  onExportComplete,
}) => {
  const [selectedFormat, setSelectedFormat] = React.useState<ExportFormat>(defaultFormat);
  const [zoomLevel, setZoomLevel] = React.useState<number>(100);
  const [isExporting, setIsExporting] = React.useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedFormat(defaultFormat);
      setZoomLevel(100);
      setIsExporting(false);
      setExportSuccess(false);
    }
  }, [isOpen, defaultFormat]);

  const handleExport = () => {
    setIsExporting(true);
    try {
      if (selectedFormat === 'pdf') {
        downloadReportPdf(report);
      } else if (selectedFormat === 'docx') {
        downloadReportDocx(report);
      } else if (selectedFormat === 'xlsx') {
        downloadReportXlsx(report);
      } else if (selectedFormat === 'csv') {
        downloadReportCsv(report);
      }

      setExportSuccess(true);
      if (onExportComplete) {
        onExportComplete(selectedFormat);
      }

      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Export failed:', err);
      setIsExporting(false);
    }
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 150));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 70));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Print & Export Preview"
      size="xl"
    >
      <div className="flex flex-col gap-4 py-2">
        {/* Toolbar: Format Selector & Zoom Controls */}
        <div className="flex items-center justify-between p-3 rounded-card bg-panel border border-border">
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Output Format:
            </label>
            <div className="flex items-center gap-2">
              {(['pdf', 'docx', 'xlsx', 'csv'] as ExportFormat[]).map((fmt) => {
                const active = selectedFormat === fmt;
                return (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setSelectedFormat(fmt)}
                    className={`px-3 py-1.5 rounded-input text-xs font-bold uppercase transition-all cursor-pointer ${
                      active
                        ? 'bg-primary text-primary-contrast elevation-raised shadow-sm'
                        : 'bg-surface text-text-muted hover:text-text border border-border/50'
                    }`}
                  >
                    {fmt === 'docx' ? 'Word (.docx)' : fmt === 'xlsx' ? 'Excel (.xlsx)' : fmt.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-text-muted">Zoom ({zoomLevel}%):</span>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 rounded-input bg-surface hover:bg-surface-strong border border-border text-text-muted hover:text-text"
              title="Zoom out"
            >
              <ZoomOut size={14} />
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 rounded-input bg-surface hover:bg-surface-strong border border-border text-text-muted hover:text-text"
              title="Zoom in"
            >
              <ZoomIn size={14} />
            </button>
          </div>
        </div>

        {/* Document Preview Canvas */}
        <div className="max-h-[520px] overflow-y-auto p-6 bg-surface-muted rounded-card border border-border flex justify-center">
          <div
            className="bg-panel shadow-lg rounded-card border border-border p-8 flex flex-col gap-6 transition-all"
            style={{ width: `${Math.round(720 * (zoomLevel / 100))}px`, minHeight: '900px' }}
          >
            {/* Document Header */}
            <div className="flex flex-col gap-1 border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-bold">
                  40Labs Core Enterprise Reporting
                </span>
                <span className="text-[10px] text-text-muted font-mono">{report.metadata.generatedAt}</span>
              </div>
              <h1 className="text-xl font-bold font-heading text-text">{report.metadata.title}</h1>
              {report.metadata.subtitle && (
                <p className="text-xs text-text-muted">{report.metadata.subtitle}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-text-muted mt-1">
                <span><b>Category:</b> {report.metadata.categoryLabel}</span>
                <span><b>Period:</b> {report.metadata.periodLabel}</span>
                {report.metadata.dateRangeText && <span><b>Range:</b> {report.metadata.dateRangeText}</span>}
              </div>
            </div>

            {/* Executive Summary */}
            {report.executiveSummary && (
              <div className="flex flex-col gap-1.5 p-3 rounded-input bg-surface border border-border/50">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Executive Summary
                </span>
                <p className="text-xs text-text leading-relaxed">{report.executiveSummary}</p>
              </div>
            )}

            {/* Key Performance Indicators */}
            {report.kpis && report.kpis.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Key Performance Indicators
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {report.kpis.map((kpi, i) => (
                    <div key={i} className="p-3 rounded-card bg-surface border border-border flex flex-col gap-0.5">
                      <span className="text-[10px] font-medium text-text-muted truncate">{kpi.label}</span>
                      <span className="text-sm font-bold font-heading text-text">{kpi.value}</span>
                      {kpi.subtext && <span className="text-[9px] text-primary">{kpi.subtext}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tables Preview */}
            {report.tables && report.tables.map((table, tIdx) => (
              <div key={tIdx} className="flex flex-col gap-2">
                <div className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  {table.title || 'Detailed Dataset'}
                </div>
                <div className="overflow-x-auto border border-border rounded-input">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-panel-strong border-b border-border text-text">
                      <tr>
                        {table.columns.map((col) => (
                          <th key={col.key} className="p-2.5 font-bold uppercase text-[10px] tracking-wider">
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {table.rows.slice(0, 15).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-surface-strong">
                          {table.columns.map((col) => (
                            <td key={col.key} className="p-2 text-text font-mono text-[11px]">
                              {String(row[col.key] ?? '—')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {table.rows.length > 15 && (
                    <div className="p-2 text-center text-[10px] text-text-muted bg-surface">
                      Showing 15 of {table.rows.length} rows (full dataset will be exported)
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-[10px] text-text-muted">
              <span>40Labs Core Desktop — Confidential Internal Document</span>
              <span>Page 1 of 1</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <Button type="button" intent="neutral" size="sm" onClick={onClose}>
            Close Preview
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              intent="primary"
              size="sm"
              leftIcon={exportSuccess ? <Check size={14} /> : <Download size={14} />}
              onClick={handleExport}
              loading={isExporting}
            >
              {exportSuccess ? 'Exported!' : `Export as ${selectedFormat.toUpperCase()}`}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
