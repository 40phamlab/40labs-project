import { describe, it, expect } from 'vitest';
import { CanonicalReport } from '../types/reportModel';
import { createReportCsvBlob } from './exportReportCsv';
import { createReportXlsxBlob } from './exportReportXlsx';
import { createReportDocxBlob } from './exportReportDocx';
import { createReportPdfBlob } from './exportReportPdf';

const mockReport: CanonicalReport = {
  metadata: {
    title: 'Sales Executive Report',
    subtitle: 'Test performance breakdown',
    categoryLabel: 'Sales & POS',
    periodLabel: 'LAST MONTH',
    dateRangeText: '2026-02-01 – 2026-02-28',
    generatedAt: '2026-03-01 12:00:00',
    authorOrOrganization: '40Labs Core Desktop',
  },
  executiveSummary: 'This is a test summary for sales.',
  kpis: [
    { label: 'Total Revenue', value: '$12,450.00', subtext: '+15%' },
    { label: 'Transactions', value: '342' },
  ],
  tables: [
    {
      title: 'Top Products',
      columns: [
        { key: 'name', header: 'Product Name' },
        { key: 'qty', header: 'Quantity Sold' },
        { key: 'revenue', header: 'Revenue' },
      ],
      rows: [
        { name: 'Paracetamol "Extra"', qty: 50, revenue: '$250.00' },
        { name: 'Amoxicillin 500mg', qty: 30, revenue: '$450.00' },
      ],
    },
  ],
  notes: ['Test note'],
  footnotes: ['Confidential'],
};

describe('Reporting & Multi-Format Export System', () => {
  it('should construct a valid canonical report model', () => {
    expect(mockReport.metadata.title).toBe('Sales Executive Report');
    expect(mockReport.kpis.length).toBe(2);
    expect(mockReport.tables.length).toBe(1);
    expect(mockReport.tables[0].rows.length).toBe(2);
  });

  it('should generate CSV blob with UTF-8 BOM and escaped quotes', async () => {
    const blob = createReportCsvBlob(mockReport);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toContain('text/csv');
    const text = await blob.text();
    expect(text).toContain('Sales Executive Report');
    expect(text.includes('Paracetamol ""Extra""')).toBe(true);
  });

  it('should generate XLSX spreadsheet blob', async () => {
    const blob = createReportXlsxBlob(mockReport);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toContain('excel');
    const text = await blob.text();
    expect(text).toContain('Sales Executive Report');
    expect(text).toContain('Total Revenue');
  });

  it('should generate DOCX Word document blob', async () => {
    const blob = createReportDocxBlob(mockReport);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toContain('msword');
    const text = await blob.text();
    expect(text).toContain('Sales Executive Report');
    expect(text).toContain('Executive Summary');
  });

  it('should generate PDF document blob', async () => {
    const blob = createReportPdfBlob(mockReport);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
    const text = await blob.text();
    expect(text).toContain('%PDF-1.4');
    expect(text).toContain('40LABS POS & PHARMACY MANAGEMENT REPORT');
  });
});
