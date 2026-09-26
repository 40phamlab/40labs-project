import * as React from 'react';
import { Modal, Button } from '@40labs/ui-components';
import { Download, Printer } from 'lucide-react';
import { ReceiptPreview, ReceiptItem } from './ReceiptPreview';
import { pharmaciesApi } from '../../../api';
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
  } | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  saleData,
}) => {
  const { toast } = useToast();
  if (!saleData) return null;

  const biz = pharmaciesApi.getBusiness();

  const handleSaveAndPrint = () => {
    try {
      saveReceiptPdf({
        businessName: biz.name,
        businessAddress: biz.address,
        businessPhone: biz.phone,
        orderId: saleData.saleId,
        date: saleData.date,
        customerLabel: saleData.customerLabel,
        items: saleData.items,
        subtotal: saleData.subtotal,
        tax: saleData.tax,
        total: saleData.total,
      });

      const sanitizedId = saleData.saleId.replace(/[^a-zA-Z0-9_-]/g, '_');
      toast.success(`Receipt saved as PDF (Receipt_${sanitizedId}.pdf)`);
    } catch (e) {
      toast.error('Failed to generate receipt PDF');
    }

    // Safely attempt direct window.print without throwing unhandled UI errors
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
          businessName={biz.name}
          businessAddress={biz.address}
          businessPhone={biz.phone}
          orderId={saleData.saleId}
          date={saleData.date}
          items={saleData.items}
          subtotal={saleData.subtotal}
          tax={saleData.tax}
          total={saleData.total}
        />
      </div>
    </Modal>
  );
};
