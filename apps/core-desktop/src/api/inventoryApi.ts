import type { Medicine, InventoryItem, MedicineWithInventory, StockAdjustment, AuditLogEntry } from '@40labs/types';
import { isUsingTauriIpc, invokeCommand } from './client';

export interface AddStockPayload { medicineName: string; genericName?: string; category: string; unit: string; batchNumber: string; expiryDate: string; buyPrice: number; sellPrice: number; quantity: number; lowStockThreshold: number; imagePath?: string }
export interface UpdateStockPayload { batchNumber?: string; expiryDate?: string; buyPrice?: number; sellPrice?: number; quantity?: number; lowStockThreshold?: number; imagePath?: string }
export type StockActionType = 'adjustment' | 'refill' | 'damaged' | 'expired' | 'disposed' | 'transferred' | 'deactivated';
export interface RecordStockActionPayload { inventoryItemId: string; action: StockActionType; quantityDelta?: number; newQuantity?: number; reason: string; authorizedPin?: string; authorizedByUserId?: string }
export interface RecordStockActionResult { inventoryItem: MedicineWithInventory; adjustment: StockAdjustment; auditEntry?: AuditLogEntry; auditEntryId?: string }
const requireDesktop = (): void => { if (!isUsingTauriIpc()) throw new Error('This operation requires Core Desktop SQLite'); };

export const inventoryApi = {
  list: async (includeDeactivated = false): Promise<MedicineWithInventory[]> => { requireDesktop(); return invokeCommand('get_inventory_list', { includeDeactivated }); },
  listMedicines: async (): Promise<Medicine[]> => { requireDesktop(); return invokeCommand('get_medicines_list'); },
  listInventoryItems: async (): Promise<InventoryItem[]> => (await inventoryApi.list(true)).map(({ medicine: _medicine, ...item }) => item),
  listStockAdjustments: async (): Promise<StockAdjustment[]> => { requireDesktop(); return invokeCommand('get_stock_adjustments'); },
  get: async (id: string): Promise<MedicineWithInventory | null> => { requireDesktop(); return invokeCommand('get_inventory_item', { id }); },
  getMedicine: async (id: string): Promise<Medicine | null> => (await inventoryApi.listMedicines()).find((m) => m.id === id) ?? null,
  getInventoryItem: async (id: string): Promise<InventoryItem | null> => (await inventoryApi.listInventoryItems()).find((i) => i.id === id) ?? null,
  create: async (payload: AddStockPayload): Promise<MedicineWithInventory> => { requireDesktop(); return invokeCommand('create_stock_item', { payload }); },
  update: async (id: string, updates: UpdateStockPayload): Promise<MedicineWithInventory | null> => {
    requireDesktop();
    if (updates.quantity !== undefined && Object.keys(updates).length === 1) {
      const result = await inventoryApi.recordStockAction({ inventoryItemId: id, action: 'adjustment', newQuantity: updates.quantity, reason: 'Inventory quantity updated' });
      return result?.inventoryItem ?? null;
    }
    throw new Error('Batch detail editing is not supported by the SQLite repository');
  },
  recordStockAction: async (payload: RecordStockActionPayload): Promise<RecordStockActionResult | null> => { requireDesktop(); return invokeCommand('record_stock_action', { payload }); },
  updateQuantity: async (id: string, delta: number): Promise<InventoryItem | null> => (await inventoryApi.recordStockAction({ inventoryItemId: id, action: 'adjustment', quantityDelta: delta, reason: `Quick quantity adjustment (${delta > 0 ? '+' : ''}${delta})` }))?.inventoryItem ?? null,
  delete: async (id: string): Promise<boolean> => Boolean(await inventoryApi.recordStockAction({ inventoryItemId: id, action: 'deactivated', reason: 'Deactivated stock batch via UI' })),
  getMedicines: (): Promise<Medicine[]> => inventoryApi.listMedicines(),
  getInventoryItems: (): Promise<InventoryItem[]> => inventoryApi.listInventoryItems(),
  getMedicinesWithInventory: (): Promise<MedicineWithInventory[]> => inventoryApi.list(),
  addStock: (payload: AddStockPayload): Promise<MedicineWithInventory> => inventoryApi.create(payload),
  deleteItem: (id: string): Promise<boolean> => inventoryApi.delete(id),
};
export const inventory = inventoryApi;
