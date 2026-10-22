// [PHASE: marketplace-preview — Purchases shell]
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Supplier, CatalogProduct, SupplierCart, CartLine, PurchaseOrder, PurchaseOrderStatus } from '@40labs/types';
import { templateSupplierRepo, templateCatalogRepo, templateCartRepo, templateOrderRepo } from '../data/templateRepos';

export const marketplaceQueryKeys = {
  all: ['marketplace'] as const,
  suppliers: () => [...marketplaceQueryKeys.all, 'suppliers'] as const,
  followedSuppliers: () => [...marketplaceQueryKeys.all, 'suppliers', 'followed'] as const,
  supplier: (id: string) => [...marketplaceQueryKeys.all, 'supplier', id] as const,
  catalog: (supplierId?: string) => [...marketplaceQueryKeys.all, 'catalog', supplierId || 'all'] as const,
  cart: (supplierId: string) => [...marketplaceQueryKeys.all, 'cart', supplierId] as const,
  orders: (status?: string) => [...marketplaceQueryKeys.all, 'orders', status || 'all'] as const,
};

export function useSuppliersQuery(search?: string) {
  return useQuery<Supplier[]>({
    queryKey: [...marketplaceQueryKeys.suppliers(), search || ''],
    queryFn: async () => {
      if (search) {
        return templateSupplierRepo.search(search);
      }
      return templateSupplierRepo.list();
    },
    staleTime: 60_000,
  });
}

export function useFollowedSuppliersQuery() {
  return useQuery<Supplier[]>({
    queryKey: marketplaceQueryKeys.followedSuppliers(),
    queryFn: async () => templateSupplierRepo.listFollowed(),
    staleTime: 60_000,
  });
}

export function useCatalogQuery(search?: string, supplierId?: string) {
  return useQuery<CatalogProduct[]>({
    queryKey: [...marketplaceQueryKeys.catalog(supplierId), search || ''],
    queryFn: async () => {
      if (search) {
        return templateCatalogRepo.searchProducts(search, { supplierId });
      }
      if (supplierId) {
        return templateCatalogRepo.listBySupplier(supplierId);
      }
      return templateCatalogRepo.searchProducts('');
    },
    staleTime: 60_000,
  });
}

export function useCartQuery(supplierId: string) {
  return useQuery<SupplierCart>({
    queryKey: marketplaceQueryKeys.cart(supplierId),
    queryFn: async () => templateCartRepo.getCart(supplierId),
    staleTime: 10_000,
  });
}

export function useAllCartsQuery(suppliers: Supplier[]) {
  return useQuery<{ supplier: Supplier; count: number; totalTzs: number }[]>({
    queryKey: [...marketplaceQueryKeys.all, 'all-carts', suppliers.map((s) => s.businessId).join(',')],
    queryFn: async () => {
      const results: { supplier: Supplier; count: number; totalTzs: number }[] = [];
      for (const sup of suppliers) {
        const cart = await templateCartRepo.getCart(sup.businessId);
        const count = cart.lines.reduce((sum, l) => sum + l.qty, 0);
        if (count > 0) {
          const totalTzs = cart.lines.reduce((sum, l) => sum + l.qty * l.unitPriceTzsSnapshot, 0);
          results.push({ supplier: sup, count, totalTzs });
        }
      }
      return results;
    },
    staleTime: 5_000,
  });
}

export function useOrdersQuery(status?: PurchaseOrderStatus | 'pending' | 'recently') {
  return useQuery<PurchaseOrder[]>({
    queryKey: marketplaceQueryKeys.orders(status),
    queryFn: async () => templateOrderRepo.listByStatus(status || 'recently'),
    staleTime: 30_000,
  });
}

export function useMarketplaceMutations() {
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: async ({ supplierId, follow }: { supplierId: string; follow: boolean }) => {
      if (follow) await templateSupplierRepo.follow(supplierId);
      else await templateSupplierRepo.unfollow(supplierId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.all });
    },
  });

  const updateCartMutation = useMutation({
    mutationFn: async ({ supplierId, line }: { supplierId: string; line: CartLine }) => {
      return templateCartRepo.upsertLine(supplierId, line);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.cart(variables.supplierId) });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async ({ supplierId, cart, channel }: { supplierId: string; cart: SupplierCart; channel?: 'whatsapp' | 'inapp' | 'cloud' }) => {
      const order = await templateOrderRepo.createDraft(supplierId, cart, channel);
      await templateCartRepo.clear(supplierId);
      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.all });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: PurchaseOrderStatus }) => {
      return templateOrderRepo.markStatus(orderId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.all });
    },
  });

  return {
    toggleFollow: (supplierId: string, follow: boolean) => followMutation.mutateAsync({ supplierId, follow }),
    updateCart: (supplierId: string, line: CartLine) => updateCartMutation.mutateAsync({ supplierId, line }),
    createOrder: (supplierId: string, cart: SupplierCart, channel?: 'whatsapp' | 'inapp' | 'cloud') =>
      createOrderMutation.mutateAsync({ supplierId, cart, channel }),
    updateOrderStatus: (orderId: string, status: PurchaseOrderStatus) =>
      updateOrderStatusMutation.mutateAsync({ orderId, status }),
  };
}
