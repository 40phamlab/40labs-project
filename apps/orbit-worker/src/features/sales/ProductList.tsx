// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#pos]
import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { ProductRow } from './ProductRow';
import { StockItem } from '../stock/types';
import { EmptyState } from '../../ui/EmptyState';

interface ProductListProps {
  items: StockItem[];
  onAddToCart: (item: StockItem) => void;
  loading?: boolean;
}

export function ProductList({ items, onAddToCart, loading }: ProductListProps) {
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.inventoryItem.id}
      renderItem={({ item }) => (
        <ProductRow item={item} onAddToCart={() => onAddToCart(item)} />
      )}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        !loading ? <EmptyState title="No products found" icon="medical-outline" /> : null
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
  },
});
