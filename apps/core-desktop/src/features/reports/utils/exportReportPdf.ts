import { CanonicalReport } from '../types/reportModel';
import { ReportLayoutConfig, DEFAULT_REPORT_LAYOUT } from '../../../stores/useReportLayoutStore';
import type { Business } from '@40labs/types';

export interface ReportPdfData {
  title: string;
  categoryLabel: string;
  periodLabel: string;
  generatedAt?: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessTin?: string | null;
  businessTmdaNumber?: string | null;
  kpis: { label: string; value: string | number; subtext?: string }[];
  columns: { key: string; header: string }[];
  rows: Record<string, unknown>[];
}

const esc = (str: string): string =>
  String(str ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

/**
 * Pure JavaScript client-side PDF generator for reports with true multi-page support.
 * 100% offline compatible, produces valid multi-page PDF 1.4 Blobs without clipping or truncation.
 */
export function createReportPdfBlob(
  data: ReportPdfData | CanonicalReport,
  layoutConfig?: Partial<ReportLayoutConfig>,
  business?: Business | null
): Blob {
  const cfg: ReportLayoutConfig = { ...DEFAULT_REPORT_LAYOUT, ...layoutConfig };

  // Determine Page Dimensions (in points)
  let pageWidth = 595;
  let pageHeight = 842; // A4 Portrait default

  if (cfg.pageSize === 'Letter') {
    pageWidth = 612;
    pageHeight = 792;
  } else if (cfg.pageSize === 'Legal') {
    pageWidth = 612;
    pageHeight = 1008;
  }

  if (cfg.orientation === 'landscape') {
    const temp = pageWidth;
    pageWidth = pageHeight;
    pageHeight = temp;
  }

  // Determine Margins
  let marginPt = 42; // Normal (approx 15mm)
  if (cfg.margin === 'compact') marginPt = 28; // ~10mm
  if (cfg.margin === 'wide') marginPt = 56; // ~20mm

  const usableWidth = pageWidth - marginPt * 2;
  const bottomMargin = marginPt + 36; // leave room for footer

  // Normalize input data
  let title = 'Executive Report';
  let categoryLabel = 'Sales';
  let periodLabel = 'Current Period';
  let dateStr = new Date().toLocaleString();
  let bizName = business?.name || 'AfyaBora Pharmacy & Health';
  let bizAddress = [
    business?.address?.place,
    business?.address?.district,
    business?.address?.region,
  ].filter(Boolean).join(', ') || 'Dar es Salaam, Tanzania';
  let bizPhone = business?.contacts?.mobile || business?.contacts?.whatsapp || '';
  let bizEmail = business?.contacts?.email || '';
  let bizTin = business?.tin || '';
  let bizTmda = business?.tmda_number || '';

  let kpis: { label: string; value: string | number; subtext?: string }[] = [];
  let columns: { key: string; header: string }[] = [];
  let rows: Record<string, unknown>[] = [];
  let execSummary: string | undefined = undefined;

  if ('metadata' in data) {
    title = data.metadata.title;
    categoryLabel = data.metadata.categoryLabel;
    periodLabel = data.metadata.periodLabel;
    dateStr = data.metadata.generatedAt;
    bizName = data.metadata.businessName || bizName;
    bizAddress = data.metadata.businessAddress || bizAddress;
    bizPhone = data.metadata.businessPhone || bizPhone;
    bizEmail = data.metadata.businessEmail || bizEmail;
    bizTin = data.metadata.businessTin || bizTin;
    bizTmda = data.metadata.businessTmdaNumber || bizTmda;

    kpis = data.kpis || [];
    columns = data.tables[0]?.columns || [];
    rows = data.tables[0]?.rows || [];
    execSummary = data.executiveSummary;
  } else {
    title = data.title;
    categoryLabel = data.categoryLabel;
    periodLabel = data.periodLabel;
    if (data.generatedAt) dateStr = data.generatedAt;
    if (data.businessName) bizName = data.businessName;
    if (data.businessAddress) bizAddress = data.businessAddress;
    if (data.businessPhone) bizPhone = data.businessPhone;
    if (data.businessEmail) bizEmail = data.businessEmail;
    if (data.businessTin) bizTin = data.businessTin;
    if (data.businessTmdaNumber) bizTmda = data.businessTmdaNumber;

    kpis = data.kpis || [];
    columns = data.columns || [];
    rows = data.rows || [];
  }

  // Calculate Column Widths for Table
  const charWidthPt = 5.2; // approx width per character in Courier
  const maxCharsPerLine = Math.max(30, Math.floor(usableWidth / charWidthPt));

  let colWidthChars = Math.floor(maxCharsPerLine / Math.max(1, columns.length));
  colWidthChars = Math.max(8, colWidthChars);

  // Multi-page builder state
  const pagesLines: string[][] = [[]];
  let currentPage = 0;
  let currentY = pageHeight - marginPt;

  const startPage = () => {
    pagesLines.push([]);
    currentPage++;
    currentY = pageHeight - marginPt;

    // Running Header on subsequent pages
    const pLines = pagesLines[currentPage];
    pLines.push('BT');
    pLines.push('/F1 9 Tf');
    pLines.push('12 TL');
    pLines.push(`${marginPt} ${currentY} Td`);
    pLines.push(`(${esc(`${bizName.toUpperCase()} — ${title.toUpperCase()} (Cont.)`)}) Tj T*`);
    pLines.push('/F2 8 Tf');
    pLines.push('10 TL');
    pLines.push(`(Period: ${esc(periodLabel)} | Page ${currentPage + 1}) Tj T*`);
    pLines.push('(----------------------------------------------------------------------------------------------------) Tj T*');
    pLines.push('ET');

    currentY -= 40;

    // Re-draw table header if we are inside a table
    if (columns.length > 0) {
      const headerStr = columns
        .map((col) => col.header.padEnd(colWidthChars, ' ').substring(0, colWidthChars))
        .join(' ')
        .substring(0, maxCharsPerLine);

      const tableLines: string[] = [];
      tableLines.push('BT');
      tableLines.push('/F1 8 Tf');
      tableLines.push('11 TL');
      tableLines.push(`${marginPt} ${currentY} Td`);
      tableLines.push(`(${esc(headerStr)}) Tj T*`);
      tableLines.push('(----------------------------------------------------------------------------------------------------) Tj T*');
      tableLines.push('/F2 8 Tf');
      tableLines.push('ET');

      pagesLines[currentPage].push(tableLines.join('\n'));
      currentY -= 22;
    }
  };

  const checkPageBreak = (neededHeightPt = 14) => {
    if (currentY - neededHeightPt < bottomMargin) {
      startPage();
    }
  };

  // --- PAGE 1 HEADER ---
  const p1 = pagesLines[0];
  const headerLines: string[] = [];
  headerLines.push('BT');
  headerLines.push('/F1 14 Tf');
  headerLines.push('18 TL');
  headerLines.push(`${marginPt} ${currentY} Td`);

  // Business Branding Header
  headerLines.push(`(${esc(bizName.toUpperCase())}) Tj T*`);
  headerLines.push('/F2 9 Tf');
  headerLines.push('12 TL');

  let bizMetaStr = bizAddress;
  if (bizPhone) bizMetaStr += ` | Tel: ${bizPhone}`;
  if (bizEmail) bizMetaStr += ` | Email: ${bizEmail}`;
  headerLines.push(`(${esc(bizMetaStr)}) Tj T*`);

  if (bizTin || bizTmda) {
    let regStr = '';
    if (bizTin) regStr += `TIN: ${bizTin}`;
    if (bizTmda) regStr += `${regStr ? ' | ' : ''}TMDA Reg: ${bizTmda}`;
    headerLines.push(`(${esc(regStr)}) Tj T*`);
  }

  headerLines.push('(====================================================================================================) Tj T*');

  // Report Title Section
  headerLines.push('/F1 12 Tf');
  headerLines.push('15 TL');
  headerLines.push(`(${esc(title.toUpperCase())}) Tj T*`);
  headerLines.push('/F2 9 Tf');
  headerLines.push('12 TL');
  headerLines.push(`(Category: ${esc(categoryLabel)} | Period: ${esc(periodLabel)}) Tj T*`);
  headerLines.push(`(Generated At: ${esc(dateStr)}) Tj T*`);
  if (cfg.watermarkText) {
    headerLines.push(`(Status / Watermark: ${esc(cfg.watermarkText.toUpperCase())}) Tj T*`);
  }
  headerLines.push('(----------------------------------------------------------------------------------------------------) Tj T*');
  headerLines.push('ET');

  p1.push(headerLines.join('\n'));
  currentY -= (bizTin || bizTmda ? 115 : 100);

  // Executive Summary if enabled
  if (cfg.showExecutiveSummary && execSummary) {
    checkPageBreak(30);
    const summaryLines: string[] = [];
    summaryLines.push('BT');
    summaryLines.push('/F1 9 Tf');
    summaryLines.push('12 TL');
    summaryLines.push(`${marginPt} ${currentY} Td`);
    summaryLines.push('(EXECUTIVE SUMMARY) Tj T*');
    summaryLines.push('/F2 8 Tf');
    summaryLines.push('11 TL');

    // Wrap text lines
    const words = execSummary.split(' ');
    let currentLine = '';
    words.forEach((w) => {
      if ((currentLine + ' ' + w).length > maxCharsPerLine) {
        summaryLines.push(`(${esc(currentLine)}) Tj T*`);
        currentLine = w;
        currentY -= 11;
      } else {
        currentLine = currentLine ? currentLine + ' ' + w : w;
      }
    });
    if (currentLine) {
      summaryLines.push(`(${esc(currentLine)}) Tj T*`);
      currentY -= 11;
    }
    summaryLines.push('(----------------------------------------------------------------------------------------------------) Tj T*');
    summaryLines.push('ET');

    p1.push(summaryLines.join('\n'));
    currentY -= 20;
  }

  // KPIs Section if enabled
  if (cfg.showKpis && kpis && kpis.length > 0) {
    checkPageBreak(kpis.length * 12 + 25);
    const kpiLines: string[] = [];
    kpiLines.push('BT');
    kpiLines.push('/F1 10 Tf');
    kpiLines.push('13 TL');
    kpiLines.push(`${marginPt} ${currentY} Td`);
    kpiLines.push('(KEY PERFORMANCE INDICATORS) Tj T*');
    kpiLines.push('/F2 9 Tf');
    kpiLines.push('12 TL');

    kpis.forEach((kpi) => {
      const lineStr = `* ${kpi.label}: ${kpi.value}${kpi.subtext ? ' (' + kpi.subtext + ')' : ''}`;
      kpiLines.push(`(${esc(lineStr.substring(0, maxCharsPerLine))}) Tj T*`);
      currentY -= 12;
    });

    kpiLines.push('(----------------------------------------------------------------------------------------------------) Tj T*');
    kpiLines.push('ET');

    pagesLines[currentPage].push(kpiLines.join('\n'));
    currentY -= 20;
  }

  // Table Section if enabled
  if (cfg.showTables && columns && columns.length > 0 && rows && rows.length > 0) {
    checkPageBreak(40);
    const tblHeaderLines: string[] = [];
    tblHeaderLines.push('BT');
    tblHeaderLines.push('/F1 10 Tf');
    tblHeaderLines.push('13 TL');
    tblHeaderLines.push(`${marginPt} ${currentY} Td`);
    tblHeaderLines.push('(DETAILED BREAKDOWN DATASET) Tj T*');
    tblHeaderLines.push('/F1 8 Tf');
    tblHeaderLines.push('11 TL');

    const headersStr = columns
      .map((col) => col.header.padEnd(colWidthChars, ' ').substring(0, colWidthChars))
      .join(' ')
      .substring(0, maxCharsPerLine);

    tblHeaderLines.push(`(${esc(headersStr)}) Tj T*`);
    tblHeaderLines.push('(----------------------------------------------------------------------------------------------------) Tj T*');
    tblHeaderLines.push('/F2 8 Tf');
    tblHeaderLines.push('ET');

    pagesLines[currentPage].push(tblHeaderLines.join('\n'));
    currentY -= 32;

    // Render ALL rows without clipping or truncation
    rows.forEach((row) => {
      checkPageBreak(12);

      const rowStr = columns
        .map((col) => {
          const val = String(row[col.key] ?? '—');
          return val.length > colWidthChars - 1
            ? val.substring(0, colWidthChars - 2) + '..'
            : val.padEnd(colWidthChars, ' ');
        })
        .join(' ')
        .substring(0, maxCharsPerLine);

      const rowLine = `BT\n/F2 8 Tf\n11 TL\n${marginPt} ${currentY} Td\n(${esc(rowStr)}) Tj\nET`;
      pagesLines[currentPage].push(rowLine);
      currentY -= 11;
    });
  }

  // End of Report Marker
  checkPageBreak(25);
  const endMarker = `BT\n/F1 8 Tf\n11 TL\n${marginPt} ${currentY} Td\n(====================================================================================================) Tj T*\n/F2 8 Tf\n(End of Report -- ${esc(bizName)} -- Official Record) Tj\nET`;
  pagesLines[currentPage].push(endMarker);

  // Append Footers across all pages
  const totalPages = pagesLines.length;
  pagesLines.forEach((pStream, idx) => {
    const footerTextStr = cfg.footerText || `Confidential Report — ${bizName}`;
    const pageNumStr = cfg.showPageNumbers ? `Page ${idx + 1} of ${totalPages}` : '';
    const footerLine = `BT\n/F2 8 Tf\n10 TL\n${marginPt} 25 Td\n(${esc(`${footerTextStr} | ${pageNumStr}`)}) Tj\nET`;
    pStream.push(footerLine);
  });

  // Construct PDF binary object graph
  // Obj 1: Catalog
  // Obj 2: Pages
  // Obj 3..N+2: Page objects
  // Obj N+3..2N+2: Content Stream objects
  // Obj 2N+3: Font F1 (Courier-Bold)
  // Obj 2N+4: Font F2 (Courier)

  const numPages = pagesLines.length;
  const pageObjIds = Array.from({ length: numPages }, (_, i) => 3 + i * 2);
  const streamObjIds = Array.from({ length: numPages }, (_, i) => 4 + i * 2);
  const font1ObjId = 3 + numPages * 2;
  const font2ObjId = font1ObjId + 1;

  const pdfObjects: { id: number; content: string }[] = [];

  // Obj 1: Catalog
  pdfObjects.push({
    id: 1,
    content: '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
  });

  // Obj 2: Pages
  const kidsStr = pageObjIds.map((id) => `${id} 0 R`).join(' ');
  pdfObjects.push({
    id: 2,
    content: `2 0 obj\n<< /Type /Pages /Kids [${kidsStr}] /Count ${numPages} >>\nendobj\n`,
  });

  // Page and Stream objects
  for (let i = 0; i < numPages; i++) {
    const pageObjId = pageObjIds[i];
    const streamObjId = streamObjIds[i];
    const streamText = pagesLines[i].join('\n');
    const streamLen = streamText.length;

    pdfObjects.push({
      id: pageObjId,
      content: `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${font1ObjId} 0 R /F2 ${font2ObjId} 0 R >> >> /Contents ${streamObjId} 0 R >>\nendobj\n`,
    });

    pdfObjects.push({
      id: streamObjId,
      content: `${streamObjId} 0 obj\n<< /Length ${streamLen} >>\nstream\n${streamText}\nendstream\nendobj\n`,
    });
  }

  // Fonts
  pdfObjects.push({
    id: font1ObjId,
    content: `${font1ObjId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>\nendobj\n`,
  });

  pdfObjects.push({
    id: font2ObjId,
    content: `${font2ObjId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n`,
  });

  // Sort objects by ID
  pdfObjects.sort((a, b) => a.id - b.id);

  // Build binary string with XRef table
  const headerStr = '%PDF-1.4\n';
  let offset = headerStr.length;
  const offsets: number[] = [0];

  let bodyStr = headerStr;
  pdfObjects.forEach((obj) => {
    offsets[obj.id] = offset;
    bodyStr += obj.content;
    offset += obj.content.length;
  });

  const startXref = offset;
  let xrefStr = `xref\n0 ${pdfObjects.length + 1}\n0000000000 65535 f \n`;

  for (let i = 1; i <= pdfObjects.length; i++) {
    const off = offsets[i] || 0;
    xrefStr += `${String(off).padStart(10, '0')} 00000 n \n`;
  }

  const trailerStr = `trailer\n<< /Size ${pdfObjects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  const fullPdfText = bodyStr + xrefStr + trailerStr;
  return new Blob([fullPdfText], { type: 'application/pdf' });
}

export function downloadReportPdf(
  data: ReportPdfData | CanonicalReport,
  layoutConfig?: Partial<ReportLayoutConfig>,
  business?: Business | null
): void {
  try {
    const blob = createReportPdfBlob(data, layoutConfig, business);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    let title = 'Report';
    let bizName = business?.name || '';
    if ('metadata' in data) {
      title = data.metadata.title;
      bizName = bizName || data.metadata.businessName || '';
    } else {
      title = data.title;
      bizName = bizName || data.businessName || '';
    }

    const cleanBiz = bizName ? bizName.replace(/[^a-zA-Z0-9_-]/g, '_') + '_' : '';
    const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateTag = new Date().toISOString().split('T')[0];
    const filename = `${cleanBiz}${cleanTitle}_${dateTag}.pdf`;

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
