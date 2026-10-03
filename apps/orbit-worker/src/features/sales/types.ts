// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]

export interface CartItem {
  inventoryItemId: string;
  medicineName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface SaleResponse {
  id: string;
  workspaceId: string;
  branchId: string;
  createdAt: string;
  updatedAt: string;
  customerId?: string | null;
  lines: {
    id: string;
    saleId: string;
    inventoryItemId: string;
    medicineName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  paymentMethod: string;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  currency: string;
}
