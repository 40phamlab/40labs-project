// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#pos]
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { Screen } from '../../ui/Screen';
import { AppHeader } from '../../ui/AppHeader';
import { Text } from '../../ui/Text';
import { Button } from '../../ui/Button';
import { radius } from '../../theme/rn-tokens';
import { SaleResponse } from './types';

interface CheckoutSheetProps {
  completedSale: SaleResponse;
  onNewSale: () => void;
  onBack: () => void;
}

export function CheckoutSheet({ completedSale, onNewSale, onBack }: CheckoutSheetProps) {
  const { colors } = useTheme();

  return (
    <Screen scrollable={false}>
      <AppHeader title="Sale Successful" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.resultContainer}>
        <Ionicons name="checkmark-circle" size={64} color={colors.actionPrimary} style={{ alignSelf: 'center', marginBottom: 16 }} />
        <Text variant="heading" style={styles.resultTitle}>Sale Completed Successfully</Text>
        <Text variant="mono" style={{ fontSize: 12, marginBottom: 24 }}>Sale ID: {completedSale.id}</Text>

        <View style={[styles.receiptCard, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
          <Text variant="heading" style={{ fontSize: 14, marginBottom: 8 }}>Receipt Details</Text>
          {completedSale.lines.map((l) => (
            <View key={l.id} style={styles.receiptLine}>
              <Text style={[styles.receiptLineText, { color: colors.textSecondary }]}>
                {l.medicineName} x{l.quantity}
              </Text>
              <Text variant="mono" style={styles.receiptLineText}>
                TZS {l.subtotal.toLocaleString()}
              </Text>
            </View>
          ))}
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <View style={styles.receiptLine}>
            <Text variant="heading" style={{ fontSize: 15 }}>Grand Total</Text>
            <Text variant="mono" style={{ fontSize: 15, color: colors.actionPrimary }}>
              TZS {completedSale.grandTotal.toLocaleString()}
            </Text>
          </View>
        </View>

        <Button title="New Sale" onPress={onNewSale} style={{ width: '100%' }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  resultContainer: {
    padding: 24,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 20,
    marginBottom: 4,
  },
  receiptCard: {
    width: '100%',
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    gap: 8,
  },
  receiptLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptLineText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
});
