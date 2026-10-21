import { customersApi } from '../../api/customersApi';
import { auditApi } from '../../api/auditApi';
import { SummaryReport, ImportRowResult } from './types';
import { normalizePhoneTZ } from '@40labs/i18n';

export async function executePatientImport(
  validatedRows: ImportRowResult[],
  duplicateStrategy: 'skip' | 'update' | 'new',
  onProgress?: (current: number, total: number) => void
): Promise<SummaryReport> {
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const failedRows: SummaryReport['failedRows'] = [];
  const total = validatedRows.length;
  let processed = 0;

  try {
    auditApi.recordEntry({
      action: 'IMPORT_PATIENTS',
      performed_by_user_id: null,
      target_entity_type: 'Customer',
      target_entity_id: 'batch_import',
      metadata: { count: total, strategy: duplicateStrategy },
    });
  } catch {
    // Non-blocking
  }

  const batchSize = 200;
  for (let i = 0; i < total; i += batchSize) {
    const chunk = validatedRows.slice(i, i + batchSize);
    for (const item of chunk) {
      processed++;
      onProgress?.(processed, total);

      if (item.errors.length > 0) {
        failed++;
        failedRows.push({ rowIdx: item.rowIdx, reason: item.errors.join('; '), data: item.record });
        continue;
      }

      try {
        if (item.isDuplicate && duplicateStrategy === 'skip') {
          skipped++;
          continue;
        }

        const phoneVal = String(item.record.phone || '');
        const normDigits = normalizePhoneTZ(phoneVal);
        const normPhone = normDigits ? `+${normDigits}` : phoneVal;

        const payload = {
          fullName: String(item.record.fullName || '').trim(),
          phone: normPhone,
          email: item.record.email ? String(item.record.email).trim() : undefined,
          dob: item.record.dob ? String(item.record.dob).trim() : undefined,
          sex: (['male', 'female', 'other'].includes(String(item.record.gender || '').toLowerCase())
            ? String(item.record.gender).toLowerCase()
            : undefined) as any,
          wardDistrict: item.record.address ? String(item.record.address).trim() : undefined,
        };

        await customersApi.create(payload);
        imported++;
      } catch (err: any) {
        failed++;
        failedRows.push({ rowIdx: item.rowIdx, reason: err?.message || 'Failed to create customer', data: item.record });
      }
    }
  }

  return { imported, updated, skipped, failed, failedRows };
}
