import { ImportConfig, ImportFieldConfig } from '../types';

export const stockFields: ImportFieldConfig[] = [
  { key: 'medicineName', label: 'Product Name', required: true, type: 'string', synonyms: ['name', 'product name', 'medicine name', 'item name', 'jina'], example: 'Paracetamol 500mg' },
  { key: 'genericName', label: 'Generic Name', required: false, type: 'string', synonyms: ['generic', 'generic name'], example: 'Paracetamol' },
  { key: 'category', label: 'Category', required: true, type: 'string', synonyms: ['category', 'group', 'type'], example: 'Analgesic' },
  { key: 'quantity', label: 'Quantity', required: true, type: 'number', synonyms: ['qty', 'quantity', 'stock', 'idadi'], example: '100' },
  { key: 'unit', label: 'Unit / Pack Type', required: false, type: 'string', synonyms: ['unit', 'pack type', 'pack'], example: 'Pack' },
  { key: 'buyPrice', label: 'Cost Price (TZS)', required: true, type: 'number', synonyms: ['cost price', 'buy price', 'cost', 'purchase price'], example: '1000' },
  { key: 'sellPrice', label: 'Selling Price (TZS)', required: true, type: 'number', synonyms: ['selling price', 'sell price', 'price', 'retail price'], example: '1500' },
  { key: 'batchNumber', label: 'Batch Number', required: true, type: 'string', synonyms: ['batch', 'batch number', 'lot'], example: 'BATCH-479937' },
  { key: 'expiryDate', label: 'Expiry Date', required: true, type: 'date', synonyms: ['expiry date', 'expiry', 'exp date', 'exp'], example: '2027-10-20' },
  { key: 'supplier', label: 'Supplier', required: false, type: 'string', synonyms: ['supplier', 'vendor'], example: 'MSD Tanzania' },
  { key: 'barcode', label: 'Barcode', required: false, type: 'string', synonyms: ['barcode', 'sku', 'code'], example: '6001234567890' },
  { key: 'lowStockThreshold', label: 'Reorder Level', required: false, type: 'number', synonyms: ['reorder level', 'threshold', 'low stock threshold'], example: '20' },
];

export const stockExampleRows = [
  {
    medicineName: 'Paracetamol 500mg',
    genericName: 'Paracetamol',
    category: 'Analgesic',
    quantity: '100',
    unit: 'Pack',
    buyPrice: '1000',
    sellPrice: '1500',
    batchNumber: 'BATCH-479937',
    expiryDate: '2027-10-20',
    supplier: 'MSD Tanzania',
    barcode: '6001234567890',
    lowStockThreshold: '20',
  },
  {
    medicineName: 'Amoxicillin 250mg',
    genericName: 'Amoxicillin',
    category: 'Antibiotic',
    quantity: '50',
    unit: 'Box',
    buyPrice: '3000',
    sellPrice: '4500',
    batchNumber: 'AMX-998822',
    expiryDate: '2026-05-15',
    supplier: 'Metro Pharmaceuticals',
    barcode: '6001234567891',
    lowStockThreshold: '10',
  },
];

export function parsePriceNumber(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/TZS/gi, '').replace(/\s+/g, '').replace(/,/g, '');
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

export function parseDateVal(val: any): string {
  if (!val) return '';
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/');
    return `${y}-${m}-${d}`;
  }
  const serial = Number(str);
  if (!isNaN(serial) && serial > 30000) {
    const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400 * 1000;
    const dateInfo = new Date(utcValue);
    if (!isNaN(dateInfo.getTime())) {
      return dateInfo.toISOString().split('T')[0];
    }
  }
  return str;
}

export const stockImportConfig: ImportConfig = {
  moduleType: 'stock',
  title: 'Import Stock & Medicines',
  fields: stockFields,
  exampleRows: stockExampleRows,
  keyExtractor: (record) => `${(record.medicineName || '').trim().toLowerCase()}_${(record.batchNumber || '').trim()}`,
  validator: (record) => {
    const errs: string[] = [];
    if (!record.medicineName || String(record.medicineName).trim() === '') {
      errs.push('Product Name is required');
    }
    const qty = Number(record.quantity);
    if (isNaN(qty) || qty < 0) {
      errs.push('Quantity must be an integer >= 0');
    }
    const buy = parsePriceNumber(record.buyPrice);
    const sell = parsePriceNumber(record.sellPrice);
    if (isNaN(buy) || buy < 0) {
      errs.push('Cost Price must be numeric >= 0');
    }
    if (isNaN(sell) || sell < 0) {
      errs.push('Selling Price must be numeric >= 0');
    }
    if (!record.batchNumber || String(record.batchNumber).trim() === '') {
      errs.push('Batch Number is required');
    }
    const exp = parseDateVal(record.expiryDate);
    if (!exp || isNaN(new Date(exp).getTime())) {
      errs.push('Expiry Date is invalid or missing');
    }
    return errs;
  },
  rowValidator: (record, existingRecords) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.medicineName || String(record.medicineName).trim() === '') {
      errors.push('Product Name required');
    }
    const qty = Number(record.quantity);
    if (isNaN(qty) || qty < 0) {
      errors.push('Invalid quantity');
    }
    const buy = parsePriceNumber(record.buyPrice);
    const sell = parsePriceNumber(record.sellPrice);
    if (isNaN(buy) || buy < 0) errors.push('Invalid buy price');
    if (isNaN(sell) || sell < 0) errors.push('Invalid sell price');
    if (sell < buy) {
      warnings.push('Selling price is less than cost price');
    }
    if (!record.batchNumber || String(record.batchNumber).trim() === '') {
      errors.push('Batch number required');
    }
    const exp = parseDateVal(record.expiryDate);
    if (!exp || isNaN(new Date(exp).getTime())) {
      errors.push('Invalid expiry date');
    } else {
      const expDate = new Date(exp);
      if (expDate.getTime() < Date.now()) {
        warnings.push('Batch is already expired');
      }
    }

    const isDuplicate = existingRecords.some((r) => {
      const rName = (r.name || r.medicineName || '').trim().toLowerCase();
      const rBatch = (r.batch_number || r.batchNumber || '').trim();
      return rName === (record.medicineName || '').trim().toLowerCase() && rBatch === (record.batchNumber || '').trim();
    });

    return { errors, warnings, isDuplicate };
  },
};
