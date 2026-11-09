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
      setErrorMsg(t('inventory.fillRequired'));
      return;
    }

    const qtyNum = Number(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setErrorMsg(t('inventory.qtyGreaterThanZero'));
      return;
    }

    const expiryDate = new Date(expiry);
    if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
      setErrorMsg(t('inventory.invalidExpiry'));
      return;
    }

    const cleanBuy = Number(buyPrice.replace(/[\s,]/g, ''));
    const cleanSell = Number(sellPrice.replace(/[\s,]/g, ''));
    if (isNaN(cleanBuy) || isNaN(cleanSell)) {
      setErrorMsg(t('inventory.invalidPrices'));
      return;
    }

    if (cleanBuy > cleanSell) {
      Alert.alert(
        t('inventory.priceWarningTitle'),
        t('inventory.priceWarningBody'),
        [
          { text: t('common.cancel') || 'Cancel', style: 'cancel' },
          { text: t('inventory.proceed'), onPress: () => performSave(cleanBuy, cleanSell, qtyNum) },
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
      setErrorMsg(err.message || t('inventory.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scrollable={false} hasTabBar={false}>
      <AppHeader title={t('inventory.addStockTitle')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.container}>
        {errorMsg && (
          <View style={[styles.errorBox, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={{ color: colors.danger, fontSize: 13 }}>{errorMsg}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('inventory.medicineName')} *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
            placeholder="e.g. Paracetamol 500mg"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('inventory.batchNumber')} *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
            placeholder="e.g. BATCH-2026-001"
            placeholderTextColor={colors.textMuted}
            value={batch}
            onChangeText={setBatch}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('inventory.expiryDateLabel')} *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            value={expiry}
            onChangeText={setExpiry}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('inventory.quantity')} *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
            keyboardType="numeric"
            placeholder="e.g. 100"
            placeholderTextColor={colors.textMuted}
            value={quantity}
            onChangeText={setQuantity}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('inventory.buyPrice')} *</Text>
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
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('inventory.sellPrice')} *</Text>
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
          <Button title={t('inventory.saveAndSync')} onPress={handleSubmit} loading={loading} />
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
