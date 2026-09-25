import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Sale, Customer, MedicineWithInventory, SaleLine, FiscalReceipt } from '@40labs/types';
import { salesApi, CreateSalePayload, usersApi, inventoryApi } from '../api';
import { salesKeys, inventoryKeys, labKeys } from './queryKeys';

export interface CartItem {
  inventoryItem: MedicineWithInventory;
  quantity: number;
  unitPrice: number;
}

export function useSales() {
  const queryClient = useQueryClient();

  // Queries
  const {
    data: completedSales = [],
    isLoading: isLoadingSales,
  } = useQuery<Sale[]>({
    queryKey: salesKeys.list(),
    queryFn: async () => salesApi.list(),
  });

  const {
    data: fiscalReceipts = [],
  } = useQuery<FiscalReceipt[]>({
    queryKey: salesKeys.fiscalReceipts(),
    queryFn: async () => salesApi.listFiscalReceipts(),
  });

  const {
    data: users = [],
  } = useQuery({
    queryKey: labKeys.users(),
    queryFn: async () => usersApi.list(),
  });

  const {
    data: inventoryItems = [],
  } = useQuery<MedicineWithInventory[]>({
    queryKey: inventoryKeys.list(),
    queryFn: async () => inventoryApi.list(),
  });

  // Mutations
  const createSaleMutation = useMutation({
    mutationFn: async (payload: CreateSalePayload) => {
      return salesApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });

  // Ephemeral Cart state
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = React.useState<'cash' | 'mobile_money' | 'card' | 'credit'>('cash');
  const [discountAmount, setDiscountAmount] = React.useState<number>(0);

  const addToCart = React.useCallback((item: MedicineWithInventory) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((c) => c.inventoryItem.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      }
      return [
        ...prevCart,
        { inventoryItem: item, quantity: 1, unitPrice: item.sell_price },
      ];
    });
  }, []);

  const removeFromCart = React.useCallback((inventoryItemId: string) => {
    setCart((prevCart) => prevCart.filter((c) => c.inventoryItem.id !== inventoryItemId));
  }, []);

  const updateQuantity = React.useCallback((inventoryItemId: string, quantity: number) => {
    setCart((prevCart) =>
      prevCart
        .map((c) => (c.inventoryItem.id === inventoryItemId ? { ...c, quantity: Math.max(0, quantity) } : c))
        .filter((c) => c.quantity > 0)
    );
  }, []);

  const clearCart = React.useCallback(() => {
    setCart([]);
    setDiscountAmount(0);
    setSelectedCustomer(null);
  }, []);

  const checkout = React.useCallback(async () => {
    if (cart.length === 0) return null;

    const lines: Omit<SaleLine, 'id'>[] = cart.map((item) => ({
      inventory_item_id: item.inventoryItem.id,
      medicine_id: item.inventoryItem.medicine_id,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.quantity * item.unitPrice,
      dispensed_by_user_id: 'user_001',
      is_prescription_dispense: item.inventoryItem.medicine.requires_prescription,
    }));

    const payload: CreateSalePayload = {
      customerId: selectedCustomer ? selectedCustomer.id : null,
      lines,
      paymentMethod,
      discountAmount,
    };

    const newSale = await createSaleMutation.mutateAsync(payload);
    clearCart();
    return newSale;
  }, [cart, selectedCustomer, paymentMethod, discountAmount, createSaleMutation, clearCart]);

  return {
    completedSales,
    fiscalReceipts,
    inventoryItems,
    users,
    isLoading: isLoadingSales,

    // Cart state & actions
    cart,
    selectedCustomer,
    paymentMethod,
    discountAmount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setSelectedCustomer,
    setPaymentMethod,
    setDiscountAmount,

    // Mutation action
    checkout,
    isCreatingSale: createSaleMutation.isPending,
  };
}
