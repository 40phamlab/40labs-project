import * as React from 'react';
import type { Customer } from '@40labs/types';
import { Panel, Textarea, Button } from '@40labs/ui-components';

interface NotesTabProps {
  customer: Customer;
  onUpdateNotes?: (notes: string) => Promise<void> | void;
}

export const NotesTab: React.FC<NotesTabProps> = ({ customer, onUpdateNotes }) => {
  const [notes, setNotes] = React.useState(customer.pharmacy_notes || customer.notes || '');
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  React.useEffect(() => {
    setNotes(customer.pharmacy_notes || customer.notes || '');
  }, [customer.id, customer.pharmacy_notes, customer.notes]);

  const handleSave = async () => {
    if (!onUpdateNotes) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdateNotes(notes);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      <Panel className="p-6 space-y-4 bg-panel rounded-card border border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Pharmacy Notes (Non-clinical)</h3>
          {saveSuccess && <span className="text-xs text-success font-semibold">Notes saved successfully!</span>}
        </div>
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
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Notes'}
          </Button>
        </div>
      </Panel>
    </div>
  );
};
