import type { LabResult, LabOrder, Customer, TestCatalogEntry, LabSample } from '@40labs/types';

export function generateResultsCsv(
  results: LabResult[],
  orders: LabOrder[],
  customers: Customer[],
  testCatalog: TestCatalogEntry[],
  samples: LabSample[]
): string {
  const headers = [
    'Result ID',
    'Order ID',
    'Test Name',
    'Category',
    'Patient Name',
    'Patient Phone',
    'Sample ID',
    'Sample Label',
    'Result Value',
    'Reference Range',
    'Flag',
    'Entered By',
    'Entered At',
  ];

  const rows = results.map((res) => {
    const order = orders.find((o) => o.id === res.lab_order_id);
    const customer = order ? customers.find((c) => c.id === order.customer_id) : undefined;
    const test = order ? testCatalog.find((t) => t.id === order.test_catalog_id) : undefined;
    const sample = samples.find((s) => s.lab_order_id === res.lab_order_id);

    const escapeCsv = (val: string | number | undefined | null) => {
      if (val === undefined || val === null) return '""';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    return [
      escapeCsv(res.id),
      escapeCsv(res.lab_order_id),
      escapeCsv(test?.name),
      escapeCsv(test?.category),
      escapeCsv(customer?.full_name),
      escapeCsv(customer?.phone),
      escapeCsv(sample?.id),
      escapeCsv(sample?.sample_label),
      escapeCsv(res.value),
      escapeCsv(res.reference_range || test?.reference_range),
      escapeCsv(res.is_out_of_range ? 'OUT_OF_RANGE' : 'NORMAL'),
      escapeCsv(res.entered_by_user_id),
      escapeCsv(res.created_at),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function downloadResultsCsv(
  results: LabResult[],
  orders: LabOrder[],
  customers: Customer[],
  testCatalog: TestCatalogEntry[],
  samples: LabSample[],
  filename = 'Lab_Results_Export.csv'
): void {
  const csv = generateResultsCsv(results, orders, customers, testCatalog, samples);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
