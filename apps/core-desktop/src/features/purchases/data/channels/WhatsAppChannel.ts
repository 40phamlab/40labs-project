// [PHASE: marketplace-preview — Data foundation]
import { OrderChannel, OrderChannelResult } from './OrderChannel';
import { Supplier, PurchaseOrder } from '@40labs/types';
import { normalizeToE164 } from './phone';

export class WhatsAppChannel implements OrderChannel {
  id = 'whatsapp';

  async send(order: PurchaseOrder, supplier: Supplier): Promise<OrderChannelResult> {
    const rawPhone = supplier.phones[0] || '';
    const e164 = normalizeToE164(rawPhone);
    if (!e164) {
      return { ok: false, reason: 'INVALID_SUPPLIER_PHONE' };
    }

    const shortCode = order.id.slice(0, 8);
    const linesText = order.lines
      .map((l) => `- ${l.name || l.productId} x${l.qty} (@ TZS ${l.unitPriceTzsSnapshot.toLocaleString()})`)
      .join('\n');

    const message = `*Oda Mpya / New Purchase Order* (#${shortCode})
Buyer: ${order.buyerBusinessId}
Supplier: ${supplier.name} (${supplier.businessId})

Items:
${linesText}

*Total: TZS ${order.totalTzs.toLocaleString()}*`;

    const encodedText = encodeURIComponent(message);
    const url = `https://wa.me/${e164.replace('+', '')}?text=${encodedText}`;

    try {
      if (typeof window !== 'undefined' && window.open) {
        window.open(url, '_blank');
      }
      return {
        ok: true,
        sentAt: new Date().toISOString(),
        deliveryConfirmed: false,
      };
    } catch (err: any) {
      return { ok: false, reason: err?.message || 'OPEN_FAILED' };
    }
  }
}
