// [phase: 8D] Create Purchase Order Draft Modal
import * as React from 'react';
import {
  Modal,
  Button,
  Field,
  FieldLabel,
  Select,
  NumberInput,
  CurrencyInput,
} from '@40labs/ui-components';
import { usePurchases } from '../../../hooks/usePurchases';
import { useInventory } from '../../../hooks/useInventory';

export interface CreatePODraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplierId: string, lines: { medicineId: string; quantity: number; unitCost: number }[]) => Promise<void> | void;
  isLoading?: boolean;
}

export const CreatePODraftModal: React.FC<CreatePODraftModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}) => {
  const { suppliers } = usePurchases();
  const { medicines } = useInventory();

  // FLAG: [phase: 8D] Custom supplier picker component is absent in UI library; using native Select with initialSuppliers.
  const [supplierId, setSupplierId] = React.useState('');
  const [medicineId, setMedicineId] = React.useState('');
  const [quantity, setQuantity] = React.useState('50');
  const [unitCost, setUnitCost] = React.useState('2000');

  React.useEffect(() => {
    if (isOpen) {
      setSupplierId(suppliers[0]?.id || 'supplier_001');
      setMedicineId(medicines[0]?.id || '');
      setQuantity('50');
      setUnitCost('2000');
    }
  }, [isOpen, suppliers, medicines]);

  const isValid = Boolean(supplierId) && Boolean(medicineId) && Number(quantity) > 0 && Number(unitCost) > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isLoading) return;

    await onSave(supplierId, [
      {
        medicineId,
        quantity: Number(quantity),
        unitCost: Number(unitCost.replace(/,/g, '')),
      },
    ]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Purchase Order Draft"
      size="md"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button type="button" intent="neutral" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" intent="primary" onClick={handleSubmit as any} disabled={!isValid || isLoading}>
            {isLoading ? 'Creating Draft...' : 'Save PO Draft'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Supplier Picker */}
        <Field>
          <FieldLabel required>Supplier</FieldLabel>
          <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {(s as any).name || s.id}
              </option>
            ))}
          </Select>
        </Field>

        {/* Medicine / Product */}
        <Field>
          <FieldLabel required>Product / Medicine</FieldLabel>
          <Select value={medicineId} onChange={(e) => setMedicineId(e.target.value)}>
            {medicines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.unit || 'pack'})
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel required>Quantity</FieldLabel>
            <NumberInput value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="50" />
          </Field>

          <Field>
            <FieldLabel required>Unit Cost (TZS)</FieldLabel>
            <CurrencyInput
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              currencySymbol="TZS"
              placeholder="2000"
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
};
