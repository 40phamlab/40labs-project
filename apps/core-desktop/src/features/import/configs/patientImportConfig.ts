import { ImportConfig, ImportFieldConfig } from '../types';
import { normalizePhoneTZ } from '@40labs/i18n';

export const patientFields: ImportFieldConfig[] = [
  { key: 'fullName', label: 'Full Name', required: true, type: 'string', synonyms: ['full name', 'name', 'customer name', 'jina'], example: 'Anna Jumma' },
  { key: 'phone', label: 'Phone', required: true, type: 'string', synonyms: ['phone', 'mobile', 'phone number', 'simu', 'tel'], example: '0787 868 675' },
  { key: 'email', label: 'Email', required: false, type: 'string', synonyms: ['email', 'mail', 'barua pepe'], example: 'anna@example.com' },
  { key: 'gender', label: 'Gender', required: false, type: 'string', synonyms: ['gender', 'sex'], example: 'Female' },
  { key: 'dob', label: 'Date of Birth', required: false, type: 'date', synonyms: ['dob', 'date of birth', 'birthdate'], example: '1990-05-14' },
  { key: 'address', label: 'Address', required: false, type: 'string', synonyms: ['address', 'location', 'ward', 'district', 'morogoro'], example: 'Morogoro' },
  { key: 'openingBalance', label: 'Opening Balance (TZS)', required: false, type: 'number', synonyms: ['opening balance', 'balance', 'debt'], example: '0' },
];

export const patientExampleRows = [
  {
    fullName: 'Anna Jumma',
    phone: '0787 868 675',
    email: 'anna@example.com',
    gender: 'Female',
    dob: '1990-05-14',
    address: 'Morogoro',
    openingBalance: '0',
  },
  {
    fullName: 'Baraka Juma',
    phone: '0712 345 678',
    email: 'baraka@example.com',
    gender: 'Male',
    dob: '1985-11-20',
    address: 'Dar es Salaam',
    openingBalance: '0',
  },
];

export const patientImportConfig: ImportConfig = {
  moduleType: 'patients',
  title: 'Import Patients',
  fields: patientFields,
  exampleRows: patientExampleRows,
  keyExtractor: (record) => {
    const norm = normalizePhoneTZ(record.phone);
    return norm || (record.fullName || '').trim().toLowerCase();
  },
  validator: (record) => {
    const errs: string[] = [];
    if (!record.fullName || String(record.fullName).trim() === '') {
      errs.push('Full Name is required');
    }
    const norm = normalizePhoneTZ(record.phone);
    if (!norm) {
      errs.push('Phone number is invalid or missing');
    }
    return errs;
  },
  rowValidator: (record, existingRecords) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!record.fullName || String(record.fullName).trim() === '') {
      errors.push('Full Name required');
    }
    const norm = normalizePhoneTZ(record.phone);
    if (!norm) {
      errors.push('Invalid phone number format');
    }

    const isDuplicate = existingRecords.some((r) => {
      const rPhone = normalizePhoneTZ(r.phone || '');
      const recPhone = normalizePhoneTZ(record.phone || '');
      const rName = (r.full_name || r.fullName || '').trim().toLowerCase();
      const recName = (record.fullName || '').trim().toLowerCase();
      return (rPhone && recPhone && rPhone === recPhone) || (rName && recName && rName === recName);
    });

    return { errors, warnings, isDuplicate };
  },
};
