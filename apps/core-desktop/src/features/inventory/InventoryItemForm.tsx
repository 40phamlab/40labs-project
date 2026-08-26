// [PHASE: MVP]
// [SPEC: CONTEXT/SPEC/inventory.md]
import React, { useState } from 'react';
import { Input, Button, Toggle } from '@40labs/ui-components';
import type { InventoryItem, Medicine } from '@40labs/types';

/**
 * Combined type for the form state.
 * In a real scenario, adding an item might create/link a Medicine
 * and create an InventoryItem (batch).
 */
export interface InventoryItemFormData extends
  Omit<InventoryItem, 'id' | 'workspace_id' | 'branch_id' | 'created_at' | 'updated_at'>,
  Omit<Medicine, 'id' | 'workspace_id' | 'branch_id' | 'created_at' | 'updated_at'> {}

interface InventoryItemFormProps {
  initialData?: Partial<InventoryItemFormData>;
  onSubmit: (data: InventoryItemFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

/**
 * InventoryItemForm Component
 * Handles input for creating or editing inventory items (batches)
 * and their associated medicine details.
 */
export function InventoryItemForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false
}: InventoryItemFormProps) {
  const [formData, setFormData] = useState<InventoryItemFormData>({
    // Medicine fields
    name: initialData?.name || '',
    generic_name: initialData?.generic_name || '',
    category: initialData?.category || '',
    unit: initialData?.unit || 'pack',
    is_controlled_substance: initialData?.is_controlled_substance || false,
    requires_prescription: initialData?.requires_prescription || false,

    // InventoryItem fields
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
    // Clear error when field is touched
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 bg-surface p-6 rounded-card elevation-raised max-w-2xl mx-auto">
      <header>
        <h2 className="font-heading text-xl text-black/80">
          {initialData?.batch_number ? 'Edit Inventory Item' : 'Add New Inventory Item'}
        </h2>
        <p className="text-sm text-black/50 font-ui">Register a new medicine batch into stock.</p>
      </header>

      {/* Basic Medicine Info */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <h3 className="col-span-full font-ui font-semibold text-sm uppercase tracking-wider text-black/40 border-b border-black/5 pb-1">
          Medicine Details
        </h3>
        <Input
          label="Medicine Name"
          placeholder="e.g. Paracetamol 500mg"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          className="md:col-span-2"
        />
        <Input
          label="Generic Name (Optional)"
          placeholder="e.g. Paracetamol"
          value={formData.generic_name || ''}
          onChange={(e) => handleChange('generic_name', e.target.value)}
        />
        <Input
          label="Category"
          placeholder="e.g. Analgesic"
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
        />
        <Input
          label="Dispensing Unit"
          placeholder="e.g. pack, tablet, bottle"
          value={formData.unit}
          onChange={(e) => handleChange('unit', e.target.value)}
        />
      </section>

      {/* Batch & Inventory Info */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <h3 className="col-span-full font-ui font-semibold text-sm uppercase tracking-wider text-black/40 border-b border-black/5 pb-1">
          Batch & Stock
        </h3>
        <Input
          label="Batch Number"
          placeholder="BATCH-123"
          monospace
          value={formData.batch_number}
          onChange={(e) => handleChange('batch_number', e.target.value)}
          error={errors.batch_number}
        />
        <Input
          label="Expiry Date"
          type="date"
          value={formData.expiry_date.split('T')[0]}
          onChange={(e) => handleChange('expiry_date', e.target.value)}
          error={errors.expiry_date}
        />
        <Input
          label="Current Quantity"
          type="number"
          value={formData.quantity}
          onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
        />
        <Input
          label="Low Stock Threshold"
          type="number"
          value={formData.low_stock_threshold}
          onChange={(e) => handleChange('low_stock_threshold', parseInt(e.target.value) || 0)}
        />
      </section>

      {/* Pricing */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <h3 className="col-span-full font-ui font-semibold text-sm uppercase tracking-wider text-black/40 border-b border-black/5 pb-1">
          Pricing (TZS)
        </h3>
        <Input
          label="Buy Price (Unit Cost)"
          type="number"
          monospace
          value={formData.buy_price}
          onChange={(e) => handleChange('buy_price', parseInt(e.target.value) || 0)}
        />
        <Input
          label="Sell Price (Retail)"
          type="number"
          monospace
          value={formData.sell_price}
          onChange={(e) => handleChange('sell_price', parseInt(e.target.value) || 0)}
        />
      </section>

      {/* Regulations & Logistics */}
      <section className="flex flex-col gap-4">
        <h3 className="font-ui font-semibold text-sm uppercase tracking-wider text-black/40 border-b border-black/5 pb-1">
          Regulations & Logistics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <Toggle
            label="Controlled Substance"
            checked={formData.is_controlled_substance}
            onChange={(val) => handleChange('is_controlled_substance', val)}
          />
          <Toggle
            label="Requires Prescription"
            checked={formData.requires_prescription}
            onChange={(val) => handleChange('requires_prescription', val)}
          />
          <Toggle
            label="Cold Chain Required"
            checked={formData.cold_chain_required}
            onChange={(val) => handleChange('cold_chain_required', val)}
          />
        </div>
      </section>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-accent/10 border border-accent/20 p-3 rounded-input">
          {warnings.map((w, i) => (
            <p key={i} className="text-xs text-accent font-ui font-medium">⚠️ {w}</p>
          ))}
        </div>
      )}

      {/* Actions */}
      <footer className="flex justify-end gap-3 pt-4 border-t border-black/5">
        <Button intent="secondary" type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button intent="primary" type="submit" loading={isSubmitting}>
          {initialData?.batch_number ? 'Update Item' : 'Register Item'}
        </Button>
      </footer>
    </form>
  );
}
