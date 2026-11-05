import * as React from 'react';
import { Modal, Button } from '@40labs/ui-components';
import { Download } from 'lucide-react';
import { ReceiptPreview, ReceiptItem } from './ReceiptPreview';
import { getBusinessIdentity, BusinessIdentity } from '../documents/shared/documentHeader';
import { useToast } from '../../../hooks/useToast';
import { saveReceiptPdf } from '../utils/generateReceiptPdf';

export interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleData: {
    saleId: string;
    date: string;
    customerLabel: string;
    items: ReceiptItem[];
    subtotal: number;
    tax: number;
    total: number;
    servedBy?: string;
  } | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  saleData,
}) => {
  const { toast } = useToast();
  const [biz, setBiz] = React.useState<BusinessIdentity | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      getBusinessIdentity().then(setBiz).catch(() => {});
    }
  }, [isOpen]);

  if (!saleData) return null;

  const handleSaveAndPrint = () => {
    try {
      saveReceiptPdf({
        sale: {
          id: saleData.saleId,
          workspace_id: 'ws_1',
          branch_id: 'br_1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          customer_id: null,
          lines: saleData.items.map((item, idx) => ({
            id: `l_${idx}`,
            inventory_item_id: `inv_${idx}`,
            medicine_id: `med_${idx}`,
            medicine_name: item.name,
            quantity: item.qty,
            unit_price: item.price,
            subtotal: item.total,
            dispensed_by_user_id: 'u_1',
            is_prescription_dispense: false,
          })),
          payment_method: 'cash',
          discount_amount: 0,
          discount_authorized_by_user_id: null,
          tax_amount: saleData.tax,
          grand_total: saleData.total,
          currency: 'TZS',
          synced_at: null,
        },
        customerLabel: saleData.customerLabel,
        phone: '',
        servedBy: saleData.servedBy || 'Pharmacist',
        fiscalReceipt: null,
      });

      const sanitizedId = saleData.saleId.replace(/[^a-zA-Z0-9_-]/g, '_');
      toast.success(`Receipt saved as PDF (Receipt_${sanitizedId}.pdf)`);
    } catch (e) {
      toast.error('Failed to generate receipt PDF');
    }

    try {
      if (typeof window !== 'undefined' && typeof window.print === 'function') {
        window.print();
      }
    } catch (printErr) {
      console.warn('Direct print execution failed or unhandled in current context:', printErr);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Receipt Options & PDF Export"
      description={`Receipt #${saleData.saleId} • ${saleData.customerLabel}`}
      size="sm"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button type="button" intent="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            intent="primary"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={handleSaveAndPrint}
          >
            Save PDF & Print
          </Button>
        </div>
      }
    >
      <div className="flex justify-center p-2 bg-panel rounded-card border border-border/20">
        <ReceiptPreview
          businessName={biz?.name}
          businessAddress={biz?.addressLine}
          businessPhone={biz?.phone}
          businessEmail={biz?.email}
          businessTin={biz?.tin}
          businessTmdaNumber={biz?.tmdaNumber}
          businessLogoUrl={biz?.logoUrl}
          orderId={saleData.saleId}
          date={saleData.date}
          items={saleData.items}
          subtotal={saleData.subtotal}
          tax={saleData.tax}
          total={saleData.total}
          servedBy={saleData.servedBy}
        />
      </div>
    </Modal>
  );
};
