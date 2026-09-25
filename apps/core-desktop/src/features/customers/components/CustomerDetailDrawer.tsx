import * as React from 'react';
import {
  Drawer,
  EntityProfileHeader,
  KeyValue,
  MoneyDisplay,
  Separator,
} from '@40labs/ui-components';
import { Customer } from '@40labs/types';

interface CustomerDetailDrawerProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerDetailDrawer: React.FC<CustomerDetailDrawerProps> = ({
  customer,
  isOpen,
  onClose,
}) => {
  if (!customer) return null;

  const entity = {
    id: customer.id,
    name: customer.full_name,
    email: customer.email || undefined,
    phone: customer.phone,
    statusIndicator: (customer.outstanding_balance > 0 ? 'warn' : 'active') as
      | 'warn'
      | 'active',
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Customer Profile"
      size="lg"
    >
      <div className="flex flex-col gap-8">
        <EntityProfileHeader
          entity={entity}
          actions={[
            {
              id: 'edit',
              label: 'Edit Profile',
              onClick: () => {
                // TODO: Implementation of edit flow
              },
            },
          ]}
        />

        <div className="grid grid-cols-2 gap-6 bg-panel/30 p-6 rounded-card border border-border/50">
          <KeyValue
            label="Outstanding Balance"
            value={
              <MoneyDisplay
                amount={customer.outstanding_balance}
                colorize={customer.outstanding_balance > 0}
                emphasis="strong"
                className="text-sm"
              />
            }
          />
          <KeyValue
            label="Member Since"
            value={new Date(customer.created_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted px-1">
            Internal Notes
          </label>
          <div className="p-4 bg-panel-strong/20 rounded-card border border-border/30 text-xs leading-relaxed text-text italic">
            {customer.notes || 'No internal notes for this customer.'}
          </div>
        </div>

        <Separator className="opacity-50" />

        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted px-1">
            History & Records
          </h3>
          <div className="flex flex-col items-center justify-center p-12 bg-panel-strong/10 rounded-card border border-border/30 border-dashed text-center">
            <p className="text-xs text-text-muted italic max-w-[200px] opacity-60">
              Purchase & lab history — coming once Sales/Lab modules link here.
            </p>
          </div>
        </div>
      </div>
    </Drawer>
  );
};
