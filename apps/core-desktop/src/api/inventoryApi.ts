import type { Medicine, InventoryItem, MedicineWithInventory } from '@40labs/types';
import { initialMedicines, initialInventoryItems, WORKSPACE_ID, BRANCH_ID } from '../devData';

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

// Dev state for inventory API
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
  getMedicines: (): Medicine[] => [...medicinesStore],

  getInventoryItems: (): InventoryItem[] => [...inventoryStore],

  getMedicinesWithInventory: (): MedicineWithInventory[] => {
    return combineMedicineWithInventory(inventoryStore, medicinesStore);
  },

  addStock: (payload: AddStockPayload): MedicineWithInventory => {
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

  deleteItem: (id: string): void => {
    inventoryStore = inventoryStore.filter((item) => item.id !== id);
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
};
