// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius } from '@40labs/design-tokens';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StockItem } from './types';

interface StockCardProps {
  item: StockItem;
  onPress: () => void;
}

export function StockCard({ item, onPress }: StockCardProps) {
  const isLowStock = item.inventoryItem.quantity <= item.inventoryItem.lowStockThreshold;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surfacePrimary,
          borderColor: isLowStock ? colors.danger : colors.borderSubtle,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.medicine.name}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Ionicons name="medical-outline" size={18} color={colors.actionPrimary} style={styles.icon} />
          <Text style={[styles.nameText, { color: colors.textPrimary }]}>{item.medicine.name}</Text>
        </View>
        <View style={[styles.qtyBadge, { backgroundColor: isLowStock ? 'rgba(239, 68, 68, 0.1)' : colors.surfaceSecondary }]}>
          <Text style={[styles.qtyText, { color: isLowStock ? colors.danger : colors.textPrimary }]}>
            {item.inventoryItem.quantity} {item.medicine.unit}
          </Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
          Batch: <Text style={{ color: colors.textPrimary }}>{item.inventoryItem.batchNumber}</Text>
        </Text>
        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
          Expiry: <Text style={{ color: colors.textPrimary }}>{item.inventoryItem.expiryDate}</Text>
        </Text>
      </View>
      <View style={styles.detailsRow}>
        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
          Category: <Text style={{ color: colors.textPrimary }}>{item.medicine.category}</Text>
        </Text>
        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
          Price: <Text style={{ color: colors.textPrimary }}>TZS {item.inventoryItem.sellPrice.toLocaleString()}</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: radius.card,
    borderWidth: 1,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  icon: {
    marginRight: 8,
  },
  nameText: {
    fontSize: 16,
    fontFamily: 'Sora_600SemiBold',
    flex: 1,
  },
  qtyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.card,
  },
  qtyText: {
    fontSize: 13,
    fontFamily: 'JetBrainsMono_500Medium',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
