import { CanonicalReport } from '../types/reportModel';

export function createReportCsvBlob(report: CanonicalReport): Blob {
  const lines: string[] = [];

  // Metadata rows
  lines.push(`"# REPORT: ${escapeCsv(report.metadata.title)}"`);
  if (report.metadata.subtitle) {
    lines.push(`"# SUBTITLE: ${escapeCsv(report.metadata.subtitle)}"`);
  }
  lines.push(`"# CATEGORY: ${escapeCsv(report.metadata.categoryLabel)}"`);
  lines.push(`"# PERIOD: ${escapeCsv(report.metadata.periodLabel)}"`);
  if (report.metadata.dateRangeText) {
    lines.push(`"# DATE RANGE: ${escapeCsv(report.metadata.dateRangeText)}"`);
  }
  lines.push(`"# GENERATED AT: ${escapeCsv(report.metadata.generatedAt)}"`);
  lines.push('');

  // KPIs Section if present
  if (report.kpis && report.kpis.length > 0) {
    lines.push('"KEY PERFORMANCE INDICATORS"');
    lines.push('"Metric","Value","Subtext"');
    report.kpis.forEach((kpi) => {
      lines.push(`"${escapeCsv(kpi.label)}","${escapeCsv(String(kpi.value))}","${escapeCsv(kpi.subtext || '')}"`);
    });
    lines.push('');
  }

  // Detailed Tables
  if (report.tables && report.tables.length > 0) {
    report.tables.forEach((table, idx) => {
      if (report.tables.length > 1 || table.title) {
        lines.push(`"# TABLE ${idx + 1}: ${escapeCsv(table.title || 'Detailed Data')}"`);
      }

      const headers = table.columns.map((c) => escapeCsv(c.header));
      lines.push(headers.map((h) => `"${h}"`).join(','));

      table.rows.forEach((row) => {
        const rowVals = table.columns.map((col) => {
          const val = row[col.key];
          return escapeCsv(val !== undefined && val !== null ? String(val) : '');
        });
        lines.push(rowVals.map((v) => `"${v}"`).join(','));
      });
      lines.push('');
    });
  }

  const csvContent = '\uFEFF' + lines.join('\r\n');
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}

function escapeCsv(str: string): string {
  return String(str).replace(/"/g, '""');
}

export function downloadReportCsv(report: CanonicalReport): void {
  try {
    const blob = createReportCsvBlob(report);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const sanitizedTitle = report.metadata.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${sanitizedTitle}_${new Date().toISOString().split('T')[0]}.csv`;
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('Failed to export CSV report:', err);
  }
}
