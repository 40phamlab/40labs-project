import * as React from 'react';
import { Card, Button, Checkbox, IconButton, MoneyDisplay } from '@40labs/ui-components';
import { CustomerPicker } from '../../customers/components/CustomerPicker';
import { Customer } from '@40labs/types';
import { ChevronDown, Printer, Send, CheckCircle2 } from 'lucide-react';
import { pharmaciesApi } from '../../../api';
import { useToast } from '../../../hooks/useToast';

export interface ConfirmedSaleData {
  saleId: string;
  customerLabel: string;
  phone: string;
  email: string;
  service: string;
  cost: number;
  description: string;
  date: string;
}

export interface CustomerReportPanelProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (c: Customer | null) => void;
  manualEntry: { full_name: string; phone: string };
  onManualEntryChange: (data: { full_name: string; phone: string }) => void;
  confirmedSale: ConfirmedSaleData | null;
  onSendReport: () => void;
  onPrintReceipt?: () => void;
  saveCustomer: boolean;
  onSaveCustomerChange: (v: boolean) => void;
  onToggleCollapse?: () => void;
}

export const CustomerReportPanel: React.FC<CustomerReportPanelProps> = ({
  customers,
  selectedCustomer,
  onSelectCustomer,
  manualEntry,
  onManualEntryChange,
  confirmedSale,
  onSendReport,
  onPrintReceipt,
  saveCustomer,
  onSaveCustomerChange,
  onToggleCollapse,
}) => {
  const { toast } = useToast();
  const [sending, setSending] = React.useState(false);

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success(`Report sent to ${confirmedSale?.customerLabel || 'customer'}`);
      onSendReport();
    }, 800);
  };

  return (
    <div className="flex flex-col gap-3 bg-surface-strong border border-border/50 rounded-card p-4 elevation-inset h-full overflow-hidden w-[300px] shrink-0">
      {/* Header Row with Collapse Toggle */}
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-xs font-bold text-text uppercase tracking-wider">
          Customer & Receipt
        </h2>
        {onToggleCollapse && (
          <IconButton
            icon={<ChevronDown size={16} />}
            label="Hide panel"
            intent="ghost"
            size="sm"
            onClick={onToggleCollapse}
          />
        )}
      </div>

      {/* Customer Selection */}
      <div className="shrink-0 flex flex-col gap-2">
        <CustomerPicker
          value={selectedCustomer}
          manualEntry={manualEntry || { full_name: '', phone: '' }}
          onSelectCustomer={onSelectCustomer}
          onManualEntryChange={onManualEntryChange}
          customers={customers}
        />
        {!selectedCustomer && manualEntry && (manualEntry.full_name.trim().length > 0 || manualEntry.phone.trim().length > 0) && (
          <div className="pt-0.5 px-1">
            <Checkbox
              label="Save new customer upon checkout"
              checked={saveCustomer}
              onChange={(e) => onSaveCustomerChange(e.target.checked)}
            />
          </div>
        )}
      </div>

      {/* Post-Checkout Summary Card / Receipt Preview */}
      <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
        {confirmedSale ? (
          <>
            <Card className="flex flex-col gap-2 p-3 bg-panel/40 border-border/30 elevation-flat shrink-0">
              <div className="flex items-center gap-1.5 text-primary text-xs font-bold">
                <CheckCircle2 size={16} />
                <span>Transaction Confirmed</span>
              </div>

              <h3 className="text-xs font-bold text-text border-b border-border/20 pb-2">
                {pharmaciesApi.getBusiness().name}
              </h3>

              <div className="space-y-2 text-[11px]">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-text-muted text-[9px] uppercase font-bold">Customer</p>
                    <p className="font-bold text-text truncate">{confirmedSale.customerLabel || 'Walk-in'}</p>
                  </div>
                  <div>
                    <p className="text-text-muted text-[9px] uppercase font-bold">Phone</p>
                    <p className="font-mono text-text truncate">{confirmedSale.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-text-muted text-[9px] uppercase font-bold">Dispensed By</p>
                    <p className="text-text truncate">{confirmedSale.service}</p>
                  </div>
                  <div>
                    <p className="text-text-muted text-[9px] uppercase font-bold">Total Paid</p>
                    <MoneyDisplay amount={confirmedSale.cost} emphasis="strong" className="text-primary text-xs font-bold" />
                  </div>
                </div>

                <div>
                  <p className="text-text-muted text-[9px] uppercase font-bold">Items</p>
                  <p className="line-clamp-2 italic text-text-muted text-[10px]">{confirmedSale.description}</p>
                </div>
              </div>
            </Card>

            <div className="flex flex-col gap-2 shrink-0">
              {onPrintReceipt && (
                <Button
                  type="button"
                  intent="primary"
                  fullWidth
                  leftIcon={<Printer size={14} />}
                  onClick={onPrintReceipt}
                >
                  Print Receipt
                </Button>
              )}

              <Button
                type="button"
                intent="neutral"
                fullWidth
                loading={sending}
                leftIcon={<Send size={14} />}
                onClick={handleSend}
              >
                Send Customer Report
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border/30 rounded-card text-xs text-text-muted italic bg-panel/10">
            Confirmed transaction details & receipt options will appear here.
          </div>
        )}
      </div>
    </div>
  );
};
