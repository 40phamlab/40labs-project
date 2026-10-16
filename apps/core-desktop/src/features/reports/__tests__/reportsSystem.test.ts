import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReportLayoutStore, DEFAULT_REPORT_LAYOUT } from '../../../stores/useReportLayoutStore';
import { convertCategoryDataToCanonical } from '../types/reportModel';
import { createReportPdfBlob } from '../utils/exportReportPdf';
import { reportCategoriesConfig } from '../config/reportCategories';
import type { Business } from '@40labs/types';

const mockBusiness: Business = {
  id: 'biz_001',
  business_id: 'biz_001',
  workspace_id: 'ws_001',
  branch_id: 'br_001',
  role_scopes: [],
  tier: 'class_2',
  name: 'AfyaBora Specialized Pharmacy',
  tin: '123-456-789',
  tmda_number: 'TMDA/FAR/2026/089',
  contacts: {
    mobile: '+255 754 000 111',
    email: 'info@afyabora.co.tz',
    whatsapp: '+255 754 000 111',
  },
  address: {
    region: 'Dar es Salaam',
    district: 'Kinondoni',
    place: 'Kijitonyama',
  },
  logo_url: 'https://afyabora.co.tz/logo.png',
  appearance_mode: 'light',
  language: 'sw-TZ',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockSales = [
  {
    id: 'sale_1',
    workspace_id: 'ws_001',
    branch_id: 'br_001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    customer_id: 'cust_1',
    lines: [
      { id: 'l1', inventory_item_id: 'inv_1', medicine_id: 'med_1', quantity: 2, unit_price: 5000, subtotal: 10000, dispensed_by_user_id: 'u1', is_prescription_dispense: false },
    ],
    payment_method: 'cash' as const,
    discount_amount: 1000,
    discount_authorized_by_user_id: 'u1',
    tax_amount: 1600,
    grand_total: 10600,
    currency: 'TZS',
    synced_at: null,
  },
];

describe('Report Layout Store & Presentation Settings', () => {
  beforeEach(() => {
    localStorage.clear();
    const { result } = renderHook(() => useReportLayoutStore());
    act(() => {
      result.current.resetConfig();
    });
  });

  it('should initialize with default corporate layout settings', () => {
    const { result } = renderHook(() => useReportLayoutStore());
    expect(result.current.config.pageSize).toBe('A4');
    expect(result.current.config.orientation).toBe('portrait');
    expect(result.current.config.margin).toBe('normal');
  });

  it('should allow updating presentation preferences independently from data', () => {
    const { result } = renderHook(() => useReportLayoutStore());
    act(() => {
      result.current.updateConfig({
        pageSize: 'Letter',
        orientation: 'landscape',
        watermarkText: 'CONFIDENTIAL',
        chartTheme: 'emerald',
      });
    });

    expect(result.current.config.pageSize).toBe('Letter');
    expect(result.current.config.orientation).toBe('landscape');
    expect(result.current.config.watermarkText).toBe('CONFIDENTIAL');
    expect(result.current.config.chartTheme).toBe('emerald');
  });

  it('should apply and switch layout presets', () => {
    const { result } = renderHook(() => useReportLayoutStore());
    act(() => {
      result.current.applyPreset('executive_summary');
    });

    expect(result.current.config.paperTheme).toBe('warm');
    expect(result.current.config.fontFamily).toBe('serif');
    expect(result.current.config.watermarkText).toBe('CONFIDENTIAL');
  });

  it('should allow saving custom report layout presets', () => {
    const { result } = renderHook(() => useReportLayoutStore());
    act(() => {
      result.current.updateConfig({ tableStyle: 'bordered', watermarkText: 'DRAFT' });
      result.current.saveCustomPreset('My Custom Board Preset');
    });

    expect(result.current.presets.some((p) => p.name === 'My Custom Board Preset')).toBe(true);
  });
});

describe('Business Identity Branding & PDF Export Engine', () => {
  it('should inject actual business identity into canonical report metadata', () => {
    const canonical = convertCategoryDataToCanonical(
      'sales',
      'THIS MONTH',
      { start: new Date('2026-01-01'), end: new Date() },
      () => ({
        categoryConfig: reportCategoriesConfig.sales,
        kpis: [{ id: 'rev', label: 'Net Revenue', value: 'TZS 10,600' }],
        tableColumns: [{ key: 'id', header: 'Sale ID' }],
        tableRows: [{ id: 'sale_1' }],
      }),
      mockBusiness
    );

    expect(canonical.metadata.businessName).toBe('AfyaBora Specialized Pharmacy');
    expect(canonical.metadata.businessTin).toBe('123-456-789');
    expect(canonical.metadata.businessAddress).toContain('Kinondoni');
  });

  it('should generate PDF document containing business branding and excluding 40Labs watermark', async () => {
    const canonical = convertCategoryDataToCanonical(
      'sales',
      'THIS MONTH',
      undefined,
      () => ({
        categoryConfig: reportCategoriesConfig.sales,
        kpis: [{ id: 'rev', label: 'Net Revenue', value: 'TZS 10,600' }],
        tableColumns: [{ key: 'id', header: 'Sale ID' }],
        tableRows: [{ id: 'sale_1' }],
      }),
      mockBusiness
    );

    const pdfBlob = createReportPdfBlob(canonical, DEFAULT_REPORT_LAYOUT, mockBusiness);
    expect(pdfBlob).toBeInstanceOf(Blob);
    expect(pdfBlob.type).toBe('application/pdf');

    const pdfText = await pdfBlob.text();
    expect(pdfText).toContain('AFYABORA SPECIALIZED PHARMACY');
    expect(pdfText).toContain('TIN: 123-456-789');
    expect(pdfText).not.toContain('40LABS POS & PHARMACY MANAGEMENT REPORT');
  });

  it('should calculate accurate sales revenue, tax, and discount totals for report tables', () => {
    const contextData = {
      sales: mockSales as any,
      inventory: [],
      customers: [],
      purchases: [],
      suppliers: [],
      fiscalReceipts: [],
      auditLogs: [],
      dateRange: { start: new Date('2026-01-01'), end: new Date('2026-12-31') },
    };

    const kpis = reportCategoriesConfig.sales.buildKpis(contextData);
    const table = reportCategoriesConfig.sales.buildTable(contextData);

    expect(kpis.find((k) => k.id === 'total_revenue')?.value).toBe('TZS 10,600');
    expect(table.rows[0].subtotal).toBe('TZS 10,000');
    expect(table.rows[0].discount).toBe('TZS 1,000');
    expect(table.rows[0].tax).toBe('TZS 1,600');
    expect(table.rows[0].grandTotal).toBe('TZS 10,600');
  });
});
