import type { Medicine, InventoryItem, MedicineWithInventory, StockAdjustment, AuditLogEntry } from '@40labs/types';
import { initialMedicines, initialInventoryItems, initialStockAdjustments, WORKSPACE_ID, BRANCH_ID } from '../devData/index.ts';
import { auditApi } from './auditApi';

export interface AddStockPayload {
  medicineName: string;
  genericName?: string;
  category: string;
  unit: string;
  batchNumber: string;
  expiryDate: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  lowStockThreshold: number;
}

export interface UpdateStockPayload {
  batchNumber?: string;
  expiryDate?: string;
  buyPrice?: number;
  sellPrice?: number;
  quantity?: number;
  lowStockThreshold?: number;
}

export type StockActionType =
  | 'adjustment'
  | 'refill'
  | 'damaged'
  | 'expired'
  | 'disposed'
  | 'transferred'
  | 'deactivated';

export interface RecordStockActionPayload {
  inventoryItemId: string;
  action: StockActionType;
  quantityDelta?: number;
  newQuantity?: number;
  reason: string;
  authorizedPin?: string;
  authorizedByUserId?: string;
}

export interface RecordStockActionResult {
  inventoryItem: MedicineWithInventory;
  adjustment: StockAdjustment;
  auditEntry: AuditLogEntry;
}

// Extended inventory item type tracking deactivation status
export type ExtendedInventoryItem = InventoryItem & {
  is_deactivated?: boolean;
};

// In-memory devData store hidden behind boundary
let medicinesStore: Medicine[] = [...initialMedicines];
let inventoryStore: ExtendedInventoryItem[] = [...initialInventoryItems];
let stockAdjustmentsStore: StockAdjustment[] = [...initialStockAdjustments];

function combineMedicineWithInventory(items: ExtendedInventoryItem[], medicines: Medicine[]): MedicineWithInventory[] {
  return items
    .filter((item) => !item.is_deactivated)
    .flatMap((item) => {
      const medicine = medicines.find((m) => m.id === item.medicine_id);
      if (!medicine) return [];
      return [{ ...item, medicine }];
    });
}

export const inventoryApi = {
  list: (includeDeactivated = false): MedicineWithInventory[] => {
    const itemsToCombine = includeDeactivated
      ? inventoryStore
      : inventoryStore.filter((item) => !item.is_deactivated);
    return combineMedicineWithInventory(itemsToCombine, medicinesStore);
  },

  listMedicines: (): Medicine[] => [...medicinesStore],

  listInventoryItems: (): InventoryItem[] => [...inventoryStore],

  listStockAdjustments: (): StockAdjustment[] => [...stockAdjustmentsStore],

  get: (id: string): MedicineWithInventory | null => {
    const item = inventoryStore.find((i) => i.id === id);
    if (!item) return null;
    const medicine = medicinesStore.find((m) => m.id === item.medicine_id);
    if (!medicine) return null;
    return { ...item, medicine };
  },

  getMedicine: (id: string): Medicine | null => {
    return medicinesStore.find((m) => m.id === id) || null;
  },

  getInventoryItem: (id: string): InventoryItem | null => {
    return inventoryStore.find((i) => i.id === id) || null;
  },

  create: (payload: AddStockPayload): MedicineWithInventory => {
    const medicineId = `med_dev_${Date.now()}`;
    const inventoryId = `inv_dev_${Date.now()}`;
    const now = new Date().toISOString();

    const newMedicine: Medicine = {
      id: medicineId,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: now,
      updated_at: now,
      name: payload.medicineName,
      generic_name: payload.genericName || null,
      category: payload.category,
      unit: payload.unit,
      is_controlled_substance: false,
      requires_prescription: false,
    };

    const newInventoryItem: ExtendedInventoryItem = {
      id: inventoryId,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: now,
      updated_at: now,
      medicine_id: medicineId,
      batch_number: payload.batchNumber,
      expiry_date: payload.expiryDate,
      buy_price: payload.buyPrice,
      sell_price: payload.sellPrice,
      quantity: payload.quantity,
      low_stock_threshold: payload.lowStockThreshold,
      cold_chain_required: false,
      is_deactivated: false,
    };

    medicinesStore = [newMedicine, ...medicinesStore];
    inventoryStore = [newInventoryItem, ...inventoryStore];

    // Log initial audit creation entry
    auditApi.recordEntry({
      action: 'stock_adjustment',
      performed_by_user_id: 'user_001',
      target_entity_type: 'InventoryItem',
      target_entity_id: inventoryId,
      metadata: {
        actionType: 'initial_stock_creation',
        quantity: payload.quantity,
        batchNumber: payload.batchNumber,
      },
    });

    return {
      ...newInventoryItem,
      medicine: newMedicine,
    };
  },

  update: (id: string, updates: UpdateStockPayload): MedicineWithInventory | null => {
    const index = inventoryStore.findIndex((i) => i.id === id);
    if (index === -1) return null;

    const existing = inventoryStore[index];
    const updatedItem: ExtendedInventoryItem = {
      ...existing,
      batch_number: updates.batchNumber ?? existing.batch_number,
      expiry_date: updates.expiryDate ?? existing.expiry_date,
      buy_price: updates.buyPrice ?? existing.buy_price,
      sell_price: updates.sellPrice ?? existing.sell_price,
      quantity: updates.quantity ?? existing.quantity,
      low_stock_threshold: updates.lowStockThreshold ?? existing.low_stock_threshold,
      updated_at: new Date().toISOString(),
    };

    inventoryStore[index] = updatedItem;
    const medicine = medicinesStore.find((m) => m.id === updatedItem.medicine_id);
    if (!medicine) return null;

    return { ...updatedItem, medicine };
  },

  recordStockAction: (payload: RecordStockActionPayload): RecordStockActionResult | null => {
    const index = inventoryStore.findIndex((i) => i.id === payload.inventoryItemId);
    if (index === -1) return null;

    const existing = inventoryStore[index];
    let computedDelta = 0;
    let newQty = existing.quantity;
    let isDeactivated = existing.is_deactivated || false;

    switch (payload.action) {
      case 'refill': {
        const amount = Math.abs(payload.quantityDelta ?? payload.newQuantity ?? 0);
        computedDelta = amount;
        newQty = existing.quantity + amount;
        break;
      }
      case 'damaged':
      case 'expired':
      case 'transferred': {
        const amount = Math.abs(payload.quantityDelta ?? 0);
        computedDelta = -amount;
        newQty = Math.max(0, existing.quantity - amount);
        break;
      }
      case 'disposed': {
        const amount = payload.quantityDelta !== undefined
          ? Math.abs(payload.quantityDelta)
          : existing.quantity;
        computedDelta = -amount;
        newQty = Math.max(0, existing.quantity - amount);
        break;
      }
      case 'deactivated': {
        computedDelta = -existing.quantity;
        newQty = 0;
        isDeactivated = true;
        break;
      }
      case 'adjustment':
      default: {
        if (payload.newQuantity !== undefined) {
          newQty = Math.max(0, payload.newQuantity);
          computedDelta = newQty - existing.quantity;
        } else {
          computedDelta = payload.quantityDelta ?? 0;
          newQty = Math.max(0, existing.quantity + computedDelta);
        }
        break;
      }
    }

    const updatedItem: ExtendedInventoryItem = {
      ...existing,
      quantity: newQty,
      is_deactivated: isDeactivated,
      updated_at: new Date().toISOString(),
    };

    inventoryStore[index] = updatedItem;

    const auditEntry = auditApi.recordEntry({
      action: 'stock_adjustment',
      performed_by_user_id: payload.authorizedByUserId || 'user_001',
      target_entity_type: 'InventoryItem',
      target_entity_id: existing.id,
      metadata: {
        actionType: payload.action,
        delta: computedDelta,
        previousQuantity: existing.quantity,
        newQuantity: newQty,
        reason: payload.reason,
        pinAuthorized: Boolean(payload.authorizedPin),
      },
    });

    const adjustment: StockAdjustment = {
      id: `adj_dev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      inventory_item_id: existing.id,
      adjusted_by_user_id: payload.authorizedByUserId || 'user_001',
      delta: computedDelta,
      reason: payload.reason || `Action: ${payload.action}`,
      audit_log_id: auditEntry.id,
    };

    stockAdjustmentsStore = [adjustment, ...stockAdjustmentsStore];

    const medicine = medicinesStore.find((m) => m.id === updatedItem.medicine_id);
    const combined: MedicineWithInventory = {
      ...updatedItem,
      medicine: medicine!,
    };

    return {
      inventoryItem: combined,
      adjustment,
      auditEntry,
    };
  },

  updateQuantity: (id: string, delta: number): InventoryItem | null => {
    const result = inventoryApi.recordStockAction({
      inventoryItemId: id,
      action: 'adjustment',
      quantityDelta: delta,
      reason: `Quick quantity adjustment (${delta > 0 ? '+' : ''}${delta})`,
    });
    return result ? result.inventoryItem : null;
  },

  // Semantically mark deactivated instead of destructive array removal
  delete: (id: string): boolean => {
    const result = inventoryApi.recordStockAction({
      inventoryItemId: id,
      action: 'deactivated',
      reason: 'Deactivated stock batch via UI',
    });
    return Boolean(result);
  },

  // Backwards compatibility aliases
  getMedicines: (): Medicine[] => inventoryApi.listMedicines(),
  getInventoryItems: (): InventoryItem[] => inventoryApi.listInventoryItems(),
  getMedicinesWithInventory: (): MedicineWithInventory[] => inventoryApi.list(),
  addStock: (payload: AddStockPayload): MedicineWithInventory => inventoryApi.create(payload),
  deleteItem: (id: string): void => {
    inventoryApi.delete(id);
  },
};

export const inventory = inventoryApi;
