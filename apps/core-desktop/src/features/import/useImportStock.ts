import { inventoryApi } from '../../api/inventoryApi';
import { auditApi } from '../../api/auditApi';
import { parsePriceNumber, parseDateVal } from './configs/stockImportConfig';
import { SummaryReport, ImportRowResult } from './types';

export async function executeStockImport(
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
      action: 'IMPORT_STOCK',
      performed_by_user_id: null,
      target_entity_type: 'InventoryItem',
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

        const payload = {
          medicineName: String(item.record.medicineName || '').trim(),
          genericName: item.record.genericName ? String(item.record.genericName).trim() : undefined,
          category: String(item.record.category || 'General').trim(),
          unit: String(item.record.unit || 'Pack').trim(),
          batchNumber: String(item.record.batchNumber || '').trim(),
          expiryDate: parseDateVal(item.record.expiryDate),
          buyPrice: parsePriceNumber(item.record.buyPrice),
          sellPrice: parsePriceNumber(item.record.sellPrice),
          quantity: Number(item.record.quantity || 0),
          lowStockThreshold: Number(item.record.lowStockThreshold || 10),
        };

        await inventoryApi.create(payload);
        imported++;
      } catch (err: any) {
        failed++;
        failedRows.push({ rowIdx: item.rowIdx, reason: err?.message || 'Failed to persist item', data: item.record });
      }
    }
  }

  return { imported, updated, skipped, failed, failedRows };
}
