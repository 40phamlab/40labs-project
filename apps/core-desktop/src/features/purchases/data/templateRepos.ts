// [PHASE: marketplace-preview — Data foundation]
import { Supplier, CatalogProduct, SupplierCart, CartLine, PurchaseOrder, PurchaseOrderStatus } from '@40labs/types';
import { SupplierRepo, CatalogRepo, CartRepo, OrderRepo } from './repos';
import { SEED_SUPPLIERS, SEED_CATALOG_PRODUCTS } from './seed';

let suppliersStore: Supplier[] = [...SEED_SUPPLIERS];
let catalogStore: CatalogProduct[] = [...SEED_CATALOG_PRODUCTS];
const followedSet = new Set<string>(['AFYA-DAR01', 'AFYA-ARU01']);
const cartsMap = new Map<string, SupplierCart>();
let ordersStore: PurchaseOrder[] = [
  {
    id: 'po_dar_001',
    buyerBusinessId: 'AFYA-MYPHARMACY',
    sellerBusinessId: 'AFYA-DAR01',
    status: 'sent',
    lines: [
      { productId: 'prod_dar01_1', qty: 5, unitPriceTzsSnapshot: 2000, name: 'Paracetamol 500mg BP (Pack of 100)' },
    ],
    totalTzs: 10000,
    channel: 'whatsapp',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    sentAt: new Date(Date.now() - 3600000 * 23).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 23).toISOString(),
  },
  {
    id: 'po_dar_002',
    buyerBusinessId: 'AFYA-MYPHARMACY',
    sellerBusinessId: 'AFYA-DAR01',
    status: 'completed',
    lines: [
      { productId: 'prod_dar01_2', qty: 10, unitPriceTzsSnapshot: 1500, name: 'Amoxicillin 250mg Capsules' },
      { productId: 'prod_dar01_3', qty: 3, unitPriceTzsSnapshot: 5000, name: 'Ibuprofen 400mg Tablets' },
    ],
    totalTzs: 30000,
    channel: 'whatsapp',
    createdAt: new Date(Date.now() - 3600000 * 96).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
  {
    id: 'po_dar_003',
    buyerBusinessId: 'AFYA-MYPHARMACY',
    sellerBusinessId: 'AFYA-DAR01',
    status: 'confirmed',
    lines: [
      { productId: 'prod_dar01_1', qty: 2, unitPriceTzsSnapshot: 2000, name: 'Paracetamol 500mg BP (Pack of 100)' },
    ],
    totalTzs: 4000,
    channel: 'whatsapp',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: 'po_dar_004',
    buyerBusinessId: 'AFYA-MYPHARMACY',
    sellerBusinessId: 'AFYA-DAR01',
    status: 'draft',
    lines: [
      { productId: 'prod_dar01_3', qty: 4, unitPriceTzsSnapshot: 5000, name: 'Ibuprofen 400mg Tablets' },
    ],
    totalTzs: 20000,
    channel: 'whatsapp',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'po_aru_001',
    buyerBusinessId: 'AFYA-MYPHARMACY',
    sellerBusinessId: 'AFYA-ARU01',
    status: 'completed',
    lines: [
      { productId: 'prod_aru01_3', qty: 2, unitPriceTzsSnapshot: 12000, name: 'ORS Electrolyte Sachets (Box of 50)' },
    ],
    totalTzs: 24000,
    channel: 'inapp',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'po_aru_002',
    buyerBusinessId: 'AFYA-MYPHARMACY',
    sellerBusinessId: 'AFYA-ARU01',
    status: 'sent',
    lines: [
      { productId: 'prod_aru01_1', qty: 6, unitPriceTzsSnapshot: 3000, name: 'Artemether-Lumefantrine (Coartem)' },
    ],
    totalTzs: 18000,
    channel: 'whatsapp',
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    sentAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
  },
  {
    id: 'po_aru_003',
    buyerBusinessId: 'AFYA-MYPHARMACY',
    sellerBusinessId: 'AFYA-ARU01',
    status: 'confirmed',
    lines: [
      { productId: 'prod_aru01_2', qty: 1, unitPriceTzsSnapshot: 25000, name: 'Amoxicillin Dispersible Tablets' },
    ],
    totalTzs: 25000,
    channel: 'whatsapp',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

export const templateSupplierRepo: SupplierRepo = {
  async list(): Promise<Supplier[]> {
    return [...suppliersStore];
  },
  async get(businessId: string): Promise<Supplier | null> {
    return suppliersStore.find((s) => s.businessId === businessId) || null;
  },
  async search(q: string): Promise<Supplier[]> {
    const query = q.toLowerCase();
    return suppliersStore.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.businessId.toLowerCase().includes(query) ||
        s.location.city.toLowerCase().includes(query) ||
        s.location.region.toLowerCase().includes(query)
    );
  },
  async follow(supplierBusinessId: string): Promise<void> {
    followedSet.add(supplierBusinessId);
  },
  async unfollow(supplierBusinessId: string): Promise<void> {
    followedSet.delete(supplierBusinessId);
  },
  async listFollowed(): Promise<Supplier[]> {
    return suppliersStore.filter((s) => followedSet.has(s.businessId));
  },
};

export const templateCatalogRepo: CatalogRepo = {
  async searchProducts(q: string, opts?: { supplierId?: string }): Promise<CatalogProduct[]> {
    const query = q.toLowerCase();
    return catalogStore.filter((p) => {
      if (opts?.supplierId && p.supplierBusinessId !== opts.supplierId) return false;
      return (
        p.name.toLowerCase().includes(query) ||
        p.genericName.toLowerCase().includes(query) ||
        p.form.toLowerCase().includes(query)
      );
    });
  },
  async listBySupplier(supplierBusinessId: string): Promise<CatalogProduct[]> {
    return catalogStore.filter((p) => p.supplierBusinessId === supplierBusinessId);
  },
  async findAlternatives(medicineKey: string, excludeSupplierId: string): Promise<CatalogProduct[]> {
    const matching = catalogStore.filter(
      (p) => p.medicineKey === medicineKey && p.supplierBusinessId !== excludeSupplierId && p.stock !== 'out'
    );

    return matching.sort((a, b) => {
      const aFollowed = followedSet.has(a.supplierBusinessId) ? 1 : 0;
      const bFollowed = followedSet.has(b.supplierBusinessId) ? 1 : 0;
      if (aFollowed !== bFollowed) return bFollowed - aFollowed;

      const aSup = suppliersStore.find((s) => s.businessId === a.supplierBusinessId);
      const bSup = suppliersStore.find((s) => s.businessId === b.supplierBusinessId);

      const aVerified = aSup?.verification.verified40Labs ? 1 : 0;
      const bVerified = bSup?.verification.verified40Labs ? 1 : 0;
      if (aVerified !== bVerified) return bVerified - aVerified;

      return a.unitPriceTzs - b.unitPriceTzs;
    });
  },
};

export const templateCartRepo: CartRepo = {
  async getCart(supplierBusinessId: string): Promise<SupplierCart> {
    if (!cartsMap.has(supplierBusinessId)) {
      cartsMap.set(supplierBusinessId, {
        id: `cart_${supplierBusinessId}`,
        supplierBusinessId,
        lines: [],
      });
    }
    return cartsMap.get(supplierBusinessId)!;
  },
  async upsertLine(supplierBusinessId: string, line: CartLine): Promise<SupplierCart> {
    const cart = await this.getCart(supplierBusinessId);
    const index = cart.lines.findIndex((l) => l.productId === line.productId);
    if (index >= 0) {
      if (line.qty <= 0) {
        cart.lines.splice(index, 1);
      } else {
        cart.lines[index] = line;
      }
    } else if (line.qty > 0) {
      cart.lines.push(line);
    }
    cartsMap.set(supplierBusinessId, cart);
    return cart;
  },
  async removeLine(supplierBusinessId: string, productId: string): Promise<SupplierCart> {
    const cart = await this.getCart(supplierBusinessId);
    cart.lines = cart.lines.filter((l) => l.productId !== productId);
    cartsMap.set(supplierBusinessId, cart);
    return cart;
  },
  async clear(supplierBusinessId: string): Promise<void> {
    cartsMap.set(supplierBusinessId, {
      id: `cart_${supplierBusinessId}`,
      supplierBusinessId,
      lines: [],
    });
  },
};

export const templateOrderRepo: OrderRepo = {
  async createDraft(supplierBusinessId: string, cart: SupplierCart, channel: 'whatsapp' | 'inapp' | 'cloud' = 'whatsapp'): Promise<PurchaseOrder> {
    const totalTzs = cart.lines.reduce((sum, l) => sum + l.qty * l.unitPriceTzsSnapshot, 0);
    const now = new Date().toISOString();
    const newOrder: PurchaseOrder = {
      id: `po_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`,
      buyerBusinessId: 'AFYA-MYPHARMACY',
      sellerBusinessId: supplierBusinessId,
      status: 'draft',
      lines: cart.lines.map((l) => {
        const prod = catalogStore.find((cp) => cp.id === l.productId);
        return {
          productId: l.productId,
          qty: l.qty,
          unitPriceTzsSnapshot: l.unitPriceTzsSnapshot,
          name: prod?.name,
        };
      }),
      totalTzs,
      channel,
      createdAt: now,
      updatedAt: now,
    };

    ordersStore.unshift(newOrder);
    return newOrder;
  },
  async listByStatus(status: PurchaseOrderStatus | 'pending' | 'recently'): Promise<PurchaseOrder[]> {
    if (status === 'pending') {
      return ordersStore.filter((o) => o.status === 'draft' || o.status === 'sent' || o.status === 'confirmed');
    }
    if (status === 'recently') {
      return [...ordersStore]
        .filter((o) => o.status !== 'draft')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    return ordersStore.filter((o) => o.status === status);
  },
  async listBySupplier(supplierBusinessId: string): Promise<PurchaseOrder[]> {
    return ordersStore.filter((o) => o.sellerBusinessId === supplierBusinessId);
  },
  async markStatus(orderId: string, status: PurchaseOrderStatus): Promise<PurchaseOrder> {
    const index = ordersStore.findIndex((o) => o.id === orderId);
    if (index === -1) throw new Error(`Order ${orderId} not found`);
    const now = new Date().toISOString();
    const updated: PurchaseOrder = {
      ...ordersStore[index],
      status,
      sentAt: status === 'sent' && !ordersStore[index].sentAt ? now : ordersStore[index].sentAt,
      updatedAt: now,
    };
    ordersStore[index] = updated;
    return updated;
  },
};
