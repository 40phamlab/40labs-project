import type { LabResult, LabOrder, Customer, TestCatalogEntry, LabSample } from '@40labs/types';
import { isUsingTauriIpc, invokeCommand } from '../../../api/client';

export interface LabResultsJsonExport {
  schema_version: number;
  exported_at: string;
  variant: 'full' | 'deidentified';
  count: number;
  results: any[];
}

export async function generateResultsJson(
  results: LabResult[],
  orders: LabOrder[],
  customers: Customer[],
  testCatalog: TestCatalogEntry[],
  samples: LabSample[],
  variant: 'full' | 'deidentified'
): Promise<string> {
  const payloadResults = results.map((res) => {
    const order = orders.find((o) => o.id === res.lab_order_id);
    const customer = order ? customers.find((c) => c.id === order.customer_id) : undefined;
    const test = order ? testCatalog.find((t) => t.id === order.test_catalog_id) : undefined;
    const sample = samples.find((s) => s.lab_order_id === res.lab_order_id);

    if (variant === 'deidentified') {
      return {
        result_id: res.id,
        test_name: test?.name || 'Unknown Test',
        category: test?.category || 'General',
        value: res.value,
        reference_range: res.reference_range || test?.reference_range || null,
        is_out_of_range: res.is_out_of_range,
        gender: (customer as any)?.gender || 'unknown',
        age_band: (customer as any)?.age_band || 'adult',
        sample_type: sample?.sample_label || 'blood/serum',
        entered_at: res.created_at,
      };
    }

    return {
      result_id: res.id,
      order_id: res.lab_order_id,
      patient: customer ? {
        id: customer.id,
        full_name: customer.full_name,
        phone: customer.phone,
        email: customer.email,
      } : null,
      sample: sample ? {
        id: sample.id,
        label: sample.sample_label,
        status: sample.status,
        collected_at: sample.collected_at,
        expires_at: sample.expires_at,
      } : null,
      test: test ? {
        id: test.id,
        name: test.name,
        category: test.category,
        reference_range: test.reference_range,
      } : null,
      value: res.value,
      reference_range: res.reference_range,
      is_out_of_range: res.is_out_of_range,
      entered_by_user_id: res.entered_by_user_id,
      created_at: res.created_at,
    };
  });

  const exportPayload: LabResultsJsonExport = {
    schema_version: 1,
    exported_at: new Date().toISOString(),
    variant,
    count: payloadResults.length,
    results: payloadResults,
  };

  if (variant === 'deidentified') {
    try {
      if (isUsingTauriIpc()) {
        await invokeCommand('create_audit_log', {
          action: 'lab_results_deidentified_export',
          targetEntityType: 'LabResult',
          targetEntityId: 'bulk_export',
          metadata: JSON.stringify({ count: results.length }),
        });
      }
    } catch (err) {
      console.warn('Failed to record de-identified export audit log:', err);
    }
  }

  return JSON.stringify(exportPayload, null, 2);
}

export async function downloadResultsJson(
  results: LabResult[],
  orders: LabOrder[],
  customers: Customer[],
  testCatalog: TestCatalogEntry[],
  samples: LabSample[],
  variant: 'full' | 'deidentified',
  filename?: string
): Promise<void> {
  const jsonStr = await generateResultsJson(results, orders, customers, testCatalog, samples, variant);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `Lab_Results_${variant}_export.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
