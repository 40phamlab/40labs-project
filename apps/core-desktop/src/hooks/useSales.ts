import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Sale, Customer, MedicineWithInventory, SaleLine, FiscalReceipt } from '@40labs/types';
import { salesApi, CreateSalePayload, usersApi, inventoryApi, customersApi } from '../api';
import { salesKeys, inventoryKeys, labKeys, customerKeys } from './queryKeys';

export interface CartItem {
  inventoryItem: MedicineWithInventory;
  quantity: number;
  unitPrice: number;
}

export interface HeldSale {
  id: string;
  heldAt: string;
  cart: CartItem[];
  customer: Customer | null;
  manualEntry?: { full_name: string; phone: string };
  paymentMethod: 'cash' | 'mobile_money' | 'card' | 'credit';
  discountAmount: number;
  total: number;
}

export interface ActionResult {
  success: boolean;
  message: string;
}

export interface CheckoutOptions {
  manualCustomer?: { full_name: string; phone: string };
  saveCustomer?: boolean;
}

export function useSales() {
  const queryClient = useQueryClient();

  // Queries
  const {
    data: completedSales = [],
    isLoading: isLoadingSales,
    isError: isSalesError,
    error: salesError,
    refetch: refetchSales,
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

  // Ephemeral Cart & Sales state
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = React.useState<'cash' | 'mobile_money' | 'card' | 'credit'>('cash');
  const [discountAmount, setDiscountAmount] = React.useState<number>(0);
  const [heldSales, setHeldSales] = React.useState<HeldSale[]>([]);

  const addToCart = React.useCallback((item: MedicineWithInventory, qtyToAdd = 1): ActionResult => {
    if (item.quantity <= 0) {
      return {
        success: false,
        message: `${item.medicine.name} is currently out of stock.`,
      };
    }

    let status: ActionResult = {
      success: true,
      message: `Added ${item.medicine.name} to cart.`,
    };

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((c) => c.inventoryItem.id === item.id);
      if (existingIndex > -1) {
        const currentQty = prevCart[existingIndex].quantity;
        const newQty = currentQty + qtyToAdd;
        if (newQty > item.quantity) {
          status = {
            success: false,
            message: `Cannot add more. Max available stock is ${item.quantity}.`,
          };
          return prevCart;
        }
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
        };
        return updated;
      }

      if (qtyToAdd > item.quantity) {
        status = {
          success: false,
          message: `Cannot add ${qtyToAdd} units. Max available stock is ${item.quantity}.`,
        };
        return prevCart;
      }

      return [
        ...prevCart,
        { inventoryItem: item, quantity: qtyToAdd, unitPrice: item.sell_price },
      ];
    });

    return status;
  }, []);

  const removeFromCart = React.useCallback((inventoryItemId: string) => {
    setCart((prevCart) => prevCart.filter((c) => c.inventoryItem.id !== inventoryItemId));
  }, []);

  const updateQuantity = React.useCallback((inventoryItemId: string, targetQuantity: number): ActionResult => {
    let status: ActionResult = { success: true, message: 'Quantity updated.' };

    setCart((prevCart) => {
      const existingItem = prevCart.find((c) => c.inventoryItem.id === inventoryItemId);
      if (!existingItem) return prevCart;

      if (targetQuantity > existingItem.inventoryItem.quantity) {
        status = {
          success: false,
          message: `Stock limit reached (${existingItem.inventoryItem.quantity} max).`,
        };
        return prevCart;
      }

      return prevCart
        .map((c) => (c.inventoryItem.id === inventoryItemId ? { ...c, quantity: Math.max(0, targetQuantity) } : c))
        .filter((c) => c.quantity > 0);
    });

    return status;
  }, []);

  const clearCart = React.useCallback(() => {
    setCart([]);
    setDiscountAmount(0);
    setSelectedCustomer(null);
  }, []);

  // Hold / Resume bill workflow
  const holdCurrentSale = React.useCallback((manualEntry?: { full_name: string; phone: string }): ActionResult => {
    if (cart.length === 0) {
      return { success: false, message: 'Cart is empty. Nothing to hold.' };
    }

    const subtotal = cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const grandTotal = Math.max(0, subtotal - discountAmount);

    const heldItem: HeldSale = {
      id: `held_${Date.now()}`,
      heldAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cart: [...cart],
      customer: selectedCustomer,
      manualEntry,
      paymentMethod,
      discountAmount,
      total: grandTotal,
    };

    setHeldSales((prev) => [heldItem, ...prev]);
    clearCart();

    return { success: true, message: 'Sale held successfully.' };
  }, [cart, selectedCustomer, paymentMethod, discountAmount, clearCart]);

  const resumeHeldSale = React.useCallback((heldId: string) => {
    const target = heldSales.find((h) => h.id === heldId);
    if (!target) return;

    setCart(target.cart);
    setSelectedCustomer(target.customer);
    setPaymentMethod(target.paymentMethod);
    setDiscountAmount(target.discountAmount);
    setHeldSales((prev) => prev.filter((h) => h.id !== heldId));
  }, [heldSales]);

  const deleteHeldSale = React.useCallback((heldId: string) => {
    setHeldSales((prev) => prev.filter((h) => h.id !== heldId));
  }, []);

  const checkout = React.useCallback(async (options?: CheckoutOptions) => {
    if (cart.length === 0) return null;

    let customerIdToUse: string | null = selectedCustomer ? selectedCustomer.id : null;

    // Persist new customer if saveCustomer is true and manual entry is present
    if (options?.saveCustomer && !selectedCustomer && options?.manualCustomer?.full_name?.trim()) {
      try {
        const newCust = await customersApi.create({
          fullName: options.manualCustomer.full_name.trim(),
          phone: options.manualCustomer.phone?.trim() || '',
          email: '',
        });
        customerIdToUse = newCust.id;
        queryClient.invalidateQueries({ queryKey: customerKeys.all });
      } catch (e) {
        console.error('Failed to auto-save customer', e);
      }
    }

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
      customerId: customerIdToUse,
      lines,
      paymentMethod,
      discountAmount,
    };

    const newSale = await createSaleMutation.mutateAsync(payload);
    clearCart();
    return newSale;
  }, [cart, selectedCustomer, paymentMethod, discountAmount, createSaleMutation, clearCart, queryClient]);

  return {
    completedSales,
    fiscalReceipts,
    inventoryItems,
    users,
    isLoading: isLoadingSales,
    isError: isSalesError,
    error: salesError,
    refetchSales,

    // Cart state & setters
    cart,
    selectedCustomer,
    paymentMethod,
    discountAmount,
    heldSales,

    // Cart actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setSelectedCustomer,
    setPaymentMethod,
    setDiscountAmount,
    holdCurrentSale,
    resumeHeldSale,
    deleteHeldSale,

    // Checkout mutation
    checkout,
    isCreatingSale: createSaleMutation.isPending,
  };
}
