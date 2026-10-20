// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useTheme } from '../src/theme/ThemeProvider';
import { radius } from '../src/theme/rn-tokens';
import { Screen, AppHeader, Text } from '../src/ui';
import { useI18n } from '../src/i18n/I18nProvider';
import { useConnectionStore } from '../src/stores/connection';
import { StockItem } from '../src/features/stock/types';
import { fetchStockListApi } from '../src/features/stock/api';
import { CartItem, SaleResponse } from '../src/features/sales/types';
import { createSaleApi } from '../src/features/sales/api';
import { Customer } from '../src/features/customers/types';
import { CustomerPickerModal } from '../src/features/customers/CustomerPickerModal';
import { PinPad } from '../src/components/PinPad';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';

export default function PosScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const { status, activeBusinessId } = useConnectionStore();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money' | 'card'>('cash');
  const [discountAmount, setDiscountAmount] = useState('0');

  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [pinPadVisible, setPinPadVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [completedSale, setCompletedSale] = useState<SaleResponse | null>(null);

  const idempotencyKeyRef = useRef<string | null>(null);

  const loadStock = useCallback(async () => {
    if (!activeBusinessId || status !== 'connected') return;
    setLoading(true);
    try {
      const data = await fetchStockListApi(activeBusinessId, searchQuery || undefined);
      setStockItems(data);
    } catch {
      setStockItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeBusinessId, status, searchQuery]);

  useEffect(() => {
    if (status === 'connected') {
      loadStock();
    }
  }, [status, activeBusinessId, searchQuery, loadStock]);

  const handleAddToCart = (stockItem: StockItem) => {
    if (stockItem.inventoryItem.quantity <= 0) {
      Alert.alert('Out of Stock', 'This item has zero quantity.');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.inventoryItemId === stockItem.inventoryItem.id);
      if (existing) {
        if (existing.quantity >= stockItem.inventoryItem.quantity) {
          Alert.alert('Limit Reached', 'Cannot add more than available stock quantity.');
          return prev;
        }
        return prev.map((i) =>
          i.inventoryItemId === stockItem.inventoryItem.id
            ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice }
            : i
        );
      } else {
        return [
          ...prev,
          {
            inventoryItemId: stockItem.inventoryItem.id,
            medicineName: stockItem.medicine.name,
            unitPrice: stockItem.inventoryItem.sellPrice,
            quantity: 1,
            subtotal: stockItem.inventoryItem.sellPrice,
          },
        ];
      }
    });
  };

  const handleUpdateQuantity = (inventoryItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.inventoryItemId === inventoryItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const subtotalSum = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const discount = Number(discountAmount) || 0;
  const grandTotal = Math.max(0, subtotalSum - discount);

  const executeCheckout = async (pin?: string) => {
    if (status !== 'connected') {
      Alert.alert('Offline Error', 'Sales are online only. Cannot process sale while unreachable.');
      return;
    }

    if (cart.length === 0) {
      Alert.alert('Cart Empty', 'Please add items to the cart before confirming.');
      return;
    }

    setConfirming(true);
    try {
      const payload = {
        customerId: selectedCustomer ? selectedCustomer.id : null,
        items: cart.map((i) => ({
          inventoryItemId: i.inventoryItemId,
          quantity: i.quantity,
        })),
        paymentMethod,
        discountAmount: discount,
      };

      const { sale, idempotencyKey } = await createSaleApi(activeBusinessId!, payload, idempotencyKeyRef.current || undefined);
      idempotencyKeyRef.current = idempotencyKey;
      setCompletedSale(sale);
      setCart([]);
      setSelectedCustomer(null);
    } catch (err: any) {
      Alert.alert(
        'Sale Confirmation Failed',
        `${err.message || 'Unknown error'}\n\nPlease retry. Your idempotency key is preserved to prevent duplicate charges.`
      );
    } finally {
      setConfirming(false);
      setPinPadVisible(false);
    }
  };

  if (completedSale) {
    return (
      <Screen scrollable={false}>
        <AppHeader title="Sale Successful" />
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

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.actionPrimary, borderRadius: radius.card }]}
            onPress={() => {
              setCompletedSale(null);
              idempotencyKeyRef.current = null;
            }}
          >
            <Text style={styles.primaryButtonText}>New Sale</Text>
          </TouchableOpacity>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen scrollable={false}>
      <AppHeader
        title="Point of Sale (POS)"
        onBack={() => router.back()}
      />

      <View style={styles.layout}>
        <View style={[styles.leftPane, { borderRightColor: colors.borderSubtle }]}>
          <View style={[styles.searchBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
            <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search products..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <FlatList
            data={stockItems}
            keyExtractor={(item) => item.inventoryItem.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.productCard, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
                onPress={() => handleAddToCart(item)}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="heading" style={{ fontSize: 14, marginBottom: 2 }} numberOfLines={1}>
                    {item.medicine.name}
                  </Text>
                  <Text style={[styles.productMeta, { color: colors.textMuted }]}>
                    Batch: {item.inventoryItem.batchNumber} | Qty: {item.inventoryItem.quantity}
                  </Text>
                </View>
                <Text variant="mono" style={{ fontSize: 13, color: colors.actionPrimary }}>
                  TZS {item.inventoryItem.sellPrice.toLocaleString()}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.productList}
          />
        </View>

        <View style={[styles.rightPane, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderSubtle }]}>
          <Text variant="heading" style={{ fontSize: 16, marginBottom: 12 }}>Current Cart</Text>

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
                  <Text style={[styles.cartItemName, { color: colors.textPrimary }]}>
                    {item.medicineName}
                  </Text>
                  <Text variant="mono" style={{ fontSize: 11, color: colors.textMuted }}>
                    TZS {item.unitPrice.toLocaleString()} each
                  </Text>
                </View>
                <View style={styles.qtyControls}>
                  <TouchableOpacity onPress={() => handleUpdateQuantity(item.inventoryItemId, -1)} style={[styles.qtyBtn, { backgroundColor: colors.surfaceSecondary }]}>
                    <Ionicons name="remove" size={16} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <Text variant="mono" style={{ fontSize: 13 }}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => handleUpdateQuantity(item.inventoryItemId, 1)} style={[styles.qtyBtn, { backgroundColor: colors.surfaceSecondary }]}>
                    <Ionicons name="add" size={16} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            contentContainerStyle={styles.cartList}
            ListEmptyComponent={
              <View style={styles.emptyCart}>
                <Text style={{ color: colors.textMuted }}>Cart is empty</Text>
              </View>
            }
          />

          <View style={[styles.summaryContainer, { borderTopColor: colors.borderSubtle }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
              <Text variant="mono" style={{ fontSize: 13 }}>TZS {subtotalSum.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Grand Total</Text>
              <Text variant="mono" style={{ fontSize: 16, color: colors.actionPrimary }}>TZS {grandTotal.toLocaleString()}</Text>
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.actionPrimary, borderRadius: radius.card, opacity: confirming || cart.length === 0 ? 0.6 : 1 }]}
              onPress={() => setPinPadVisible(true)}
              disabled={confirming || cart.length === 0}
            >
              {confirming ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm Sale (TZS {grandTotal.toLocaleString()})</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <CustomerPickerModal
        visible={customerModalVisible}
        onSelect={(cust) => setSelectedCustomer(cust)}
        onClose={() => setCustomerModalVisible(false)}
      />

      <PinPad
        visible={pinPadVisible}
        title="Authorize Sale PIN"
        onConfirm={(pin) => executeCheckout(pin)}
        onCancel={() => setPinPadVisible(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPane: {
    flex: 1.2,
    padding: 16,
    borderRightWidth: 1,
  },
  searchBox: {
    height: 44,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  productList: {
    gap: 8,
  },
  productCard: {
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productMeta: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  rightPane: {
    flex: 1,
    padding: 16,
    borderLeftWidth: 1,
  },
  customerButton: {
    height: 40,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  customerText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  cartList: {
    flex: 1,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  cartItemName: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
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
  confirmButton: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
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
  primaryButton: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
