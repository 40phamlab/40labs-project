import { CanonicalReport } from '../types/reportModel';

export function validateReportForExport(report: CanonicalReport): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!report) {
    errors.push('Report object is null or undefined.');
    return { valid: false, errors };
  }
  if (!report.metadata || !report.metadata.title) {
    errors.push('Report metadata or title is missing.');
  }
  if (!report.metadata?.businessName) {
    errors.push('Business name is required for official report export.');
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Generates a genuine professional Word document blob (WordprocessingML / OpenXML format)
 * ensuring full editability in Microsoft Word, LibreOffice, and Google Docs.
 */
export function createReportDocxBlob(report: CanonicalReport): Blob {
  const validation = validateReportForExport(report);
  if (!validation.valid) {
    throw new Error(`Report export validation failed: ${validation.errors.join(', ')}`);
  }

  const title = escapeXml(report.metadata.title);
  const subtitle = report.metadata.subtitle ? escapeXml(report.metadata.subtitle) : '';
  const category = escapeXml(report.metadata.categoryLabel);
  const period = escapeXml(report.metadata.periodLabel);
  const generated = escapeXml(report.metadata.generatedAt);
  const businessName = escapeXml(report.metadata.businessName);
  const businessTin = escapeXml(report.metadata.businessTin || '');

  let kpiListXml = '';
  if (report.kpis && report.kpis.length > 0) {
    kpiListXml = report.kpis
      .map(
        (k) =>
          `<w:p><w:r><w:rPr><w:b/><w:color w:val="0F172A"/></w:rPr><w:t>${escapeXml(k.label)}: </w:t></w:r><w:r><w:rPr><w:color w:val="334155"/></w:rPr><w:t>${escapeXml(String(k.value))}${k.subtext ? ' (' + escapeXml(k.subtext) + ')' : ''}</w:t></w:r></w:p>`
      )
      .join('');
  }

  let tablesXml = '';
  if (report.tables && report.tables.length > 0) {
    report.tables.forEach((table, idx) => {
      const tableTitle = escapeXml(table.title || `Table ${idx + 1}`);

      const headerCells = table.columns
        .map(
          (c) =>
            `<w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="0F172A"/></w:tcPr><w:p><w:pPr><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="20"/></w:rPr><w:t>${escapeXml(c.header)}</w:t></w:r></w:p></w:tc>`
        )
        .join('');

      let rowsXml = `<w:tr><w:trPr><w:tblHeader/></w:trPr>${headerCells}</w:tr>`;

      table.rows.forEach((row) => {
        const rowCells = table.columns
          .map((col) => {
            const val = row[col.key];
            const valStr = val !== undefined && val !== null ? String(val) : '—';
            return `<w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/></w:tcPr><w:p><w:pPr><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:color w:val="1E293B"/><w:sz w:val="18"/></w:rPr><w:t>${escapeXml(valStr)}</w:t></w:r></w:p></w:tc>`;
          })
          .join('');
        rowsXml += `<w:tr>${rowCells}</w:tr>`;
      });

      tablesXml += `
        <w:p><w:pPr><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="1"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="0F172A"/></w:rPr><w:t>${tableTitle}</w:t></w:r></w:p>
        <w:tbl>
          <w:tblPr>
            <w:tblW w:w="5000" w:type="pct"/>
            <w:tblBorders>
              <w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
              <w:left w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
              <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
              <w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
              <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
              <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
            </w:tblBorders>
          </w:tblPr>
          ${rowsXml}
        </w:tbl>
      `;
    });
  }

  const wordXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<?mso-application progid="Word.Document"?>
<w:wordDocument xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                xmlns:o="urn:schemas-microsoft-com:office:office"
                xmlns:v="urn:schemas-microsoft-com:vml"
                xmlns:w10="urn:schemas-microsoft-com:office:word"
                xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p>
      <w:pPr><w:pStyle w:val="Title"/><w:spacing w:after="100"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="0F172A"/></w:rPr><w:t>${title}</w:t></w:r>
    </w:p>
    ${subtitle ? `<w:p><w:pPr><w:spacing w:after="150"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="24"/><w:color w:val="475569"/></w:rPr><w:t>${subtitle}</w:t></w:r></w:p>` : ''}
    <w:p>
      <w:pPr><w:pBdr><w:bottom w:val="single" w:sz="12" w:space="4" w:color="CBD5E1"/></w:pBdr><w:spacing w:after="200"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="18"/><w:color w:val="64748B"/></w:rPr><w:t>Business: ${businessName} | Category: ${category} | Period: ${period} | Generated: ${generated}${businessTin ? ' | TIN: ' + businessTin : ''}</w:t></w:r>
    </w:p>

    ${report.executiveSummary ? `
      <w:p><w:pPr><w:spacing w:before="120" w:after="60"/><w:outlineLvl w:val="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="0F172A"/></w:rPr><w:t>Executive Summary</w:t></w:r></w:p>
      <w:p><w:pPr><w:spacing w:after="200"/></w:pPr><w:r><w:rPr><w:sz w:val="20"/><w:color w:val="334155"/></w:rPr><w:t>${escapeXml(report.executiveSummary)}</w:t></w:r></w:p>
    ` : ''}

    ${report.kpis && report.kpis.length > 0 ? `
      <w:p><w:pPr><w:spacing w:before="120" w:after="60"/><w:outlineLvl w:val="0"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="0F172A"/></w:rPr><w:t>Key Performance Indicators</w:t></w:r></w:p>
      ${kpiListXml}
    ` : ''}

    ${tablesXml}

    <w:p>
      <w:pPr><w:pBdr><w:top w:val="single" w:sz="6" w:space="8" w:color="E2E8F0"/></w:pBdr><w:spacing w:before="400"/></w:pPr>
      <w:r><w:rPr><w:i/><w:sz w:val="16"/><w:color w:val="94A3B8"/></w:rPr><w:t>40Labs Core Desktop Enterprise Document &mdash; Confidential Internal Report (${businessName})</w:t></w:r>
    </w:p>
  </w:body>
</w:wordDocument>`;

  return new Blob([wordXml], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
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
  const validation = validateReportForExport(report);
  if (!validation.valid) {
    throw new Error(`Report export validation failed: ${validation.errors.join(', ')}`);
  }
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
    throw err;
  }
}
