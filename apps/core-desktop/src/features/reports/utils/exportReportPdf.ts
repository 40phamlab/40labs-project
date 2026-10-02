import { CanonicalReport } from '../types/reportModel';

export interface ReportPdfData {
  title: string;
  categoryLabel: string;
  periodLabel: string;
  generatedAt?: string;
  kpis: { label: string; value: string | number; subtext?: string }[];
  columns: { key: string; header: string }[];
  rows: Record<string, unknown>[];
}

/**
 * Pure JavaScript client-side PDF generator for reports.
 * 100% offline compatible, produces valid PDF 1.4 Blobs without external dependencies.
 */
export function createReportPdfBlob(data: ReportPdfData | CanonicalReport): Blob {
  // Normalize CanonicalReport to ReportPdfData if necessary
  let pdfData: ReportPdfData;
  if ('metadata' in data) {
    pdfData = {
      title: data.metadata.title,
      categoryLabel: data.metadata.categoryLabel,
      periodLabel: data.metadata.periodLabel,
      generatedAt: data.metadata.generatedAt,
      kpis: data.kpis,
      columns: data.tables[0]?.columns || [],
      rows: data.tables[0]?.rows || [],
    };
  } else {
    pdfData = data;
  }

  const lines: string[] = [];

  const esc = (str: string) =>
    String(str)
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');

  const dateStr = pdfData.generatedAt || new Date().toLocaleString();

  // Page stream setup (A4 size: 595 x 842 pt)
  lines.push('BT');
  lines.push('/F1 14 Tf'); // Courier-Bold
  lines.push('18 TL');
  lines.push('40 800 Td');

  // Header
  lines.push(`(${esc('40LABS POS & PHARMACY MANAGEMENT REPORT')}) Tj T*`);
  lines.push('/F2 10 Tf');
  lines.push('14 TL');
  lines.push(`(Report: ${esc(pdfData.title.toUpperCase())}) Tj T*`);
  lines.push(`(Period: ${esc(pdfData.periodLabel)}) Tj T*`);
  lines.push(`(Generated: ${esc(dateStr)}) Tj T*`);
  lines.push('(========================================================================) Tj T*');

  // KPIs Section
  if (pdfData.kpis && pdfData.kpis.length > 0) {
    lines.push('/F1 11 Tf');
    lines.push('(KEY PERFORMANCE INDICATORS) Tj T*');
    lines.push('/F2 9 Tf');
    lines.push('12 TL');
    pdfData.kpis.forEach((kpi) => {
      const lineStr = `- ${kpi.label}: ${kpi.value}${kpi.subtext ? ' (' + kpi.subtext + ')' : ''}`;
      lines.push(`(${esc(lineStr)}) Tj T*`);
    });
    lines.push('(------------------------------------------------------------------------) Tj T*');
  }

  // Table Section
  if (pdfData.columns && pdfData.columns.length > 0 && pdfData.rows && pdfData.rows.length > 0) {
    lines.push('/F1 11 Tf');
    lines.push('(DETAILED REPORT DATA) Tj T*');
    lines.push('/F1 9 Tf');

    // Header row
    const headersStr = pdfData.columns.map((col) => col.header.padEnd(16, ' ')).join(' ').substring(0, 72);
    lines.push(`(${esc(headersStr)}) Tj T*`);
    lines.push('/F2 8 Tf');
    lines.push('11 TL');

    // Rows (up to 40 rows to fit on page)
    pdfData.rows.slice(0, 40).forEach((row) => {
      const rowStr = pdfData.columns
        .map((col) => {
          const val = String(row[col.key] ?? '—');
          return val.length > 15 ? val.substring(0, 13) + '..' : val.padEnd(16, ' ');
        })
        .join(' ')
        .substring(0, 72);
      lines.push(`(${esc(rowStr)}) Tj T*`);
    });

    if (pdfData.rows.length > 40) {
      lines.push(`(... and ${pdfData.rows.length - 40} more entries) Tj T*`);
    }
  }

  lines.push('(========================================================================) Tj T*');
  lines.push('/F2 8 Tf');
  lines.push('(End of Report -- Confidential -- 40Labs Internal Data) Tj T*');
  lines.push('ET');

  const streamContent = lines.join('\n');
  const streamLength = streamContent.length;

  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 =
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n';
  const obj4 = '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>\nendobj\n';
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n';
  const obj6 = `6 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`;

  const header = '%PDF-1.4\n';

  let currentOffset = header.length;
  const offsets = [0];

  offsets.push(currentOffset); currentOffset += obj1.length;
  offsets.push(currentOffset); currentOffset += obj2.length;
  offsets.push(currentOffset); currentOffset += obj3.length;
  offsets.push(currentOffset); currentOffset += obj4.length;
  offsets.push(currentOffset); currentOffset += obj5.length;
  offsets.push(currentOffset); currentOffset += obj6.length;

  const startXref = currentOffset;

  let xref = `xref\n0 7\n0000000000 65535 f \n`;
  for (let i = 1; i <= 6; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  const fullPdf = header + obj1 + obj2 + obj3 + obj4 + obj5 + obj6 + xref + trailer;

  return new Blob([fullPdf], { type: 'application/pdf' });
}

export function downloadReportPdf(data: ReportPdfData | CanonicalReport): void {
  try {
    const blob = createReportPdfBlob(data);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const title = 'metadata' in data ? data.metadata.title : data.title;
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${sanitizedTitle}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error('Failed to download report PDF:', err);
  }
}
