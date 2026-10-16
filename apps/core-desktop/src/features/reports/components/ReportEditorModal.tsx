import * as React from 'react';
import {
  Modal,
  Button,
  Select,
  Input,
  Switch,
} from '@40labs/ui-components';
import {
  Printer,
  Download,
  ZoomIn,
  ZoomOut,
  Save,
  SlidersHorizontal,
  Building2,
  Check,
} from 'lucide-react';
import { CanonicalReport, ExportFormat } from '../types/reportModel';
import {
  useReportLayoutStore,
  PageSize,
  PageMargin,
  PaperTheme,
  TableStyle,
  ChartColorTheme,
  TypographyFamily,
  TypographySize,
  HeaderAlign,
} from '../../../stores/useReportLayoutStore';
import { useBusiness } from '../../../hooks/useBusiness';
import { downloadReportPdf } from '../utils/exportReportPdf';
import { downloadReportDocx } from '../utils/exportReportDocx';
import { downloadReportXlsx } from '../utils/exportReportXlsx';
import { downloadReportCsv } from '../utils/exportReportCsv';

export interface ReportEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: CanonicalReport;
  onExportComplete?: (format: ExportFormat) => void;
}

export const ReportEditorModal: React.FC<ReportEditorModalProps> = ({
  isOpen,
  onClose,
  report,
  onExportComplete,
}) => {
  const { business } = useBusiness();
  const {
    config,
    presets,
    activePresetId,
    updateConfig,
    resetConfig,
    applyPreset,
    saveCustomPreset,
  } = useReportLayoutStore();

  const [zoomLevel, setZoomLevel] = React.useState<number>(100);
  const [selectedFormat, setSelectedFormat] = React.useState<ExportFormat>('pdf');
  const [newPresetName, setNewPresetName] = React.useState('');
  const [isSavingPreset, setIsSavingPreset] = React.useState(false);
  const [presetSavedSuccess, setPresetSavedSuccess] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'layout' | 'typography' | 'branding' | 'content'>('layout');

  React.useEffect(() => {
    if (isOpen) {
      setZoomLevel(100);
      setIsSavingPreset(false);
      setPresetSavedSuccess(false);
    }
  }, [isOpen]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 150));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 70));

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    saveCustomPreset(newPresetName.trim());
    setNewPresetName('');
    setIsSavingPreset(false);
    setPresetSavedSuccess(true);
    setTimeout(() => setPresetSavedSuccess(false), 2000);
  };

  const handlePrintNative = () => {
    window.print();
  };

  const handleExport = () => {
    if (selectedFormat === 'pdf') {
      downloadReportPdf(report, config, business);
    } else if (selectedFormat === 'docx') {
      downloadReportDocx(report);
    } else if (selectedFormat === 'xlsx') {
      downloadReportXlsx(report);
    } else if (selectedFormat === 'csv') {
      downloadReportCsv(report);
    }

    if (onExportComplete) {
      onExportComplete(selectedFormat);
    }
  };

  // Determine Paper Theme Background & Text Classes
  const getPaperBgClass = (theme: PaperTheme) => {
    switch (theme) {
      case 'warm': return 'bg-[#faf8f5] text-[#292524] border-[#e7e5e4]';
      case 'cool': return 'bg-[#f8fafc] text-[#0f172a] border-[#e2e8f0]';
      case 'slate': return 'bg-[#f1f5f9] text-[#1e293b] border-[#cbd5e1]';
      case 'dark': return 'bg-[#18181b] text-[#f4f4f5] border-[#3f3f46]';
      case 'white':
      default: return 'bg-white text-black border-neutral-300';
    }
  };

  // Accent Color Mapping
  const getAccentColor = (theme: ChartColorTheme) => {
    switch (theme) {
      case 'blue': return { text: 'text-sky-600', bg: 'bg-sky-500/10', border: 'border-sky-500/30', hex: '#0284c7' };
      case 'emerald': return { text: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', hex: '#059669' };
      case 'indigo': return { text: 'text-indigo-600', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', hex: '#4f46e5' };
      case 'amber': return { text: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/30', hex: '#d97706' };
      case 'slate': return { text: 'text-slate-600', bg: 'bg-slate-500/10', border: 'border-slate-500/30', hex: '#475569' };
      case 'teal':
      default: return { text: 'text-teal-600', bg: 'bg-teal-500/10', border: 'border-teal-500/30', hex: '#0d9488' };
    }
  };

  // Font Family Class
  const getFontFamilyClass = (family: TypographyFamily) => {
    switch (family) {
      case 'serif': return 'font-serif';
      case 'mono': return 'font-mono';
      case 'sans':
      default: return 'font-sans';
    }
  };

  const accent = getAccentColor(config.chartTheme);
  const paperClass = getPaperBgClass(config.paperTheme);
  const fontClass = getFontFamilyClass(config.fontFamily);

  // Business Profile Info
  const bizName = business?.name || report.metadata.businessName || 'AfyaBora Pharmacy & Health';
  const bizAddress = [
    business?.address?.place,
    business?.address?.district,
    business?.address?.region,
  ].filter(Boolean).join(', ') || report.metadata.businessAddress || 'Dar es Salaam, Tanzania';
  const bizPhone = business?.contacts?.mobile || business?.contacts?.whatsapp || report.metadata.businessPhone || '';
  const bizEmail = business?.contacts?.email || report.metadata.businessEmail || '';
  const bizTin = business?.tin || report.metadata.businessTin || '';
  const bizTmda = business?.tmda_number || report.metadata.businessTmdaNumber || '';

  // Aspect ratio styling based on Page Size & Orientation
  let paperWidthPx = 720;
  if (config.pageSize === 'Letter') paperWidthPx = 700;
  if (config.pageSize === 'Legal') paperWidthPx = 700;
  if (config.orientation === 'landscape') paperWidthPx = 960;

  const adjustedWidthPx = Math.round(paperWidthPx * (zoomLevel / 100));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Layout Editor & Print-Accurate Preview"
      size="full"
    >
      <div className="flex flex-col h-[calc(90vh-100px)] overflow-hidden">
        {/* Top Control Bar: Presets & Quick Mode Switch */}
        <div className="flex flex-wrap items-center justify-between p-3 rounded-card bg-panel border border-border gap-3 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-primary shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Layout Preset:</span>
            </div>
            <div className="w-56">
              <Select
                size="sm"
                value={activePresetId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => applyPreset(e.target.value)}
              >
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>

            {isSavingPreset ? (
              <div className="flex items-center gap-1.5">
                <Input
                  size="sm"
                  placeholder="Preset Name..."
                  value={newPresetName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPresetName(e.target.value)}
                  className="w-40"
                />
                <Button type="button" intent="primary" size="sm" onClick={handleSavePreset}>
                  Save
                </Button>
                <Button type="button" intent="neutral" size="sm" onClick={() => setIsSavingPreset(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                intent="neutral"
                size="sm"
                leftIcon={<Save size={13} />}
                onClick={() => setIsSavingPreset(true)}
              >
                Save as Preset
              </Button>
            )}

            {presetSavedSuccess && (
              <span className="text-xs font-bold text-success flex items-center gap-1">
                <Check size={14} /> Preset saved!
              </span>
            )}
          </div>

          {/* Zoom & Format Bar */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-muted">Format:</span>
              <div className="flex items-center gap-1">
                {(['pdf', 'docx', 'xlsx', 'csv'] as ExportFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setSelectedFormat(fmt)}
                    className={`px-2.5 py-1 rounded text-xs font-bold uppercase cursor-pointer ${
                      selectedFormat === fmt
                        ? 'bg-primary text-primary-contrast'
                        : 'bg-surface hover:bg-surface-strong border border-border/50 text-text-muted'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-text-muted border-l border-border pl-3">
              <span>Zoom ({zoomLevel}%):</span>
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 rounded bg-surface hover:bg-surface-strong border border-border"
                title="Zoom Out"
              >
                <ZoomOut size={13} />
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 rounded bg-surface hover:bg-surface-strong border border-border"
                title="Zoom In"
              >
                <ZoomIn size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Split Body: Left Editor Sidebar | Right Live Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 pt-3">
          {/* Left Panel: Presentation Settings Editor */}
          <div className="lg:col-span-4 flex flex-col gap-3 min-h-0 bg-panel rounded-card border border-border p-3 overflow-y-auto custom-scrollbar">
            {/* Nav Tabs */}
            <div className="flex items-center border-b border-border pb-2 gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('layout')}
                className={`flex-1 py-1.5 px-2 rounded text-xs font-bold text-center cursor-pointer transition-colors ${
                  activeTab === 'layout' ? 'bg-primary text-primary-contrast' : 'text-text-muted hover:bg-surface'
                }`}
              >
                Geometry
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('typography')}
                className={`flex-1 py-1.5 px-2 rounded text-xs font-bold text-center cursor-pointer transition-colors ${
                  activeTab === 'typography' ? 'bg-primary text-primary-contrast' : 'text-text-muted hover:bg-surface'
                }`}
              >
                Styling
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('branding')}
                className={`flex-1 py-1.5 px-2 rounded text-xs font-bold text-center cursor-pointer transition-colors ${
                  activeTab === 'branding' ? 'bg-primary text-primary-contrast' : 'text-text-muted hover:bg-surface'
                }`}
              >
                Branding
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`flex-1 py-1.5 px-2 rounded text-xs font-bold text-center cursor-pointer transition-colors ${
                  activeTab === 'content' ? 'bg-primary text-primary-contrast' : 'text-text-muted hover:bg-surface'
                }`}
              >
                Sections
              </button>
            </div>

            {/* TAB 1: GEOMETRY & MARGINS */}
            {activeTab === 'layout' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-text-muted">Page Paper Size</label>
                  <Select
                    size="sm"
                    value={config.pageSize}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateConfig({ pageSize: e.target.value as PageSize })}
                  >
                    <option value="A4">A4 (Standard ISO 210 × 297 mm)</option>
                    <option value="Letter">US Letter (8.5 × 11 in)</option>
                    <option value="Legal">US Legal (8.5 × 14 in)</option>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-text-muted">Orientation</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateConfig({ orientation: 'portrait' })}
                      className={`p-2 rounded border text-xs font-bold cursor-pointer ${
                        config.orientation === 'portrait'
                          ? 'bg-panel-strong border-primary text-text'
                          : 'bg-surface text-text-muted'
                      }`}
                    >
                      Portrait (Vertical)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateConfig({ orientation: 'landscape' })}
                      className={`p-2 rounded border text-xs font-bold cursor-pointer ${
                        config.orientation === 'landscape'
                          ? 'bg-panel-strong border-primary text-text'
                          : 'bg-surface text-text-muted'
                      }`}
                    >
                      Landscape (Wide)
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-text-muted">Page Margins</label>
                  <Select
                    size="sm"
                    value={config.margin}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateConfig({ margin: e.target.value as PageMargin })}
                  >
                    <option value="compact">Compact (10 mm)</option>
                    <option value="normal">Normal (15 mm / Standard)</option>
                    <option value="wide">Wide (20 mm / Executive)</option>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-text-muted">Table Display Style</label>
                  <Select
                    size="sm"
                    value={config.tableStyle}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateConfig({ tableStyle: e.target.value as TableStyle })}
                  >
                    <option value="striped">Striped Alternating Rows</option>
                    <option value="minimal">Clean Minimal (Light Borders)</option>
                    <option value="bordered">Full Grid Matrix</option>
                    <option value="compact">Dense Compact Ledger</option>
                  </Select>
                </div>
              </div>
            )}

            {/* TAB 2: STYLING & TYPOGRAPHY */}
            {activeTab === 'typography' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-text-muted">Paper Theme & Background</label>
                  <Select
                    size="sm"
                    value={config.paperTheme}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateConfig({ paperTheme: e.target.value as PaperTheme })}
                  >
                    <option value="white">Pure White (High Contrast)</option>
                    <option value="warm">Warm Ivory / Linen</option>
                    <option value="cool">Cool Gray Modern</option>
                    <option value="slate">Soft Slate Corporate</option>
                    <option value="dark">Modern Dark Mode</option>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-text-muted">Accent & Chart Color Theme</label>
                  <Select
                    size="sm"
                    value={config.chartTheme}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateConfig({ chartTheme: e.target.value as ChartColorTheme })}
                  >
                    <option value="teal">Teal / Cyan (#0d9488)</option>
                    <option value="blue">Corporate Blue (#0284c7)</option>
                    <option value="emerald">Emerald Green (#059669)</option>
                    <option value="indigo">Deep Indigo (#4f46e5)</option>
                    <option value="amber">Warm Amber (#d97706)</option>
                    <option value="slate">Monochrome Slate (#475569)</option>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-text-muted">Typography Font Family</label>
                  <Select
                    size="sm"
                    value={config.fontFamily}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateConfig({ fontFamily: e.target.value as TypographyFamily })}
                  >
                    <option value="sans">Sans-Serif (Modern / Inter)</option>
                    <option value="serif">Serif (Traditional / Georgia)</option>
                    <option value="mono">Monospace (Technical / EFD Ledger)</option>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-text-muted">Font Scale</label>
                  <Select
                    size="sm"
                    value={config.fontSize}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateConfig({ fontSize: e.target.value as TypographySize })}
                  >
                    <option value="sm">Small / Compact</option>
                    <option value="base">Normal Standard</option>
                    <option value="lg">Large / Executive</option>
                  </Select>
                </div>
              </div>
            )}

            {/* TAB 3: BRANDING & HEADERS */}
            {activeTab === 'branding' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5 p-2.5 rounded bg-surface border border-border/50">
                  <div className="flex items-center gap-2 text-xs font-bold text-text">
                    <Building2 size={14} className="text-primary" />
                    <span>Loaded Business Identity:</span>
                  </div>
                  <span className="text-xs font-bold text-text-muted">{bizName}</span>
                  <span className="text-[10px] text-text-muted">{bizAddress}</span>
                  {bizPhone && <span className="text-[10px] text-text-muted">Tel: {bizPhone}</span>}
                  {(bizTin || bizTmda) && (
                    <span className="text-[10px] font-mono text-primary">
                      TIN: {bizTin || 'N/A'} · TMDA: {bizTmda || 'N/A'}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-text-muted">Custom Document Subtitle</label>
                  <Input
                    size="sm"
                    value={config.headerSubtitle}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig({ headerSubtitle: e.target.value })}
                    placeholder="Optional subtitle override..."
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-text-muted">Header Text Alignment</label>
                  <Select
                    size="sm"
                    value={config.headerAlign}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateConfig({ headerAlign: e.target.value as HeaderAlign })}
                  >
                    <option value="left">Left Aligned</option>
                    <option value="center">Centered</option>
                    <option value="right">Right Aligned</option>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-text-muted">Watermark Text</label>
                  <Select
                    size="sm"
                    value={config.watermarkText}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateConfig({ watermarkText: e.target.value })}
                  >
                    <option value="">No Watermark (Clean)</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="INTERNAL USE ONLY">INTERNAL USE ONLY</option>
                    <option value="FINAL APPROVED">FINAL APPROVED</option>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-text-muted">Footer Text</label>
                  <Input
                    size="sm"
                    value={config.footerText}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig({ footerText: e.target.value })}
                    placeholder="Footer disclaimer..."
                  />
                </div>
              </div>
            )}

            {/* TAB 4: SECTIONS TOGGLE */}
            {activeTab === 'content' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-2 rounded bg-surface border border-border/50">
                  <span className="text-xs font-bold">Executive Summary</span>
                  <Switch
                    checked={config.showExecutiveSummary}
                    onChange={(checked: boolean) => updateConfig({ showExecutiveSummary: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-surface border border-border/50">
                  <span className="text-xs font-bold">Key Performance Indicators</span>
                  <Switch
                    checked={config.showKpis}
                    onChange={(checked: boolean) => updateConfig({ showKpis: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-surface border border-border/50">
                  <span className="text-xs font-bold">Overview Chart</span>
                  <Switch
                    checked={config.showCharts}
                    onChange={(checked: boolean) => updateConfig({ showCharts: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-surface border border-border/50">
                  <span className="text-xs font-bold">Detailed Data Table</span>
                  <Switch
                    checked={config.showTables}
                    onChange={(checked: boolean) => updateConfig({ showTables: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded bg-surface border border-border/50">
                  <span className="text-xs font-bold">Page Numbers in Footer</span>
                  <Switch
                    checked={config.showPageNumbers}
                    onChange={(checked: boolean) => updateConfig({ showPageNumbers: checked })}
                  />
                </div>

                <div className="pt-2">
                  <Button type="button" intent="neutral" size="sm" onClick={resetConfig} className="w-full">
                    Reset to Default Settings
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Live Print-Accurate Paper Canvas */}
          <div className="lg:col-span-8 flex flex-col items-center justify-start min-h-0 bg-surface-muted rounded-card border border-border p-4 overflow-y-auto custom-scrollbar">
            {/* The Dedicated Printable Container */}
            <div
              id="report-print-container"
              className={`report-print-layer transition-all duration-200 shadow-xl rounded border relative p-8 flex flex-col gap-6 ${paperClass} ${fontClass}`}
              style={{
                width: `${adjustedWidthPx}px`,
                minHeight: config.orientation === 'landscape' ? '600px' : '900px',
              }}
            >
              {/* Watermark Overlay if enabled */}
              {config.watermarkText && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10 select-none overflow-hidden">
                  <span className="text-7xl font-black uppercase tracking-widest -rotate-45 text-current">
                    {config.watermarkText}
                  </span>
                </div>
              )}

              {/* Business Identity Header */}
              <div
                className={`flex flex-col gap-1 border-b pb-4 ${
                  config.headerAlign === 'center'
                    ? 'text-center items-center'
                    : config.headerAlign === 'right'
                    ? 'text-right items-end'
                    : 'text-left items-start'
                }`}
              >
                <div className="flex items-center gap-3">
                  {business?.logo_url && config.logoPosition !== 'none' && (
                    <img
                      src={business.logo_url}
                      alt="Business Logo"
                      className="h-10 w-10 object-contain rounded border border-border/50"
                    />
                  )}
                  <div className="flex flex-col">
                    <h1 className="text-2xl font-black tracking-tight">{bizName}</h1>
                    <span className="text-xs font-medium opacity-75">{bizAddress}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] opacity-80 mt-1 font-mono">
                  {bizPhone && <span><b>Tel:</b> {bizPhone}</span>}
                  {bizEmail && <span><b>Email:</b> {bizEmail}</span>}
                  {bizTin && <span><b>TIN:</b> {bizTin}</span>}
                  {bizTmda && <span><b>TMDA:</b> {bizTmda}</span>}
                </div>

                <div className="w-full h-px bg-current/20 my-2" />

                {/* Report Meta Header */}
                <h2 className={`text-lg font-bold ${accent.text}`}>{report.metadata.title}</h2>
                <span className="text-xs opacity-80">
                  {config.headerSubtitle || report.metadata.subtitle}
                </span>

                <div className="flex items-center gap-4 text-xs opacity-75 mt-1">
                  <span><b>Category:</b> {report.metadata.categoryLabel}</span>
                  <span><b>Period:</b> {report.metadata.periodLabel}</span>
                  {report.metadata.dateRangeText && <span><b>Range:</b> {report.metadata.dateRangeText}</span>}
                  <span><b>Generated:</b> {report.metadata.generatedAt}</span>
                </div>
              </div>

              {/* Executive Summary Section */}
              {config.showExecutiveSummary && report.executiveSummary && (
                <div className={`p-3 rounded border ${accent.bg} ${accent.border} flex flex-col gap-1`}>
                  <span className={`text-xs font-bold uppercase tracking-wider ${accent.text}`}>
                    Executive Summary
                  </span>
                  <p className="text-xs leading-relaxed opacity-90">{report.executiveSummary}</p>
                </div>
              )}

              {/* Key Performance Indicators Section */}
              {config.showKpis && report.kpis && report.kpis.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${accent.text}`}>
                    Key Performance Indicators
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {report.kpis.map((kpi, i) => (
                      <div key={i} className={`p-2.5 rounded border bg-current/5 border-current/20 flex flex-col gap-0.5`}>
                        <span className="text-[10px] font-medium opacity-75 truncate">{kpi.label}</span>
                        <span className={`text-sm font-bold ${accent.text}`}>{kpi.value}</span>
                        {kpi.subtext && <span className="text-[9px] opacity-70">{kpi.subtext}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Charts Section */}
              {config.showCharts && report.charts && report.charts.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${accent.text}`}>
                    {report.charts[0].title}
                  </span>
                  <div className={`p-3 rounded border bg-current/5 border-current/20 h-40 flex items-end gap-2 px-6`}>
                    {report.charts[0].data.slice(0, 12).map((dp, i) => {
                      const maxVal = Math.max(...report.charts![0].data.map((d) => d.value), 1);
                      const heightPct = Math.max(8, Math.round((dp.value / maxVal) * 100));
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                          <div
                            className={`w-full rounded-t ${accent.text} bg-current`}
                            style={{ height: `${heightPct}%` }}
                          />
                          <span className="text-[9px] opacity-70 truncate max-w-[40px] text-center">
                            {dp.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tables Section */}
              {config.showTables && report.tables && report.tables.map((tbl, tIdx) => (
                <div key={tIdx} className="flex flex-col gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${accent.text}`}>
                    {tbl.title || 'Detailed Dataset'}
                  </span>
                  <div className="overflow-x-auto border border-current/20 rounded">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-current/30 font-bold bg-current/5">
                        <tr>
                          {tbl.columns.map((col) => (
                            <th key={col.key} className="p-2 text-[10px] uppercase tracking-wider">
                              {col.header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-current/10">
                        {tbl.rows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className={
                              config.tableStyle === 'striped' && rIdx % 2 === 1 ? 'bg-current/5' : ''
                            }
                          >
                            {tbl.columns.map((col) => (
                              <td key={col.key} className="p-2 text-[11px] font-mono">
                                {String(row[col.key] ?? '—')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {/* Document Footer */}
              <div className="mt-auto pt-4 border-t border-current/20 flex items-center justify-between text-[10px] opacity-70">
                <span>{config.footerText || `Confidential Report — ${bizName}`}</span>
                {config.showPageNumbers && <span>Page 1 of 1</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-border shrink-0">
          <Button type="button" intent="neutral" size="sm" onClick={onClose}>
            Close Editor
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              intent="secondary"
              size="sm"
              leftIcon={<Printer size={14} />}
              onClick={handlePrintNative}
            >
              Print Report
            </Button>
            <Button
              type="button"
              intent="primary"
              size="sm"
              leftIcon={<Download size={14} />}
              onClick={handleExport}
            >
              Export as {selectedFormat.toUpperCase()}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
