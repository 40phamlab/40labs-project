// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#pos]
import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../ui/Text';
import { BottomSheet } from '../../ui/BottomSheet';
import { Button } from '../../ui/Button';
import { radius } from '../../theme/rn-tokens';
import { CartItem } from './types';
import { Customer } from '../customers/types';
import { CustomerPickerModal } from '../customers/CustomerPickerModal';
import { PaymentSelector } from './PaymentSelector';

interface CartSheetProps {
  visible: boolean;
  onClose: () => void;
  cart: CartItem[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  paymentMethod: 'cash' | 'mobile_money' | 'card';
  onSelectPaymentMethod: (method: 'cash' | 'mobile_money' | 'card') => void;
  discountAmount: string;
  onDiscountChange: (val: string) => void;
  onConfirm: () => void;
  confirming: boolean;
}

export function CartSheet({
  visible,
  onClose,
  cart,
  selectedCustomer,
  onSelectCustomer,
  onUpdateQuantity,
  paymentMethod,
  onSelectPaymentMethod,
  discountAmount,
  onDiscountChange,
  onConfirm,
  confirming,
}: CartSheetProps) {
  const { colors } = useTheme();
  const [customerModalVisible, setCustomerModalVisible] = useState(false);

  const subtotalSum = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const discount = Number(discountAmount) || 0;
  const grandTotal = Math.max(0, subtotalSum - discount);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Shopping Cart">
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.customerButton, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
          onPress={() => setCustomerModalVisible(true)}
        >
          <Ionicons name="person-outline" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <Text style={[styles.customerText, { color: selectedCustomer ? colors.textPrimary : colors.textMuted }]}>
            {selectedCustomer ? `${selectedCustomer.fullName} (${selectedCustomer.phone})` : 'Select Patient / Customer'}
          </Text>
        </TouchableOpacity>

        <FlatList
          data={cart}
          keyExtractor={(item) => item.inventoryItemId}
          renderItem={({ item }) => (
            <View style={[styles.cartItemRow, { borderBottomColor: colors.divider }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cartItemName, { color: colors.textPrimary }]}>{item.medicineName}</Text>
                <Text variant="mono" style={{ fontSize: 11, color: colors.textMuted }}>
                  TZS {item.unitPrice.toLocaleString()} each
                </Text>
              </View>
              <View style={styles.qtyControls}>
                <TouchableOpacity
                  onPress={() => onUpdateQuantity(item.inventoryItemId, -1)}
                  style={[styles.qtyBtn, { backgroundColor: colors.surfaceSecondary }]}
                >
                  <Ionicons name="remove" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text variant="mono" style={{ fontSize: 14, minWidth: 20, textAlign: 'center' }}>
                  {item.quantity}
                </Text>
                <TouchableOpacity
                  onPress={() => onUpdateQuantity(item.inventoryItemId, 1)}
                  style={[styles.qtyBtn, { backgroundColor: colors.surfaceSecondary }]}
                >
                  <Ionicons name="add" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          style={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyCart}>
              <Text style={{ color: colors.textMuted }}>Cart is empty</Text>
            </View>
          }
        />

        <View style={styles.discountRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Discount (TZS)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
            keyboardType="numeric"
            value={discountAmount}
            onChangeText={onDiscountChange}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 4 }]}>Payment Method</Text>
        <PaymentSelector selected={paymentMethod} onSelect={onSelectPaymentMethod} />

        <View style={[styles.summaryContainer, { borderTopColor: colors.borderSubtle }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal ({totalItems} items)</Text>
            <Text variant="mono" style={{ fontSize: 13 }}>TZS {subtotalSum.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Grand Total</Text>
            <Text variant="mono" style={{ fontSize: 16, color: colors.actionPrimary }}>TZS {grandTotal.toLocaleString()}</Text>
          </View>

          <Button
            title={`Confirm Sale (TZS ${grandTotal.toLocaleString()})`}
            onPress={onConfirm}
            disabled={confirming || cart.length === 0}
            loading={confirming}
            style={{ marginTop: 8 }}
          />
        </View>
      </View>

      <CustomerPickerModal
        visible={customerModalVisible}
        onSelect={(cust) => onSelectCustomer(cust)}
        onClose={() => setCustomerModalVisible(false)}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 500,
  },
  customerButton: {
    height: 48,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  customerText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  list: {
    maxHeight: 200,
    marginBottom: 12,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCart: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  discountRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  input: {
    height: 44,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'JetBrainsMono_400Regular',
  },
  summaryContainer: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
});
