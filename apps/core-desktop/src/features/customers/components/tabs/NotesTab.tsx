// [PHASE: MVP]
import * as React from 'react';
import type { Customer } from '@40labs/types';
import { Panel, Textarea, Button } from '@40labs/ui-components';

interface NotesTabProps {
  customer: Customer;
  onUpdateNotes?: (notes: string) => void;
}

export const NotesTab: React.FC<NotesTabProps> = ({ customer, onUpdateNotes }) => {
  const [notes, setNotes] = React.useState(customer.pharmacy_notes || customer.notes || '');

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      <Panel className="p-6 space-y-4 bg-panel rounded-card border border-border">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Pharmacy Notes (Non-clinical)</h3>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter non-clinical pharmacy notes, customer preferences, or pickup instructions..."
          className="min-h-[150px]"
        />
        <div className="flex justify-end">
          <Button
            intent="primary"
            size="sm"
            onClick={() => onUpdateNotes?.(notes)}
          >
            Save Notes
          </Button>
        </div>
      </Panel>
    </div>
  );
};
