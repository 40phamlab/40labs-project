// [PHASE: marketplace-preview — Order flow]
import * as React from 'react';
import { PurchaseOrderStatus, PurchaseOrder } from '@40labs/types';
import { templateOrderRepo } from '../data/templateRepos';
import { useStepUp } from '../../../features/auth/stepup/StepUpProvider';
import { auditApi } from '../../../api/auditApi';

export function useMarkOrderStatus() {
  const { requestStepUp } = useStepUp();

  const updateStatus = async (orderId: string, newStatus: PurchaseOrderStatus): Promise<PurchaseOrder | null> => {
    try {
      const executeUpdate = async () => {
        const updated = await templateOrderRepo.markStatus(orderId, newStatus);

        auditApi.recordEntry({
          action: 'UPDATE_PURCHASE_ORDER_STATUS',
          target_id: orderId,
          details: `Marked purchase order #${orderId.slice(0, 8)} as ${newStatus}`,
          actor_user_id: 'user_001',
        });

        return updated;
      };

      if (newStatus === 'cancelled') {
        return await requestStepUp(executeUpdate, 'purchases.approve');
      }

      return await executeUpdate();
    } catch (err) {
      console.error('Failed to update order status:', err);
      return null;
    }
  };

  return { updateStatus };
}
