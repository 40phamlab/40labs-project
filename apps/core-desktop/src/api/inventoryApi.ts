import type { Medicine, InventoryItem, MedicineWithInventory } from '@40labs/types';
import { initialMedicines, initialInventoryItems, WORKSPACE_ID, BRANCH_ID } from '../devData/index.ts';

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

// In-memory devData store hidden behind boundary
let medicinesStore: Medicine[] = [...initialMedicines];
let inventoryStore: InventoryItem[] = [...initialInventoryItems];

function combineMedicineWithInventory(items: InventoryItem[], medicines: Medicine[]): MedicineWithInventory[] {
  return items.flatMap((item) => {
    const medicine = medicines.find((m) => m.id === item.medicine_id);
    if (!medicine) return [];
    return [{ ...item, medicine }];
  });
}

export const inventoryApi = {
  list: (): MedicineWithInventory[] => {
    return combineMedicineWithInventory(inventoryStore, medicinesStore);
  },

  listMedicines: (): Medicine[] => [...medicinesStore],

  listInventoryItems: (): InventoryItem[] => [...inventoryStore],

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

    const newInventoryItem: InventoryItem = {
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
    };

    medicinesStore = [newMedicine, ...medicinesStore];
    inventoryStore = [newInventoryItem, ...inventoryStore];

    return {
      ...newInventoryItem,
      medicine: newMedicine,
    };
  },

  update: (id: string, updates: UpdateStockPayload): MedicineWithInventory | null => {
    const index = inventoryStore.findIndex((i) => i.id === id);
    if (index === -1) return null;

    const existing = inventoryStore[index];
    const updatedItem: InventoryItem = {
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

  updateQuantity: (id: string, delta: number): InventoryItem | null => {
    const index = inventoryStore.findIndex((i) => i.id === id);
    if (index === -1) return null;

    const existing = inventoryStore[index];
    const updatedQty = Math.max(0, existing.quantity + delta);
    const updatedItem: InventoryItem = {
      ...existing,
      quantity: updatedQty,
      updated_at: new Date().toISOString(),
    };

    inventoryStore[index] = updatedItem;
    return updatedItem;
  },

  delete: (id: string): boolean => {
    const initialLen = inventoryStore.length;
    inventoryStore = inventoryStore.filter((item) => item.id !== id);
    return inventoryStore.length < initialLen;
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
