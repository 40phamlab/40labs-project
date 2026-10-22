// [PHASE: marketplace-preview — Data foundation]
import { Supplier, CatalogProduct, SupplierCart, CartLine, PurchaseOrder, PurchaseOrderStatus } from '@40labs/types';

export interface SupplierRepo {
  list(): Promise<Supplier[]>;
  get(businessId: string): Promise<Supplier | null>;
  search(q: string): Promise<Supplier[]>;
  follow(supplierBusinessId: string): Promise<void>;
  unfollow(supplierBusinessId: string): Promise<void>;
  listFollowed(): Promise<Supplier[]>;
}

export interface CatalogRepo {
  searchProducts(q: string, opts?: { supplierId?: string }): Promise<CatalogProduct[]>;
  listBySupplier(supplierBusinessId: string): Promise<CatalogProduct[]>;
  findAlternatives(medicineKey: string, excludeSupplierId: string): Promise<CatalogProduct[]>;
}

export interface CartRepo {
  getCart(supplierBusinessId: string): Promise<SupplierCart>;
  upsertLine(supplierBusinessId: string, line: CartLine): Promise<SupplierCart>;
  removeLine(supplierBusinessId: string, productId: string): Promise<SupplierCart>;
  clear(supplierBusinessId: string): Promise<void>;
}

export interface OrderRepo {
  createDraft(supplierBusinessId: string, cart: SupplierCart, channel?: 'whatsapp' | 'inapp' | 'cloud'): Promise<PurchaseOrder>;
  listByStatus(status: PurchaseOrderStatus | 'pending' | 'recently'): Promise<PurchaseOrder[]>;
  listBySupplier(supplierBusinessId: string): Promise<PurchaseOrder[]>;
  markStatus(orderId: string, status: PurchaseOrderStatus): Promise<PurchaseOrder>;
}
