import * as React from 'react';
import { CustomerPicker, Card, Button } from '@40labs/ui-components';
import { Customer } from '@40labs/types';

export interface CustomerReportPanelProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (c: Customer | null) => void;
  walkInInfo: { full_name: string; phone: string } | null;
  onWalkInInfo: (data: { full_name: string; phone: string }) => void;
  dispensedByName: string;
  cartSummary: { itemNames: string[]; grandTotal: number };
  canSend: boolean;
}

export const CustomerReportPanel: React.FC<CustomerReportPanelProps> = ({
  customers,
  selectedCustomer,
  onSelectCustomer,
  walkInInfo,
  onWalkInInfo,
  dispensedByName,
  cartSummary,
  canSend,
}) => {
  const [sent, setSent] = React.useState(false);

  const handleSend = () => {
    // TODO: wire real WhatsApp send + global toast once services/api-core exists.
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  const showReportCard = !!selectedCustomer || !!walkInInfo;

  const displayName = selectedCustomer?.full_name || walkInInfo?.full_name || 'Walk-in Customer';
  const displayPhone = selectedCustomer?.phone || walkInInfo?.phone || 'N/A';
  const displayEmail = selectedCustomer?.email || '';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider opacity-50 px-1">
          Customer Identification
        </h2>
        <CustomerPicker
          value={selectedCustomer}
          onChange={onSelectCustomer}
          customers={customers}
          allowWalkIn
          allowCreate
          onCreateCustomer={onWalkInInfo}
          onWalkIn={() => onWalkInInfo({ full_name: 'Walk-in', phone: '' })}
        />
      </div>

      {showReportCard && (
        <Card className="flex flex-col gap-4 p-4 elevation-raised">
          <div className="flex flex-col gap-1">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
              Report Preview
            </h3>
            <div className="border-t border-border/30 mt-1 pt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <p className="text-text-muted opacity-60">Customer</p>
                  <p className="font-bold">{displayName}</p>
                </div>
                <div>
                  <p className="text-text-muted opacity-60">Phone</p>
                  <p className="font-mono">{displayPhone}</p>
                </div>
              </div>

              {displayEmail && (
                <div className="text-[11px]">
                  <p className="text-text-muted opacity-60">Email</p>
                  <p>{displayEmail}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <p className="text-text-muted opacity-60">Service</p>
                  <p>{dispensedByName}</p>
                </div>
                <div>
                  <p className="text-text-muted opacity-60">Cost</p>
                  <p className="font-mono font-bold text-primary">
                    TZS {cartSummary.grandTotal.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="text-[11px]">
                <p className="text-text-muted opacity-60">Description</p>
                <p className="line-clamp-2">
                  {cartSummary.itemNames.length > 0
                    ? cartSummary.itemNames.join(', ')
                    : 'No items yet'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <Button
              intent="primary"
              fullWidth
              disabled={!canSend || sent}
              onClick={handleSend}
            >
              {sent ? 'Sending...' : 'Send Report To Customer'}
            </Button>
            {sent && (
              <p className="text-center text-[10px] font-bold text-primary animate-pulse">
                Report sent (mock) ✓
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
