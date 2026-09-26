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
import { useInventory, type AddStockPayload } from '../../../hooks/useInventory';

interface NewStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (payload: AddStockPayload) => Promise<unknown> | void;
  isLoading?: boolean;
}

const UNITS = ['pack', 'tablet', 'bottle', 'sachet', 'ampoule', 'vial'];
const DEFAULT_CATEGORIES = ['Analgesic', 'Antibiotic', 'Sedative', 'Rehydration', 'Supplements'];

export const NewStockModal: React.FC<NewStockModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  isLoading = false,
}) => {
  const { medicines } = useInventory();

  const categories = React.useMemo(() => {
    const set = new Set([...DEFAULT_CATEGORIES, ...medicines.map((m) => m.category)]);
    return Array.from(set);
  }, [medicines]);

  const [formData, setFormData] = React.useState({
    name: '',
    generic_name: '',
    category: categories[0] || 'Analgesic',
    quantity: '10',
    buy_price: '1000',
    sell_price: '1500',
    unit: UNITS[0] || 'pack',
    batch: 'BATCH-' + Math.floor(100000 + Math.random() * 900000),
    expiry_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    low_stock_threshold: '10',
  });

  React.useEffect(() => {
    if (categories.length > 0 && !categories.includes(formData.category)) {
      setFormData((prev) => ({ ...prev, category: categories[0] }));
    }
  }, [categories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isFormValid =
    formData.name.trim() !== '' &&
    formData.batch.trim() !== '' &&
    formData.expiry_date.trim() !== '' &&
    Number(formData.quantity) > 0;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    const payload: AddStockPayload = {
      medicineName: formData.name.trim(),
      genericName: formData.generic_name.trim() || undefined,
      category: formData.category,
      unit: formData.unit,
      batchNumber: formData.batch.trim(),
      expiryDate: new Date(formData.expiry_date).toISOString(),
      buyPrice: Number(formData.buy_price.replace(/,/g, '')),
      sellPrice: Number(formData.sell_price.replace(/,/g, '')),
      quantity: Number(formData.quantity),
      lowStockThreshold: Number(formData.low_stock_threshold) || 10,
    };

    await onAdd(payload);

    setFormData({
      name: '',
      generic_name: '',
      category: categories[0] || 'Analgesic',
      quantity: '10',
      buy_price: '1000',
      sell_price: '1500',
      unit: UNITS[0] || 'pack',
      batch: 'BATCH-' + Math.floor(100000 + Math.random() * 900000),
      expiry_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      low_stock_threshold: '10',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Stock Batch"
      size="lg"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button type="button" variant="neutral" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleAdd as any}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? 'Adding Stock...' : 'Add Stock'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleAdd} className="grid grid-cols-2 gap-x-8 gap-y-4">
        {/* Left Column */}
        <div className="space-y-4">
          <Field>
            <FieldLabel required>Product Name</FieldLabel>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Paracetamol 500mg"
              autoFocus
            />
          </Field>

          <Field>
            <FieldLabel>Generic Name</FieldLabel>
            <Input
              name="generic_name"
              value={formData.generic_name}
              onChange={handleChange}
              placeholder="e.g. Paracetamol"
            />
          </Field>

          <Field>
            <FieldLabel required>Category</FieldLabel>
            <Select name="category" value={formData.category} onChange={handleChange}>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            <FieldLabel required>Quantity</FieldLabel>
            <NumberInput
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              placeholder="0"
            />
          </Field>

          <Field>
            <FieldLabel required>Buy Price (TZS)</FieldLabel>
            <CurrencyInput
              name="buy_price"
              value={formData.buy_price}
              onChange={handleChange}
              currencySymbol="TZS"
              placeholder="0"
            />
          </Field>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <Field>
            <FieldLabel required>Sell Price (TZS)</FieldLabel>
            <CurrencyInput
              name="sell_price"
              value={formData.sell_price}
              onChange={handleChange}
              currencySymbol="TZS"
              placeholder="0"
            />
          </Field>

          <Field>
            <FieldLabel required>Unit / Metric</FieldLabel>
            <Select name="unit" value={formData.unit} onChange={handleChange}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            <FieldLabel required>Batch Number</FieldLabel>
            <Input
              name="batch"
              value={formData.batch}
              onChange={handleChange}
              monospace
              placeholder="BATCH-000"
            />
          </Field>

          <Field>
            <FieldLabel required>Expiry Date</FieldLabel>
            <DateInput
              name="expiry_date"
              value={formData.expiry_date}
              onChange={handleChange}
            />
          </Field>

          <Field>
            <FieldLabel>Low Stock Threshold</FieldLabel>
            <NumberInput
              name="low_stock_threshold"
              value={formData.low_stock_threshold}
              onChange={handleChange}
              placeholder="10"
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
};
