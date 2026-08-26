import { useQuery } from '@tanstack/react-query';
import type { Medicine, InventoryItem, StockAdjustment } from '@40labs/types';
import { mockMedicines, mockInventoryItems } from '../../lib/mockData';

/**
 * Joined shape for UI components to avoid multiple lookups.
 */
export interface InventoryItemWithMedicine extends InventoryItem {
  medicine: Medicine;
}

/**
 * Hook to fetch all inventory items joined with their medicine details.
 */
export const useInventoryList = () => {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async (): Promise<InventoryItemWithMedicine[]> => {
      return mockInventoryItems.map((item) => {
        const medicine = mockMedicines.find((m) => m.id === item.medicine_id);
        if (!medicine) {
          throw new Error(`Medicine not found for inventory item ${item.id}`);
        }
        return {
          ...item,
          medicine,
        };
      });
    },
  });
};

/**
 * Hook to fetch a single inventory item by ID, joined with its medicine details.
 */
export const useInventoryItem = (id: string | undefined) => {
  return useQuery({
    queryKey: ['inventory', id],
    queryFn: async (): Promise<InventoryItemWithMedicine | null> => {
      if (!id) return null;
      const item = mockInventoryItems.find((i) => i.id === id);
      if (!item) return null;

      const medicine = mockMedicines.find((m) => m.id === item.medicine_id);
      if (!medicine) {
        throw new Error(`Medicine not found for inventory item ${item.id}`);
      }

      return {
        ...item,
        medicine,
      };
    },
    enabled: !!id,
  });
};

/**
 * Hook to fetch items where quantity is at or below the low stock threshold.
 */
export const useLowStockItems = () => {
  return useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: async (): Promise<InventoryItemWithMedicine[]> => {
      return mockInventoryItems
        .filter((item) => item.quantity <= item.low_stock_threshold)
        .map((item) => {
          const medicine = mockMedicines.find((m) => m.id === item.medicine_id);
          if (!medicine) {
            throw new Error(`Medicine not found for inventory item ${item.id}`);
          }
          return {
            ...item,
            medicine,
          };
        });
    },
  });
};

/**
 * Hook to fetch items that have passed their expiry date.
 */
export const useExpiredItems = () => {
  return useQuery({
    queryKey: ['inventory', 'expired'],
    queryFn: async (): Promise<InventoryItemWithMedicine[]> => {
      const now = new Date();
      return mockInventoryItems
        .filter((item) => new Date(item.expiry_date) < now)
        .map((item) => {
          const medicine = mockMedicines.find((m) => m.id === item.medicine_id);
          if (!medicine) {
            throw new Error(`Medicine not found for inventory item ${item.id}`);
          }
          return {
            ...item,
            medicine,
          };
        });
    },
  });
};
