import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  Input,
  Button,
  Toggle,
  Field,
  FieldLabel,
  FieldError,
  CurrencyInput,
  DateInput,
  NumberInput,
  Card,
  CardHeader,
  CardBody
} from '@40labs/ui-components';
import type { InventoryItem, Medicine } from '@40labs/types';

export interface InventoryItemFormData extends
  Omit<InventoryItem, 'id' | 'workspace_id' | 'branch_id' | 'created_at' | 'updated_at'>,
  Omit<Medicine, 'id' | 'workspace_id' | 'branch_id' | 'created_at' | 'updated_at'> {}

interface InventoryItemFormProps {
  initialData?: Partial<InventoryItemFormData>;
  onSubmit: (data: InventoryItemFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function InventoryItemForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false
}: InventoryItemFormProps) {
  const [formData, setFormData] = useState<InventoryItemFormData>({
    name: initialData?.name || '',
    generic_name: initialData?.generic_name || '',
    category: initialData?.category || '',
    unit: initialData?.unit || 'pack',
    is_controlled_substance: initialData?.is_controlled_substance || false,
    requires_prescription: initialData?.requires_prescription || false,
    medicine_id: initialData?.medicine_id || '',
    batch_number: initialData?.batch_number || '',
    expiry_date: initialData?.expiry_date || '',
    buy_price: initialData?.buy_price || 0,
    sell_price: initialData?.sell_price || 0,
    quantity: initialData?.quantity || 0,
    low_stock_threshold: initialData?.low_stock_threshold || 10,
    cold_chain_required: initialData?.cold_chain_required || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleChange = (field: keyof InventoryItemFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const newWarnings: string[] = [];

    if (!formData.name) newErrors.name = 'Medicine name is required';
    if (!formData.batch_number) newErrors.batch_number = 'Batch number is required';
    if (!formData.expiry_date) newErrors.expiry_date = 'Expiry date is required';

    if (formData.sell_price < formData.buy_price) {
      newWarnings.push('Sell price is lower than buy price (loss expected).');
    }

    setErrors(newErrors);
    setWarnings(newWarnings);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto border border-border/10">
      <CardHeader>
        <h2 className="font-heading text-xl text-text">
          {initialData?.batch_number ? 'Edit Inventory Item' : 'Add New Inventory Item'}
        </h2>
        <p className="text-sm text-text-muted font-ui">Register a new medicine batch into stock.</p>
      </CardHeader>

      <CardBody>
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* Basic Medicine Info */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <h3 className="col-span-full font-ui font-semibold text-xs uppercase tracking-wider text-text-muted border-b border-border/10 pb-1">
              Medicine Details
            </h3>
            <div className="md:col-span-2">
              <Field>
                <FieldLabel required>Medicine Name</FieldLabel>
                <Input
                  placeholder="e.g. Paracetamol 500mg"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
                  error={!!errors.name}
                />
                {errors.name && <FieldError>{errors.name}</FieldError>}
              </Field>
            </div>
            <Field>
              <FieldLabel>Generic Name (Optional)</FieldLabel>
              <Input
                placeholder="e.g. Paracetamol"
                value={formData.generic_name || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('generic_name', e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Category</FieldLabel>
              <Input
                placeholder="e.g. Analgesic"
                value={formData.category}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('category', e.target.value)}
              />
            </Field>
          </section>

          {/* Batch & Inventory Info */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <h3 className="col-span-full font-ui font-semibold text-xs uppercase tracking-wider text-text-muted border-b border-border/10 pb-1">
              Batch & Stock
            </h3>
            <Field>
              <FieldLabel required>Batch Number</FieldLabel>
              <Input
                placeholder="BATCH-123"
                monospace
                value={formData.batch_number}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('batch_number', e.target.value)}
                error={!!errors.batch_number}
              />
              {errors.batch_number && <FieldError>{errors.batch_number}</FieldError>}
            </Field>
            <Field>
              <FieldLabel required>Expiry Date</FieldLabel>
              <DateInput
                value={formData.expiry_date.split('T')[0]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('expiry_date', e.target.value)}
                error={!!errors.expiry_date}
              />
              {errors.expiry_date && <FieldError>{errors.expiry_date}</FieldError>}
            </Field>
            <Field>
              <FieldLabel>Current Quantity</FieldLabel>
              <NumberInput
                value={formData.quantity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('quantity', parseInt(e.target.value) || 0)}
              />
            </Field>
            <Field>
              <FieldLabel>Low Stock Threshold</FieldLabel>
              <NumberInput
                value={formData.low_stock_threshold}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('low_stock_threshold', parseInt(e.target.value) || 0)}
              />
            </Field>
          </section>

          {/* Pricing */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <h3 className="col-span-full font-ui font-semibold text-xs uppercase tracking-wider text-text-muted border-b border-border/10 pb-1">
              Pricing
            </h3>
            <Field>
              <FieldLabel>Buy Price (Unit Cost)</FieldLabel>
              <CurrencyInput
                value={formData.buy_price}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('buy_price', parseFloat(e.target.value) || 0)}
              />
            </Field>
            <Field>
              <FieldLabel>Sell Price (Retail)</FieldLabel>
              <CurrencyInput
                value={formData.sell_price}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('sell_price', parseFloat(e.target.value) || 0)}
              />
            </Field>
          </section>

          {/* Regulations */}
          <section className="space-y-4">
            <h3 className="font-ui font-semibold text-xs uppercase tracking-wider text-text-muted border-b border-border/10 pb-1">
              Regulations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <Toggle
                label="Controlled Substance"
                checked={formData.is_controlled_substance}
                onChange={(val: boolean) => handleChange('is_controlled_substance', val)}
              />
              <Toggle
                label="Requires Prescription"
                checked={formData.requires_prescription}
                onChange={(val: boolean) => handleChange('requires_prescription', val)}
              />
            </div>
          </section>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-accent/10 border border-accent/20 p-3 rounded-input">
              {warnings.map((w, i) => (
                <p key={i} className="text-xs text-accent font-ui font-medium flex items-center gap-2">
                  <AlertCircle size={14} />
                  {w}
                </p>
              ))}
            </div>
          )}

          <footer className="flex justify-end gap-3 pt-6 border-t border-border/10">
            <Button intent="neutral" type="button" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button intent="primary" type="submit" loading={isSubmitting}>
              {initialData?.batch_number ? 'Update Item' : 'Register Item'}
            </Button>
          </footer>
        </form>
      </CardBody>
    </Card>
  );
}
