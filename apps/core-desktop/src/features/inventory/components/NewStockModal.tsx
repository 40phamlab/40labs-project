// [PHASE MVP — Medicine Product Image Slot]
// [SPEC: CONTEXT/SPEC/inventory.md]

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
import { Upload, Trash2, RefreshCw } from 'lucide-react';
import { t } from '@40labs/i18n';
import { useInventory, type AddStockPayload } from '../../../hooks/useInventory';

interface NewStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (payload: AddStockPayload) => Promise<unknown> | void;
  isLoading?: boolean;
}

const UNITS = ['pack', 'tablet', 'bottle', 'sachet', 'ampoule', 'vial'];
const DEFAULT_CATEGORIES = ['Analgesic', 'Antibiotic', 'Sedative', 'Rehydration', 'Supplements'];

async function processImageFile(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image file exceeds 5MB limit');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 256;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context failed'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const webpDataUrl = canvas.toDataURL('image/webp', 0.8);
        resolve(webpDataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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
    imagePath: '' as string | null,
  });

  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    if (categories.length > 0 && !categories.includes(formData.category)) {
      setFormData((prev) => ({ ...prev, category: categories[0] }));
    }
  }, [categories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelected = async (file?: File) => {
    if (!file) return;
    try {
      const compressedWebp = await processImageFile(file);
      setFormData((prev) => ({ ...prev, imagePath: compressedWebp }));
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFileSelected(file);
    }
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
      imagePath: formData.imagePath || undefined,
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
      imagePath: null,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Stock Item"
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

          {/* Product Photo Dropzone */}
          <Field>
            <FieldLabel>{t('inventory.photo.title')}</FieldLabel>
            <div className="flex items-center gap-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/png,image/jpeg,image/webp';
                  input.onchange = (ev: any) => {
                    const file = ev.target.files?.[0];
                    if (file) handleFileSelected(file);
                  };
                  input.click();
                }}
                className={`relative w-24 h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${
                  isDragging ? 'border-primary bg-primary/10' : 'border-border/60 bg-panel-subtle hover:border-primary'
                }`}
                title={t('inventory.photo.dropzone')}
              >
                {formData.imagePath ? (
                  <img src={formData.imagePath} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center p-1 text-center text-text-muted">
                    <Upload size={20} className="mb-1 text-primary" />
                    <span className="text-[10px] leading-tight">Photo</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 flex-1 text-xs">
                <p className="text-text-muted text-[11px] leading-relaxed">
                  {t('inventory.photo.dropzone')}
                </p>
                {formData.imagePath && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="neutral"
                      size="sm"
                      leftIcon={<RefreshCw size={12} />}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/png,image/jpeg,image/webp';
                        input.onchange = (ev: any) => {
                          const file = ev.target.files?.[0];
                          if (file) handleFileSelected(file);
                        };
                        input.click();
                      }}
                    >
                      {t('inventory.photo.replace')}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      leftIcon={<Trash2 size={12} />}
                      onClick={() => setFormData((prev) => ({ ...prev, imagePath: null }))}
                    >
                      {t('inventory.photo.remove')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
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
        </div>

        {/* Right Column */}
        <div className="space-y-4">
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
