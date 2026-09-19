import * as React from 'react';
import {
  Modal,
  Button,
  Field,
  FieldLabel,
  Input,
  Select,
  NumberInput,
  CurrencyInput,
  DateInput,
} from '@40labs/ui-components';
import { mockMedicines } from '../../lib/mockData';
import { type Medicine, type InventoryItem } from '@40labs/types';
import { type MedicineWithInventory } from './InventoryScreen';

interface NewStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newItem: MedicineWithInventory) => void;
}

const CATEGORIES = Array.from(new Set(mockMedicines.map((m) => m.category)));
const UNITS = ['pack', 'tablet', 'bottle', 'sachet'];

export const NewStockModal: React.FC<NewStockModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = React.useState({
    name: '',
    category: CATEGORIES[0] || '',
    quantity: '1',
    buy_price: '0',
    sell_price: '0',
    unit: UNITS[0] || '',
    batch: 'BATCH-' + Math.floor(Math.random() * 1000),
    expiry_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isFormValid = Object.values(formData).every((val) => val.trim() !== '');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Placeholder session context (matches mockData.ts)
    const WORKSPACE_ID = 'ws_dev_001';
    const BRANCH_ID = 'br_dev_001';
    const now = new Date().toISOString();
    const idSuffix = Math.random().toString(36).substr(2, 9);

    const newMedicine: Medicine = {
      id: `med_new_${idSuffix}`,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: now,
      updated_at: now,
      name: formData.name,
      generic_name: null,
      category: formData.category,
      unit: formData.unit,
      is_controlled_substance: false,
      requires_prescription: false,
    };

    const newInventoryItem: InventoryItem = {
      id: `inv_new_${idSuffix}`,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: now,
      updated_at: now,
      medicine_id: newMedicine.id,
      batch_number: formData.batch,
      expiry_date: new Date(formData.expiry_date).toISOString(),
      buy_price: Number(formData.buy_price.replace(/,/g, '')),
      sell_price: Number(formData.sell_price.replace(/,/g, '')),
      quantity: Number(formData.quantity),
      low_stock_threshold: 10,
      cold_chain_required: false,
    };

    onAdd({
      ...newInventoryItem,
      medicine: newMedicine,
    });

    // Reset form and close
    setFormData({
      name: '',
      category: CATEGORIES[0] || '',
      quantity: '',
      buy_price: '',
      sell_price: '',
      unit: UNITS[0] || '',
      batch: '',
      expiry_date: '',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Stock"
      size="lg"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button type="button" intent="accent" onClick={onClose} className="rounded-full px-8">
            Cancel
          </Button>
          <Button type="button" intent="primary" onClick={handleAdd as any} disabled={!isFormValid} className="rounded-full px-8">
            Add
          </Button>
        </div>
      }
    >
      <form onSubmit={handleAdd} className="grid grid-cols-2 gap-x-8 gap-y-4">
        {/* Left Column */}
        <div className="space-y-4">
          <Field>
            <FieldLabel required>Product name</FieldLabel>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Paracetamol"
              autoFocus
            />
          </Field>

          <Field>
            <FieldLabel required>Category</FieldLabel>
            <Select name="category" value={formData.category} onChange={handleChange}>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            <FieldLabel required>Quntity</FieldLabel>
            <NumberInput
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="0"
            />
          </Field>

          <Field>
            <FieldLabel required>Buy price</FieldLabel>
            <CurrencyInput
              name="buy_price"
              value={formData.buy_price}
              onChange={handleChange}
              currencySymbol="TZS"
              placeholder="0"
            />
          </Field>

          <Field>
            <FieldLabel required>Sell price</FieldLabel>
            <CurrencyInput
              name="sell_price"
              value={formData.sell_price}
              onChange={handleChange}
              currencySymbol="TZS"
              placeholder="0"
            />
          </Field>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <Field>
            <FieldLabel required>Metric</FieldLabel>
            <Select name="unit" value={formData.unit} onChange={handleChange}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            <FieldLabel required>batch</FieldLabel>
            <Input
              name="batch"
              value={formData.batch}
              onChange={handleChange}
              monospace
              placeholder="BATCH-000"
            />
          </Field>

          <Field>
            <FieldLabel required>Expire</FieldLabel>
            <DateInput
              name="expiry_date"
              value={formData.expiry_date}
              onChange={handleChange}
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
};

