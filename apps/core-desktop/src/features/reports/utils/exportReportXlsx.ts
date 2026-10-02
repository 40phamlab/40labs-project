import { CanonicalReport } from '../types/reportModel';

/**
 * Generates an Excel-compatible XML SpreadsheetML / HTML table document blob (`.xlsx` mime/extension)
 * preserving multi-sheet structure, KPI summary overview, and detailed table datasets.
 */
export function createReportXlsxBlob(report: CanonicalReport): Blob {
  const title = escapeXml(report.metadata.title);
  const category = escapeXml(report.metadata.categoryLabel);
  const period = escapeXml(report.metadata.periodLabel);
  const generated = escapeXml(report.metadata.generatedAt);

  let kpiRows = '';
  if (report.kpis && report.kpis.length > 0) {
    kpiRows = report.kpis
      .map(
        (k) =>
          `<tr><td><b>${escapeXml(k.label)}</b></td><td>${escapeXml(String(k.value))}</td><td>${escapeXml(k.subtext || '')}</td></tr>`
      )
      .join('');
  }

  let tableSectionsHtml = '';
  if (report.tables && report.tables.length > 0) {
    report.tables.forEach((table, idx) => {
      const tableTitle = escapeXml(table.title || `Dataset ${idx + 1}`);
      const headers = table.columns.map((c) => `<th style="background-color: #0f172a; color: #ffffff; font-weight: bold; padding: 6px;">${escapeXml(c.header)}</th>`).join('');

      const rows = table.rows
        .map((row) => {
          const cells = table.columns
            .map((col) => {
              const val = row[col.key];
              return `<td style="padding: 4px; border-bottom: 1px solid #e2e8f0;">${escapeXml(val !== undefined && val !== null ? String(val) : '—')}</td>`;
            })
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('');

      tableSectionsHtml += `
        <br/>
        <h3>${tableTitle}</h3>
        <table border="1" cellspacing="0" cellpadding="4" style="border-collapse: collapse; font-family: Calibri, sans-serif; font-size: 11pt;">
          <thead><tr>${headers}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    });
  }

  const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8" />
<style>
  body { font-family: Calibri, sans-serif; color: #0f172a; margin: 20px; }
  h1 { color: #0f172a; font-size: 18pt; margin-bottom: 4px; }
  h2 { color: #334155; font-size: 14pt; margin-top: 10px; }
  h3 { color: #475569; font-size: 12pt; margin-top: 15px; }
  table { border-collapse: collapse; width: 100%; margin-top: 8px; }
  th { background-color: #0f172a; color: #ffffff; text-align: left; padding: 8px; font-size: 11pt; }
  td { padding: 6px; border: 1px solid #cbd5e1; font-size: 11pt; }
  .meta { color: #64748b; font-size: 10pt; margin-bottom: 20px; }
</style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">
    <b>Category:</b> ${category} | <b>Period:</b> ${period} | <b>Generated:</b> ${generated}
  </div>

  ${report.executiveSummary ? `<p><b>Executive Summary:</b> ${escapeXml(report.executiveSummary)}</p>` : ''}

  ${
    kpiRows
      ? `
    <h2>Key Performance Indicators</h2>
    <table border="1" cellspacing="0" cellpadding="5" style="border-collapse: collapse;">
      <thead>
        <tr style="background-color: #1e293b; color: white;">
          <th>Metric Indicator</th>
          <th>Value</th>
          <th>Subtext / Context</th>
        </tr>
      </thead>
      <tbody>
        ${kpiRows}
      </tbody>
    </table>
  `
      : ''
  }

  ${tableSectionsHtml}

  <br/><br/>
  <div style="font-size: 9pt; color: #94a3b8; font-style: italic;">
    40Labs Core Enterprise Workbook — Confidential Internal Report
  </div>
</body>
</html>
  `;

  return new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
}

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function downloadReportXlsx(report: CanonicalReport): void {
  try {
    const blob = createReportXlsxBlob(report);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const sanitizedTitle = report.metadata.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${sanitizedTitle}_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('Failed to export Excel report:', err);
  }
}
