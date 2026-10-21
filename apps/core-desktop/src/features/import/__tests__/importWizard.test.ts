import { describe, test, expect } from 'vitest';
import { parseCsvText } from '../parseSpreadsheet';
import { stockImportConfig } from '../configs/stockImportConfig';
import { patientImportConfig } from '../configs/patientImportConfig';

describe('Import Wizard Utils & Configs', () => {
  test('parseCsvText handles CSV with BOM and quoted commas correctly', () => {
    const csv = '\uFEFFProduct Name,Category,Quantity\n"Paracetamol, 500mg",Analgesic,100';
    const result = parseCsvText(csv);
    expect(result.headers).toEqual(['Product Name', 'Category', 'Quantity']);
    expect(result.rows.length).toBe(1);
    expect(result.rows[0]['Product Name']).toBe('Paracetamol, 500mg');
  });

  test('stockImportConfig validates required fields and negative quantities', () => {
    const validRecord = {
      medicineName: 'Aspirin',
      category: 'Analgesic',
      quantity: '50',
      buyPrice: '500',
      sellPrice: '800',
      batchNumber: 'B123',
      expiryDate: '2028-01-01',
    };
    const errs = stockImportConfig.validator(validRecord);
    expect(errs.length).toBe(0);

    const invalidRecord = {
      medicineName: '',
      category: '',
      quantity: '-10',
      buyPrice: '-50',
      sellPrice: '800',
      batchNumber: '',
      expiryDate: 'invalid',
    };
    const invalidErrs = stockImportConfig.validator(invalidRecord);
    expect(invalidErrs.length).toBeGreaterThan(0);
  });

  test('patientImportConfig validates phone normalization and required fields', () => {
    const validPatient = {
      fullName: 'John Doe',
      phone: '0712345678',
    };
    const errs = patientImportConfig.validator(validPatient);
    expect(errs.length).toBe(0);

    const invalidPatient = {
      fullName: '',
      phone: 'badphone',
    };
    const invalidErrs = patientImportConfig.validator(invalidPatient);
    expect(invalidErrs.length).toBeGreaterThan(0);
  });
});
