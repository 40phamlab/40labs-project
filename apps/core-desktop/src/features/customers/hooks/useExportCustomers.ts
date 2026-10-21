import * as React from 'react';
import type { Customer } from '@40labs/types';
import { auditApi } from '../../../api/auditApi';

export function useExportCustomers() {
  const [isExporting, setIsExporting] = React.useState(false);

  const exportCustomers = async (customersToExport: Customer[]) => {
    if (customersToExport.length === 0) return;

    try {
      setIsExporting(true);

      // Audit entry for export (PII leaving app)
      await auditApi.recordEntry({
        action: 'customer_export',
        performed_by_user_id: null,
        target_entity_type: 'Customer',
        target_entity_id: 'batch_export',
        metadata: { count: customersToExport.length },
      });

      // Build CSV content
      const headers = ['ID', 'Full Name', 'Phone', 'Email', 'Gender', 'DOB', 'Balance (TZS)', 'Created At'];
      const rows = customersToExport.map((c) => [
        c.id,
        `"${(c.full_name || '').replace(/"/g, '""')}"`,
        `"${c.phone}"`,
        `"${c.email || ''}"`,
        `"${c.gender || c.sex || ''}"`,
        `"${c.dob || ''}"`,
        c.outstanding_balance,
        `"${c.created_at}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `customers_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export customers:', err);
      throw err;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportCustomers,
    isExporting,
  };
}
