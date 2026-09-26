import * as React from 'react';
import { Modal, Button, Select, Field, FieldLabel } from '@40labs/ui-components';
import { CustomerPicker } from '../../customers/components/CustomerPicker';
import type { Customer, TestCatalogEntry } from '@40labs/types';

export interface NewLabOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customerId: string, testCatalogId: string) => Promise<void> | void;
  customers: Customer[];
  testCatalog: TestCatalogEntry[];
  isLoading?: boolean;
}

export const NewLabOrderModal: React.FC<NewLabOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customers,
  testCatalog,
  isLoading = false,
}) => {
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [manualEntry, setManualEntry] = React.useState({ full_name: '', phone: '' });
  const [selectedTestId, setSelectedTestId] = React.useState<string>('');
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const selectedTest = React.useMemo(() => {
    return testCatalog.find((t) => t.id === selectedTestId);
  }, [testCatalog, selectedTestId]);

  const handleReset = () => {
    setSelectedCustomer(null);
    setManualEntry({ full_name: '', phone: '' });
    setSelectedTestId('');
    setErrorMsg(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedTestId) {
      setErrorMsg('Please select a laboratory test.');
      return;
    }

    const customerId = selectedCustomer?.id || customers[0]?.id;
    if (!customerId) {
      setErrorMsg('Please select an existing patient.');
      return;
    }

    await onSubmit(customerId, selectedTestId);
    handleReset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Lab Test Requisition"
      size="md"
      footer={
        <div className="flex gap-3 justify-end w-full">
          <Button type="button" intent="neutral" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" intent="primary" onClick={handleSubmit} disabled={isLoading || !selectedTestId}>
            {isLoading ? 'Creating...' : 'Create Order'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {errorMsg && (
          <div className="p-3 rounded-input bg-danger/10 border border-danger/30 text-danger text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Patient Selection using CustomerPicker */}
        <Field>
          <FieldLabel required>Patient Information</FieldLabel>
          <CustomerPicker
            value={selectedCustomer}
            manualEntry={manualEntry}
            onSelectCustomer={setSelectedCustomer}
            onManualEntryChange={setManualEntry}
            customers={customers}
          />
        </Field>

        {/* Test Selection */}
        <Field>
          <FieldLabel required>Lab Test Catalog</FieldLabel>
          <Select
            value={selectedTestId}
            onChange={(e) => setSelectedTestId(e.target.value)}
          >
            <option value="">Choose a test from catalog...</option>
            {testCatalog.map((test) => (
              <option key={test.id} value={test.id}>
                {test.name} ({test.category}) — TZS {test.price.toLocaleString()}
              </option>
            ))}
          </Select>
        </Field>

        {/* Selected Test Summary Card */}
        {selectedTest && (
          <div className="p-4 rounded-card bg-panel-strong/40 border border-border/50 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text">{selectedTest.name}</span>
              <span className="text-xs font-mono font-bold text-primary">
                TZS {selectedTest.price.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-text-muted">
              <span>Category: <strong className="text-text">{selectedTest.category}</strong></span>
              <span>Ref Range: <strong className="text-text">{selectedTest.reference_range || 'N/A'}</strong></span>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
