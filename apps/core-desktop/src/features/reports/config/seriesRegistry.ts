export type SeriesKind = 'bar' | 'line' | 'area';

export interface ReportSeries {
  readonly key: string;
  readonly labelKey: string; // i18n key, title only
  readonly kind: SeriesKind;
  readonly axis: 'left' | 'right';
  readonly format: 'tzs' | 'count';
  readonly colorToken: string; // existing token name, never a hex literal
  readonly dashed?: boolean;
  readonly defaultVisible: boolean;
}

export type ReportTabId =
  | 'sales'
  | 'inventory'
  | 'customers'
  | 'purchases'
  | 'compliance';

export const SERIES_BY_TAB: Readonly<Record<ReportTabId, readonly ReportSeries[]>> = {
  sales: [
    {
      key: 'revenue',
      labelKey: 'reports.series.revenue',
      kind: 'bar',
      axis: 'left',
      format: 'tzs',
      colorToken: 'primary', // #16A34A
      defaultVisible: true,
    },
    {
      key: 'transactions',
      labelKey: 'reports.series.transactions',
      kind: 'line',
      axis: 'right',
      format: 'count',
      colorToken: 'accent', // #F97316
      defaultVisible: true,
    },
    {
      key: 'avgOrderValue',
      labelKey: 'reports.series.avgOrderValue',
      kind: 'line',
      axis: 'left',
      format: 'tzs',
      colorToken: 'info', // blue
      dashed: true,
      defaultVisible: true,
    },
    {
      key: 'discounts',
      labelKey: 'reports.series.discounts',
      kind: 'bar',
      axis: 'left',
      format: 'tzs',
      colorToken: 'danger', // #EF4444
      defaultVisible: true,
    },
  ],
  inventory: [
    {
      key: 'stockValue',
      labelKey: 'reports.series.stockValue',
      kind: 'area',
      axis: 'left',
      format: 'tzs',
      colorToken: 'primary',
      defaultVisible: true,
    },
    {
      key: 'unitsSold',
      labelKey: 'reports.series.unitsSold',
      kind: 'bar',
      axis: 'right',
      format: 'count',
      colorToken: 'accent',
      defaultVisible: true,
    },
    {
      key: 'expiringSoon',
      labelKey: 'reports.series.expiringSoon',
      kind: 'bar',
      axis: 'right',
      format: 'count',
      colorToken: 'danger',
      defaultVisible: true,
    },
    {
      key: 'stockOuts',
      labelKey: 'reports.series.stockOuts',
      kind: 'bar',
      axis: 'right',
      format: 'count',
      colorToken: 'warning',
      defaultVisible: true,
    },
  ],
  customers: [
    {
      key: 'newCustomers',
      labelKey: 'reports.series.newCustomers',
      kind: 'bar',
      axis: 'right',
      format: 'count',
      colorToken: 'primary',
      defaultVisible: true,
    },
    {
      key: 'returningCustomers',
      labelKey: 'reports.series.returningCustomers',
      kind: 'bar',
      axis: 'right',
      format: 'count',
      colorToken: 'accent',
      defaultVisible: true,
    },
    {
      key: 'visits',
      labelKey: 'reports.series.visits',
      kind: 'line',
      axis: 'right',
      format: 'count',
      colorToken: 'info',
      defaultVisible: true,
    },
  ],
  purchases: [
    {
      key: 'purchaseSpend',
      labelKey: 'reports.series.purchaseSpend',
      kind: 'bar',
      axis: 'left',
      format: 'tzs',
      colorToken: 'accent',
      defaultVisible: true,
    },
    {
      key: 'orders',
      labelKey: 'reports.series.orders',
      kind: 'line',
      axis: 'right',
      format: 'count',
      colorToken: 'primary',
      defaultVisible: true,
    },
    {
      key: 'pending',
      labelKey: 'reports.series.pending',
      kind: 'bar',
      axis: 'right',
      format: 'count',
      colorToken: 'warning',
      defaultVisible: true,
    },
  ],
  compliance: [
    {
      key: 'fiscalReceipts',
      labelKey: 'reports.series.fiscalReceipts',
      kind: 'bar',
      axis: 'right',
      format: 'count',
      colorToken: 'primary',
      defaultVisible: true,
    },
    {
      key: 'auditEvents',
      labelKey: 'reports.series.auditEvents',
      kind: 'line',
      axis: 'right',
      format: 'count',
      colorToken: 'info',
      defaultVisible: true,
    },
    {
      key: 'pinOverrides',
      labelKey: 'reports.series.pinOverrides',
      kind: 'bar',
      axis: 'right',
      format: 'count',
      colorToken: 'danger',
      defaultVisible: true,
    },
  ],
};
