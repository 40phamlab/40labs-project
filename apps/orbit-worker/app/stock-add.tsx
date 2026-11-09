// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import React, { useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { useTheme } from '../src/theme/ThemeProvider';
import { radius } from '../src/theme/rn-tokens';
import { Screen, AppHeader, Text, Button } from '../src/ui';
import { useI18n } from '../src/i18n/I18nProvider';
import { enqueue } from '../src/lib/outbox-sync';
import { useRouter } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function StockAddScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();

  const [name, setName] = useState('');
  const [batch, setBatch] = useState('');
  const [expiry, setExpiry] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (!name.trim() || !batch.trim() || !expiry.trim() || !quantity.trim() || !buyPrice.trim() || !sellPrice.trim()) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    const qtyNum = Number(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setErrorMsg('Quantity must be greater than 0.');
      return;
    }

    // Expiry validation: YYYY-MM-DD
    const expiryDate = new Date(expiry);
    if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
      setErrorMsg('Expiry date is invalid or has already passed.');
      return;
    }

    const cleanBuy = Number(buyPrice.replace(/[\s,]/g, ''));
    const cleanSell = Number(sellPrice.replace(/[\s,]/g, ''));
    if (isNaN(cleanBuy) || isNaN(cleanSell)) {
      setErrorMsg('Please enter valid numeric prices.');
      return;
    }

    if (cleanBuy > cleanSell) {
      Alert.alert(
        'Price Warning',
        'Buy price is higher than sell price. Do you want to proceed?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Proceed', onPress: () => performSave(cleanBuy, cleanSell, qtyNum) },
        ]
      );
      return;
    }

    await performSave(cleanBuy, cleanSell, qtyNum);
  };

  const performSave = async (buy: number, sell: number, qty: number) => {
    setLoading(true);
    try {
      await enqueue('stock_receipt', {
        name: name.trim(),
        batch: batch.trim(),
        expiry: expiry.trim(),
        quantity: qty,
        buyPrice: buy,
        sellPrice: sell,
      });
      router.back();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save stock receipt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scrollable={false} hasTabBar={false}>
      <AppHeader title="Ongeza Bidhaa (Add Stock)" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.container}>
        {errorMsg && (
          <View style={[styles.errorBox, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={{ color: colors.danger, fontSize: 13 }}>{errorMsg}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Jina la Bidhaa / Medicine Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
            placeholder="e.g. Paracetamol 500mg"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Namba ya Batch / Batch Number *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
            placeholder="e.g. BATCH-2026-001"
            placeholderTextColor={colors.textMuted}
            value={batch}
            onChangeText={setBatch}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Tarehe ya Kuisha / Expiry Date (YYYY-MM-DD) *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            value={expiry}
            onChangeText={setExpiry}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Idadi / Quantity *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
            keyboardDataType="numeric"
            keyboardType="numeric"
            placeholder="e.g. 100"
            placeholderTextColor={colors.textMuted}
            value={quantity}
            onChangeText={setQuantity}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Bei ya Kununua (Buy) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              value={buyPrice}
              onChangeText={setBuyPrice}
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Bei ya Kuuza (Sell) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              value={sellPrice}
              onChangeText={setSellPrice}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Button title="Hifadhi na Tuma (Save & Sync)" onPress={handleSubmit} loading={loading} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  footer: {
    marginTop: 24,
  },
});
