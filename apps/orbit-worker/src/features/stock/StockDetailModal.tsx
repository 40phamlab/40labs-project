// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { colors, radius } from '@40labs/design-tokens';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StockItem } from './types';

interface StockDetailModalProps {
  visible: boolean;
  item: StockItem | null;
  onClose: () => void;
}

export function StockDetailModal({ visible, item, onClose }: StockDetailModalProps) {
  if (!visible || !item) return null;

  const isLowStock = item.inventoryItem.quantity <= item.inventoryItem.lowStockThreshold;

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderSubtle }]}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="medical" size={20} color={colors.actionPrimary} style={styles.headerIcon} />
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Stock Item Details</Text>
            </View>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <Text style={[styles.medicineName, { color: colors.textPrimary }]}>{item.medicine.name}</Text>
            {item.medicine.genericName && (
              <Text style={[styles.genericName, { color: colors.textMuted }]}>{item.medicine.genericName}</Text>
            )}

            <View style={[styles.statusBox, { backgroundColor: isLowStock ? 'rgba(239, 68, 68, 0.1)' : colors.surfaceSecondary, borderColor: isLowStock ? colors.danger : colors.borderSubtle }]}>
              <Text style={[styles.statusText, { color: isLowStock ? colors.danger : colors.textPrimary }]}>
                Current Quantity: {item.inventoryItem.quantity} {item.medicine.unit} {isLowStock ? '(Low Stock)' : ''}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Batch & Expiry</Text>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Batch Number</Text>
                <Text style={[styles.value, { color: colors.textPrimary }]}>{item.inventoryItem.batchNumber}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Expiry Date</Text>
                <Text style={[styles.value, { color: colors.textPrimary }]}>{item.inventoryItem.expiryDate}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Pricing & Category</Text>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
                <Text style={[styles.value, { color: colors.textPrimary }]}>{item.medicine.category}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Unit</Text>
                <Text style={[styles.value, { color: colors.textPrimary }]}>{item.medicine.unit}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Buy Price</Text>
                <Text style={[styles.value, { color: colors.textPrimary }]}>TZS {item.inventoryItem.buyPrice.toLocaleString()}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Sell Price</Text>
                <Text style={[styles.value, { color: colors.textPrimary }]}>TZS {item.inventoryItem.sellPrice.toLocaleString()}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Low Stock Threshold</Text>
                <Text style={[styles.value, { color: colors.textPrimary }]}>{item.inventoryItem.lowStockThreshold}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle }]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: colors.textPrimary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    borderRadius: radius.card,
    borderWidth: 1,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: 'Sora_600SemiBold',
  },
  content: {
    padding: 20,
  },
  medicineName: {
    fontSize: 20,
    fontFamily: 'Sora_600SemiBold',
    marginBottom: 4,
  },
  genericName: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 16,
  },
  statusBox: {
    padding: 12,
    borderRadius: radius.card,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Sora_600SemiBold',
    marginBottom: 10,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  value: {
    fontSize: 13,
    fontFamily: 'JetBrainsMono_500Medium',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  button: {
    paddingVertical: 12,
    borderRadius: radius.card,
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
