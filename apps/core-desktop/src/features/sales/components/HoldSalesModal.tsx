import * as React from 'react';
import { Modal, Button, MoneyDisplay, IconButton } from '@40labs/ui-components';
import { Play, Trash2, PauseCircle } from 'lucide-react';
import { HeldSale } from '../../../hooks/useSales';

export interface HoldSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  heldSales: HeldSale[];
  onResume: (id: string) => void;
  onDelete: (id: string) => void;
}

export const HoldSalesModal: React.FC<HoldSalesModalProps> = ({
  isOpen,
  onClose,
  heldSales,
  onResume,
  onDelete,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Held Transactions (Parked Bills)"
      description="View and resume saved customer bills currently on hold."
      size="md"
      footer={
        <Button type="button" intent="neutral" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      {heldSales.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border/30 rounded-card bg-panel/30">
          <div className="p-3 rounded-full bg-panel text-text-muted mb-2">
            <PauseCircle size={24} />
          </div>
          <p className="text-xs font-semibold text-text mb-1">No Held Bills</p>
          <p className="text-[11px] text-text-muted">
            Click "Hold Bill" in the sale totals bar during an active sale to temporarily park it.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {heldSales.map((h) => {
            const customerName = h.customer?.full_name || h.manualEntry?.full_name || 'Walk-in Customer';
            const itemCount = h.cart.reduce((sum, item) => sum + item.quantity, 0);

            return (
              <div
                key={h.id}
                className="flex items-center justify-between p-3 rounded-card bg-panel border border-border/30 elevation-flat"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text truncate">{customerName}</span>
                    <span className="text-[10px] font-mono text-text-muted bg-panel-strong px-1.5 py-0.5 rounded">
                      {h.heldAt}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {itemCount} item{itemCount > 1 ? 's' : ''} • {h.paymentMethod.replace('_', ' ')}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <MoneyDisplay amount={h.total} emphasis="strong" className="text-xs text-primary font-mono" />

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      intent="primary"
                      size="sm"
                      leftIcon={<Play size={12} />}
                      onClick={() => {
                        onResume(h.id);
                        onClose();
                      }}
                    >
                      Resume
                    </Button>
                    <IconButton
                      type="button"
                      intent="ghost"
                      size="sm"
                      icon={<Trash2 size={14} />}
                      label="Delete held sale"
                      onClick={() => onDelete(h.id)}
                      className="text-text-muted hover:text-danger"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
};
