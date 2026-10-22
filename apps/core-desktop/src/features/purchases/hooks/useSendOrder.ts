// [PHASE: marketplace-preview — Order flow]
import * as React from 'react';
import { Supplier, SupplierCart, PurchaseOrder } from '@40labs/types';
import { useStepUp } from '../../../features/auth/stepup/StepUpProvider';
import { templateOrderRepo, templateCartRepo } from '../data/templateRepos';
import { channelRegistry } from '../data/channels/registry';
import { auditApi } from '../../../api/auditApi';

export interface UseSendOrderReturn {
  isSending: boolean;
  sendOrder: (supplier: Supplier, cart: SupplierCart, note?: string) => Promise<PurchaseOrder | null>;
}

export function useSendOrder(onSuccess?: (order: PurchaseOrder) => void): UseSendOrderReturn {
  const [isSending, setIsSending] = React.useState(false);
  const { requestStepUp } = useStepUp();

  const sendOrder = async (supplier: Supplier, cart: SupplierCart, note?: string): Promise<PurchaseOrder | null> => {
    if (cart.lines.length === 0) return null;
    setIsSending(true);

    try {
      const actionToExecute = async () => {
        const draft = await templateOrderRepo.createDraft(supplier.businessId, cart, 'whatsapp');

        // Outbox write
        const outboxRow = {
          id: `outbox_${draft.id}`,
          orderId: draft.id,
          payload: JSON.stringify({ draft, note }),
          status: 'pending',
          createdAt: new Date().toISOString(),
        };

        const channel = channelRegistry.get('whatsapp');
        const res = await channel.send(draft, supplier);

        let finalOrder = draft;
        if (res.ok) {
          finalOrder = await templateOrderRepo.markStatus(draft.id, 'sent');
        }

        await templateCartRepo.clear(supplier.businessId);

        auditApi.recordEntry({
          action: 'CREATE_PURCHASE_ORDER',
          target_id: finalOrder.id,
          details: `Sent purchase order #${finalOrder.id.slice(0, 8)} to supplier ${supplier.name} via WhatsApp. Note: ${note || 'none'}`,
          actor_user_id: 'user_001',
        });

        if (onSuccess) onSuccess(finalOrder);
        return finalOrder;
      };

      const result = await requestStepUp(
        async () => await actionToExecute(),
        'purchases.approve'
      );

      return result;
    } catch (err) {
      console.error('Failed to send order:', err);
      return null;
    } finally {
      setIsSending(false);
    }
  };

  return { isSending, sendOrder };
}
