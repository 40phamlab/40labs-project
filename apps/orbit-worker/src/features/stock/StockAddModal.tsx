// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#stock]
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { Screen, AppHeader, Text, TextField, DateField, SelectField, FormSection, Button } from '../../ui';
import { useI18n } from '../../i18n/I18nProvider';
import { enqueueStockReceipt } from './api';
import { radius } from '../../theme/rn-tokens';

interface StockAddModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { label: 'Analgesic', value: 'Analgesic' },
  { label: 'Antibiotic', value: 'Antibiotic' },
  { label: 'Sedative', value: 'Sedative' },
  { label: 'Rehydration', value: 'Rehydration' },
  { label: 'Supplements', value: 'Supplements' },
];

const UNITS = [
  { label: 'Pack', value: 'pack' },
  { label: 'Tablet', value: 'tablet' },
  { label: 'Bottle', value: 'bottle' },
  { label: 'Sachet', value: 'sachet' },
  { label: 'Ampoule', value: 'ampoule' },
  { label: 'Vial', value: 'vial' },
];

export function StockAddModal({ visible, onClose, onSuccess }: StockAddModalProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [category, setCategory] = useState('Analgesic');
  const [quantity, setQuantity] = useState('10');
  const [buyPrice, setBuyPrice] = useState('1000');
  const [sellPrice, setSellPrice] = useState('1500');
  const [unit, setUnit] = useState('pack');
  const [batch, setBatch] = useState(`BATCH-${Math.floor(100000 + Math.random() * 900000)}`);
  const [expiryDate, setExpiryDate] = useState(new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]);
  const [lowStockThreshold, setLowStockThreshold] = useState('10');

  const [expiryError, setExpiryError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // TODO: [reason: scanner not wired in Orbit] [phase: post-MVP]
  // Batch/expiry scan via existing rxing/OCR only if already wired.

  const handleExpiryChange = (date: string) => {
    setExpiryError(null);
    if (new Date(date).getTime() < Date.now()) {
      setExpiryError('Expiry date cannot be in the past');
    }
    setExpiryDate(date);
  };

  const isFormValid =
    name.trim() !== '' &&
    batch.trim() !== '' &&
    expiryDate.trim() !== '' &&
    !expiryError &&
    Number(quantity) > 0;

  const handleSave = async () => {
    if (!isFormValid) return;

    setSaving(true);
    try {
      await enqueueStockReceipt({
        medicineName: name.trim(),
        genericName: genericName.trim() || null,
        category,
        unit,
        batchNumber: batch.trim(),
        expiryDate: new Date(expiryDate).toISOString(),
        buyPrice: Number(buyPrice.replace(/,/g, '')),
        sellPrice: Number(sellPrice.replace(/,/g, '')),
        quantity: Number(quantity),
        lowStockThreshold: Number(lowStockThreshold) || 10,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setExpiryError(err.message || 'Failed to add stock');
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <Screen scrollable={false}>
      <AppHeader title="Add New Stock Item" onBack={onClose} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
        <FormSection title="Product Information">
          <TextField label="Product Name" value={name} onChangeText={setName} placeholder="" />
          <TextField label="Generic Name" value={genericName} onChangeText={setGenericName} placeholder="" />
          <SelectField label="Category" value={category} options={CATEGORIES} onSelect={setCategory} />
          <SelectField label="Unit / Metric" value={unit} options={UNITS} onSelect={setUnit} />
        </FormSection>

        <FormSection title="Inventory & Pricing">
          <TextField label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="" />
          <TextField label="Buy Price (TZS)" value={buyPrice} onChangeText={setBuyPrice} keyboardType="numeric" placeholder="" style={styles.monoInput} />
          <TextField label="Sell Price (TZS)" value={sellPrice} onChangeText={setSellPrice} keyboardType="numeric" placeholder="" style={styles.monoInput} />
          <TextField label="Low Stock Threshold" value={lowStockThreshold} onChangeText={setLowStockThreshold} keyboardType="numeric" placeholder="" />
        </FormSection>

        <FormSection title="Batch & Expiry">
          <TextField label="Batch Number" value={batch} onChangeText={setBatch} placeholder="" />
          <DateField label="Expiry Date" value={expiryDate} onChange={handleExpiryChange} error={expiryError || undefined} />
        </FormSection>
      </ScrollView>

      <View style={[styles.stickyFooter, { backgroundColor: colors.surfaceStrong, borderTopColor: colors.borderSubtle, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          title="Add Stock"
          onPress={handleSave}
          disabled={!isFormValid || saving}
          loading={saving}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  monoInput: {
    fontFamily: 'JetBrainsMono_400Regular',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
