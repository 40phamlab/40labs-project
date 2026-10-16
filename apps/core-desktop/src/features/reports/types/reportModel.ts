import type { Business } from '@40labs/types';
import { ReportCategoryId, reportCategoriesConfig, DateRange } from '../config/reportCategories';

export type ExportFormat = 'pdf' | 'docx' | 'xlsx' | 'csv';

export interface ReportMetadata {
  title: string;
  subtitle?: string;
  categoryLabel: string;
  periodLabel: string;
  dateRangeText?: string;
  generatedAt: string;

  // Business identity branding fields
  businessName: string;
  businessLogoUrl?: string | null;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessTin?: string | null;
  businessTmdaNumber?: string | null;
  authorOrOrganization: string;
}

export interface ReportMetric {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  change?: string;
}

export interface ReportTableColumn {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  format?: 'text' | 'number' | 'currency' | 'date';
}

export interface ReportTableSection {
  title?: string;
  columns: ReportTableColumn[];
  rows: Record<string, unknown>[];
  summaryRow?: Record<string, unknown>;
}

export interface ReportChartSection {
  title: string;
  type: 'line' | 'bar' | 'pie';
  data: { label: string; value: number; secondaryValue?: number }[];
}

export interface CanonicalReport {
  metadata: ReportMetadata;
  executiveSummary?: string;
  kpis: ReportMetric[];
  tables: ReportTableSection[];
  charts?: ReportChartSection[];
  notes?: string[];
  footnotes?: string[];
}

export function convertCategoryDataToCanonical(
  categoryId: ReportCategoryId,
  periodLabel: string,
  dateRange?: DateRange,
  getReportForCategory?: (id: ReportCategoryId) => {
    categoryConfig: typeof reportCategoriesConfig[ReportCategoryId];
    kpis: any[];
    chartConfig?: any;
    chartData?: any[];
    tableColumns: any[];
    tableRows: any[];
  },
  business?: Business | null
): CanonicalReport {
  const config = reportCategoriesConfig[categoryId] || reportCategoriesConfig['sales'];

  let rawKpis: any[] = [];
  let rawColumns: any[] = [];
  let rawRows: any[] = [];
  let rawChartConfig: any = undefined;
  let rawChartData: any[] = [];

  if (getReportForCategory) {
    const data = getReportForCategory(categoryId);
    if (data) {
      rawKpis = data.kpis || [];
      rawColumns = data.tableColumns || [];
      rawRows = data.tableRows || [];
      rawChartConfig = data.chartConfig;
      rawChartData = data.chartData || [];
    }
  }

  const generatedAt = new Date().toLocaleString();
  const dateRangeText = dateRange
    ? `${dateRange.start.toLocaleDateString()} – ${dateRange.end.toLocaleDateString()}`
    : undefined;

  const businessName = business?.name || 'AfyaBora Pharmacy & Health';
  const addressParts = [
    business?.address?.place,
    business?.address?.district,
    business?.address?.region,
  ].filter(Boolean);
  const businessAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Dar es Salaam, Tanzania';

  const metadata: ReportMetadata = {
    title: `${config.label} Executive Report`,
    subtitle: `Comprehensive performance and operational breakdown`,
    categoryLabel: config.label,
    periodLabel: periodLabel.replace('_', ' ').toUpperCase(),
    dateRangeText,
    generatedAt,
    businessName,
    businessLogoUrl: business?.logo_url || null,
    businessAddress,
    businessPhone: business?.contacts?.mobile || business?.contacts?.whatsapp || undefined,
    businessEmail: business?.contacts?.email || undefined,
    businessTin: business?.tin || null,
    businessTmdaNumber: business?.tmda_number || null,
    authorOrOrganization: businessName,
  };

  const kpis: ReportMetric[] = rawKpis.map((k) => ({
    label: k.label,
    value: k.value,
    subtext: k.subtext,
  }));

  const tables: ReportTableSection[] = [
    {
      title: `${config.label} Detailed Dataset`,
      columns: rawColumns.map((col) => ({
        key: col.key,
        header: col.header,
        align: col.align || 'left',
        format: 'text',
      })),
      rows: rawRows,
    },
  ];

  const charts: ReportChartSection[] = rawChartData.length > 0 && rawChartConfig ? [
    {
      title: rawChartConfig.title || `${config.label} Overview Chart`,
      type: 'bar',
      data: rawChartData.map((d: any) => ({
        label: d.label || d.name || String(d.x || ''),
        value: Number(d.revenue ?? d.value ?? d.amount ?? d.spend ?? d.valuation ?? d.count ?? 0),
      })),
    },
  ] : [];

  const executiveSummary = `This report summarizes key operational metrics, transaction logs, and statistical trends for ${config.label} during the reporting period of ${metadata.periodLabel}${dateRangeText ? ' (' + dateRangeText + ')' : ''}. All records are validated against ${businessName}'s persistent database.`;

  const notes = [
    `Confidential business report generated for ${businessName}.`,
    'Data points reflect validated records up to the exact generation timestamp.',
  ];

  return {
    metadata,
    executiveSummary,
    kpis,
    tables,
    charts,
    notes,
    footnotes: [`Generated for official use by ${businessName}`],
  };
}
