import * as React from 'react';
import { Card, Button, Checkbox, IconButton } from '@40labs/ui-components';
import { CustomerPicker } from '../../customers/components/CustomerPicker';
import { Customer } from '@40labs/types';
import { ChevronDown } from 'lucide-react';
import { pharmaciesApi } from '../../../api';

export interface ConfirmedSaleData {
  customerLabel: string;
  phone: string;
  email: string;
  service: string;
  cost: number;
  description: string;
}

export interface CustomerReportPanelProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (c: Customer | null) => void;
  manualEntry: { full_name: string; phone: string };
  onManualEntryChange: (data: { full_name: string; phone: string }) => void;
  confirmedSale: ConfirmedSaleData | null;
  onSend: () => void;
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
  onSend,
  saveCustomer,
  onSaveCustomerChange,
  onToggleCollapse,
}) => {
  const [sent, setSent] = React.useState(false);

  const handleSend = () => {
    setSent(true);
    setTimeout(() => {
      setSent(false);
      onSend();
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-4 bg-surface-strong border border-border/50 rounded-card p-4 elevation-inset h-full overflow-hidden">
      {/* Header Row with Collapse Toggle */}
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-sm font-bold text-text uppercase tracking-wider">
          Customer & Report
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

      {/* CustomerPicker component is always visible */}
      <div className="shrink-0 flex flex-col gap-2">
        <CustomerPicker
          value={selectedCustomer}
          manualEntry={manualEntry || { full_name: '', phone: '' }}
          onSelectCustomer={onSelectCustomer}
          onManualEntryChange={onManualEntryChange}
          customers={customers}
        />
        {!selectedCustomer && manualEntry && (manualEntry.full_name.trim().length > 0 || manualEntry.phone.trim().length > 0) && (
          <div className="pt-1 px-1">
            <Checkbox
              label="Save this customer"
              checked={saveCustomer}
              onChange={(e) => onSaveCustomerChange(e.target.checked)}
            />
          </div>
        )}
      </div>

      {/* Conditional contents */}
      <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
          {confirmedSale ? (
            <>
              <Card className="flex flex-col gap-1 p-4 !bg-panel/20 border-border/20 elevation-flat shadow-none shrink-0">
                <h3 className="text-sm font-bold text-text mb-2">
                  {pharmaciesApi.getBusiness().name}
                </h3>

                <div className="border-t border-border/20 pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <p className="text-text-muted opacity-60">Customer</p>
                      <p className="font-bold">{confirmedSale.customerLabel || 'Walk-in'}</p>
                    </div>
                    <div>
                      <p className="text-text-muted opacity-60">Phone</p>
                      <p className="font-mono">{confirmedSale.phone || 'N/A'}</p>
                    </div>
                  </div>

                  {confirmedSale.email && (
                    <div className="text-[11px]">
                      <p className="text-text-muted opacity-60">Email</p>
                      <p>{confirmedSale.email}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <p className="text-text-muted opacity-60">Service</p>
                      <p>{confirmedSale.service}</p>
                    </div>
                    <div>
                      <p className="text-text-muted opacity-60">Cost</p>
                      <p className="font-mono font-bold text-primary">
                        TZS {confirmedSale.cost.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px]">
                    <p className="text-text-muted opacity-60">Description</p>
                    <p className="line-clamp-2 italic">{confirmedSale.description}</p>
                  </div>
                </div>
              </Card>

              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  intent="neutral"
                  fullWidth
                  disabled={sent}
                  onClick={handleSend}
                  className="rounded-full !bg-text !text-surface border-none shadow-surface-pop"
                >
                  {sent ? 'Sending...' : 'Send Report To Customer'}
                </Button>
                {sent && (
                  <p className="text-center text-[10px] font-bold text-primary animate-pulse">
                    Report sent (mock) ✓
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-4 border border-dashed border-border/20 rounded-card text-xs text-text-muted italic">
              Report will appear here after the sale is confirmed
            </div>
          )}
        </div>
    </div>
  );
};
