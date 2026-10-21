import * as React from 'react';
import { customersApi } from '../../../api/customersApi';
import { auditApi } from '../../../api/auditApi';

export function useBulkArchive(onSuccess?: () => void) {
  const [isArchiving, setIsArchiving] = React.useState(false);

  const archiveCustomers = async (ids: string[]) => {
    if (ids.length === 0) return { archived: 0, failed: 0 };

    try {
      setIsArchiving(true);

      // Audit entry written before mutation (GOTCHAS #9)
      await auditApi.recordEntry({
        action: 'customer_archive',
        performed_by_user_id: null,
        target_entity_type: 'Customer',
        target_entity_id: 'batch_archive',
        metadata: { count: ids.length, ids },
      });

      let archived = 0;
      let failed = 0;
      const batchSize = 200;

      for (let i = 0; i < ids.length; i += batchSize) {
        const chunk = ids.slice(i, i + batchSize);
        for (const id of chunk) {
          try {
            const res = await customersApi.update(id, { archivedAt: new Date().toISOString() });
            if (res) {
              archived++;
            } else {
              failed++;
            }
          } catch {
            failed++;
          }
        }
      }

      onSuccess?.();
      return { archived, failed };
    } finally {
      setIsArchiving(false);
    }
  };

  return {
    archiveCustomers,
    isArchiving,
  };
}
