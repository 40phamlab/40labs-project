// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#pos]
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../ui/Text';
import { StatusPill } from '../../ui/StatusPill';
import { radius } from '../../theme/rn-tokens';
import { StockItem } from '../stock/types';

interface ProductRowProps {
  item: StockItem;
  onAddToCart: () => void;
}

export function ProductRow({ item, onAddToCart }: ProductRowProps) {
  const { colors } = useTheme();
  const qty = item.inventoryItem.quantity;
  const isOutOfStock = qty <= 0;

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: isOutOfStock ? colors.surfaceDisabled : colors.surfacePrimary,
          borderColor: colors.borderSubtle,
          borderRadius: radius.card,
        },
      ]}
    >
      <View style={styles.info}>
        <Text variant="heading" style={styles.name} numberOfLines={1}>
          {item.medicine.name}
        </Text>
        <Text style={[styles.generic, { color: colors.textMuted }]} numberOfLines={1}>
          {item.medicine.genericName || item.medicine.category}
        </Text>
        <View style={styles.metaRow}>
          {isOutOfStock ? (
            <StatusPill status="danger" label="Zero Stock" />
          ) : (
            <StatusPill status="success" label={`Qty: ${qty}`} />
          )}
          <Text variant="mono" style={[styles.price, { color: colors.actionPrimary }]}>
            TZS {item.inventoryItem.sellPrice.toLocaleString()}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.addButton,
          {
            backgroundColor: isOutOfStock ? colors.surfaceDisabled : colors.actionPrimary,
            borderRadius: radius.card,
          },
        ]}
        disabled={isOutOfStock}
        onPress={onAddToCart}
        accessibilityRole="button"
        accessibilityLabel={`Add ${item.medicine.name} to cart`}
      >
        <Ionicons name="add" size={24} color={isOutOfStock ? colors.textDisabled : '#fff'} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 14,
    marginBottom: 2,
  },
  generic: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  price: {
    fontSize: 13,
  },
  addButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
