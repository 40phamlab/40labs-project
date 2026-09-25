import * as React from 'react';
import { Modal, Button, Select } from '@40labs/ui-components';
import { CustomerPicker } from '../customers/CustomerPicker';
import type { Customer, TestCatalogEntry, LabOrder } from '@40labs/types';
import { pharmaciesApi } from '../../api';

export interface NewLabOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (order: LabOrder, newCustomer?: Customer) => void;
  customers: Customer[];
  testCatalog: TestCatalogEntry[];
}

export const NewLabOrderModal: React.FC<NewLabOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customers,
  testCatalog,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedTestId) {
      setErrorMsg('Please select a laboratory test.');
      return;
    }

    let customerId = selectedCustomer?.id;
    let newCustomer: Customer | undefined;

    const business = pharmaciesApi.getBusiness();
    const WORKSPACE_ID = business.id || 'ws_dev_001';
    const BRANCH_ID = 'br_dev_001';

    if (!customerId) {
      if (!manualEntry.full_name.trim()) {
        setErrorMsg('Please select an existing patient or enter patient name.');
        return;
      }

      newCustomer = {
        id: `cust_${Date.now()}`,
        workspace_id: WORKSPACE_ID,
        branch_id: BRANCH_ID,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        full_name: manualEntry.full_name.trim(),
        phone: manualEntry.phone.trim() || 'N/A',
        email: null,
        outstanding_balance: 0,
        notes: 'Created via New Lab Test Requisition',
        amob_patient_id: null,
      };
      customerId = newCustomer.id;
    }

    const newOrder: LabOrder = {
      id: `labord_${Date.now().toString().slice(-6)}`,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customer_id: customerId,
      sale_id: null,
      ordered_by_user_id: 'user_001',
      status: 'pending',
      test_catalog_id: selectedTestId,
    };

    onSubmit(newOrder, newCustomer);
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
        <div className="flex gap-2 justify-end w-full">
          <Button type="button" intent="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="button" intent="primary" onClick={handleSubmit}>
            Create Order
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
        <div className="flex flex-col gap-1.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
            1. Patient Information
          </h3>
          <CustomerPicker
            value={selectedCustomer}
            manualEntry={manualEntry}
            onSelectCustomer={setSelectedCustomer}
            onManualEntryChange={setManualEntry}
            customers={customers}
          />
        </div>

        {/* Test Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-40">
            2. Select Lab Test
          </label>
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
        </div>

        {/* Selected Test Summary Card */}
        {selectedTest && (
          <div className="p-4 rounded-card bg-panel-strong border border-border/50 flex flex-col gap-2">
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
