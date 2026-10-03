// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]

export interface MedicineInfo {
  id: string;
  name: string;
  genericName?: string | null;
  category: string;
  unit: string;
}

export interface InventoryItemInfo {
  id: string;
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  lowStockThreshold: number;
  isDeactivated: boolean;
  createdAt: string;
}

export interface StockItem {
  inventoryItem: InventoryItemInfo;
  medicine: MedicineInfo;
}
