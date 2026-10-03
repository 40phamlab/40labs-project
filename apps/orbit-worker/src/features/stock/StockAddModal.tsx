// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { colors, radius } from '@40labs/design-tokens';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { enqueueStockReceipt } from './api';

interface StockAddModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StockAddModal({ visible, onClose, onSuccess }: StockAddModalProps) {
  const [medicineName, setMedicineName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [category, setCategory] = useState('Tablets');
  const [unit, setUnit] = useState('pcs');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [saving, setSaving] = useState(false);

  if (!visible) return null;

  const handleSave = async () => {
    if (!medicineName.trim() || !batchNumber.trim() || !expiryDate.trim() || !buyPrice || !sellPrice || !quantity) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    const buy = Number(buyPrice);
    const sell = Number(sellPrice);
    const qty = Number(quantity);
    const threshold = Number(lowStockThreshold) || 5;

    if (isNaN(buy) || isNaN(sell) || isNaN(qty)) {
      Alert.alert('Error', 'Prices and quantity must be valid numbers.');
      return;
    }

    setSaving(true);
    try {
      await enqueueStockReceipt({
        medicineName: medicineName.trim(),
        genericName: genericName.trim() ? genericName.trim() : null,
        category: category.trim() || 'General',
        unit: unit.trim() || 'pcs',
        batchNumber: batchNumber.trim(),
        expiryDate: expiryDate.trim(),
        buyPrice: buy,
        sellPrice: sell,
        quantity: qty,
        lowStockThreshold: threshold,
      });

      Alert.alert('Success', 'Stock receipt queued in outbox for synchronization.');
      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to queue stock receipt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderSubtle }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Receive Stock (Add Stock)</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Medicine Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                placeholder="e.g. Paracetamol"
                placeholderTextColor={colors.textMuted}
                value={medicineName}
                onChangeText={setMedicineName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Generic Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                placeholder="e.g. Acetaminophen"
                placeholderTextColor={colors.textMuted}
                value={genericName}
                onChangeText={setGenericName}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                  placeholder="Tablets"
                  placeholderTextColor={colors.textMuted}
                  value={category}
                  onChangeText={setCategory}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Unit</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                  placeholder="pcs / tablets"
                  placeholderTextColor={colors.textMuted}
                  value={unit}
                  onChangeText={setUnit}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Batch Number *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                  placeholder="B12345"
                  placeholderTextColor={colors.textMuted}
                  value={batchNumber}
                  onChangeText={setBatchNumber}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Expiry Date *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                  placeholder="2028-12-31"
                  placeholderTextColor={colors.textMuted}
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Buy Price (TZS) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                  placeholder="500"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={buyPrice}
                  onChangeText={setBuyPrice}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Sell Price (TZS) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                  placeholder="1000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={sellPrice}
                  onChangeText={setSellPrice}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Quantity *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                  placeholder="100"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Low Threshold</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                  placeholder="5"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={lowStockThreshold}
                  onChangeText={setLowStockThreshold}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.actionPrimary, opacity: saving ? 0.7 : 1 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Save & Queue Receipt</Text>
              )}
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
    maxHeight: '90%',
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
  title: {
    fontSize: 16,
    fontFamily: 'Sora_600SemiBold',
  },
  content: {
    padding: 20,
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  input: {
    height: 46,
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  button: {
    paddingVertical: 14,
    borderRadius: radius.card,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
