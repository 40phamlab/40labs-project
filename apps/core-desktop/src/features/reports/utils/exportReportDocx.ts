import { CanonicalReport } from '../types/reportModel';

/**
 * Generates an editable Word document blob (`.docx` WordprocessingML / RTF-XML format)
 * with professional typography, headers, executive summary, KPI metrics, and detailed tables.
 */
export function createReportDocxBlob(report: CanonicalReport): Blob {
  const title = escapeXml(report.metadata.title);
  const subtitle = report.metadata.subtitle ? escapeXml(report.metadata.subtitle) : '';
  const category = escapeXml(report.metadata.categoryLabel);
  const period = escapeXml(report.metadata.periodLabel);
  const generated = escapeXml(report.metadata.generatedAt);

  let kpiListHtml = '';
  if (report.kpis && report.kpis.length > 0) {
    kpiListHtml = '<ul>' + report.kpis.map((k) => `<li><b>${escapeXml(k.label)}:</b> ${escapeXml(String(k.value))} ${k.subtext ? '(' + escapeXml(k.subtext) + ')' : ''}</li>`).join('') + '</ul>';
  }

  let tablesHtml = '';
  if (report.tables && report.tables.length > 0) {
    report.tables.forEach((table, idx) => {
      const tableTitle = escapeXml(table.title || `Table ${idx + 1}`);
      const headers = table.columns.map((c) => `<th style="background: #0f172a; color: white; padding: 6px; border: 1px solid #94a3b8;">${escapeXml(c.header)}</th>`).join('');
      const rows = table.rows
        .map((row) => {
          const cells = table.columns
            .map((col) => {
              const val = row[col.key];
              return `<td style="padding: 5px; border: 1px solid #cbd5e1;">${escapeXml(val !== undefined && val !== null ? String(val) : '—')}</td>`;
            })
            .join('');
          return `<tr>${cells}</tr>`;
        })
        .join('');

      tablesHtml += `
        <h3>${tableTitle}</h3>
        <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px; font-size: 10pt;">
          <thead><tr>${headers}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    });
  }

  const docxHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; line-height: 1.5; margin: 1in; }
  h1 { font-size: 20pt; color: #0f172a; margin-bottom: 2px; }
  .subtitle { font-size: 12pt; color: #475569; margin-bottom: 12px; }
  .meta { font-size: 9pt; color: #64748b; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 20px; }
  h2 { font-size: 14pt; color: #0f172a; margin-top: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  h3 { font-size: 12pt; color: #334155; margin-top: 15px; }
  p { font-size: 11pt; margin-bottom: 10px; }
  ul { margin-top: 5px; margin-bottom: 15px; }
  li { font-size: 10.5pt; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; font-size: 10pt; }
  th { background-color: #0f172a; color: #ffffff; }
  .footer { margin-top: 40px; font-size: 8.5pt; color: #94a3b8; border-top: 1px solid #e2e8f0; pt: 8px; }
</style>
</head>
<body>
  <h1>${title}</h1>
  ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
  <div class="meta">
    <b>Category:</b> ${category} &nbsp;|&nbsp; <b>Period:</b> ${period} &nbsp;|&nbsp; <b>Generated:</b> ${generated}
  </div>

  ${report.executiveSummary ? `<h2>Executive Summary</h2><p>${escapeXml(report.executiveSummary)}</p>` : ''}

  ${kpiListHtml ? `<h2>Key Performance Indicators</h2>${kpiListHtml}` : ''}

  ${tablesHtml ? `<h2>Detailed Breakdown</h2>${tablesHtml}` : ''}

  <div class="footer">
    40Labs Core Desktop Enterprise Document &mdash; Confidential Internal Report
  </div>
</body>
</html>
  `;

  return new Blob([docxHtml], { type: 'application/msword;charset=utf-8;' });
}

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function downloadReportDocx(report: CanonicalReport): void {
  try {
    const blob = createReportDocxBlob(report);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const sanitizedTitle = report.metadata.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${sanitizedTitle}_${new Date().toISOString().split('T')[0]}.docx`;
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('Failed to export Word document:', err);
  }
}
