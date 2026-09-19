import * as React from 'react';
import { CustomerPicker, Card, Button, Input } from '@40labs/ui-components';
import { Customer } from '@40labs/types';
import { X } from 'lucide-react';
import { mockBusiness } from '../../lib/mockData';

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

  const showReportCard = !!selectedCustomer || (walkInInfo && (walkInInfo.full_name || walkInInfo.phone));

  const displayName = selectedCustomer?.full_name || walkInInfo?.full_name || '';
  const displayPhone = selectedCustomer?.phone || walkInInfo?.phone || '';
  const displayEmail = selectedCustomer?.email || '';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {selectedCustomer || (walkInInfo && (walkInInfo.full_name || walkInInfo.phone)) ? (
          <div className="flex flex-col gap-2 relative group">
            <Input
              value={displayName}
              placeholder="Customer's name"
              className="rounded-full !bg-panel/40 border-border/30"
              readOnly={!!selectedCustomer}
              onChange={(e) => onWalkInInfo({ full_name: e.target.value, phone: displayPhone })}
            />
            <Input
              value={displayPhone}
              placeholder="Customer's phone/email"
              className="rounded-full !bg-panel/40 border-border/30"
              readOnly={!!selectedCustomer}
              onChange={(e) => onWalkInInfo({ full_name: displayName, phone: e.target.value })}
            />
            <button
              type="button"
              onClick={() => {
                onSelectCustomer(null);
                onWalkInInfo({ full_name: '', phone: '' });
              }}
              className="absolute -right-2 -top-2 p-1 bg-panel-strong text-text-muted hover:text-text rounded-full border border-border shadow-sm elevation-raised z-10"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <CustomerPicker
            value={selectedCustomer}
            onChange={onSelectCustomer}
            customers={customers}
            allowWalkIn
            allowCreate
            onCreateCustomer={onWalkInInfo}
            onWalkIn={() => onWalkInInfo({ full_name: 'Walk-in', phone: '' })}
          />
        )}
      </div>

      {showReportCard && (
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-1 p-4 !bg-panel/20 border-border/20 elevation-flat shadow-none">
            <h3 className="text-sm font-bold text-text mb-2">
              {mockBusiness.name}
            </h3>

            <div className="border-t border-border/20 pt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <p className="text-text-muted opacity-60">Customer</p>
                  <p className="font-bold">{displayName || 'Walk-in'}</p>
                </div>
                <div>
                  <p className="text-text-muted opacity-60">Phone</p>
                  <p className="font-mono">{displayPhone || 'N/A'}</p>
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
                <p className="line-clamp-2 italic">
                  {cartSummary.itemNames.length > 0
                    ? cartSummary.itemNames.join(', ')
                    : 'No items yet'}
                </p>
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-2">
            <Button
              intent="neutral"
              fullWidth
              disabled={!canSend || sent}
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
        </div>
      )}
    </div>
  );
};
