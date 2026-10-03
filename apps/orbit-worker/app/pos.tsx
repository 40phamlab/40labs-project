// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { colors, radius } from '@40labs/design-tokens';
import { useI18n } from '../src/i18n/I18nProvider';
import { ScreenHeader, Chip, EmptyState, InlineError } from '../src/components';
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

  // Idempotency key persistent ref for lost response retries
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
      <View style={styles.container}>
        <ScreenHeader title="Sale Successful" subtitle="Receipt Summary" />
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <Ionicons name="checkmark-circle" size={64} color={colors.actionPrimary} style={{ alignSelf: 'center', marginBottom: 16 }} />
          <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>Sale Completed Successfully</Text>
          <Text style={[styles.resultId, { color: colors.textMuted }]}>Sale ID: {completedSale.id}</Text>

          <View style={[styles.receiptCard, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderSubtle }]}>
            <Text style={[styles.receiptHeader, { color: colors.textPrimary }]}>Receipt Details</Text>
            {completedSale.lines.map((l) => (
              <View key={l.id} style={styles.receiptLine}>
                <Text style={[styles.receiptLineText, { color: colors.textSecondary }]}>
                  {l.medicineName} x{l.quantity}
                </Text>
                <Text style={[styles.receiptLineText, { color: colors.textPrimary }]}>
                  TZS {l.subtotal.toLocaleString()}
                </Text>
              </View>
            ))}
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <View style={styles.receiptLine}>
              <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Grand Total</Text>
              <Text style={[styles.totalValue, { color: colors.actionPrimary }]}>
                TZS {completedSale.grandTotal.toLocaleString()}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.actionPrimary }]}
            onPress={() => {
              setCompletedSale(null);
              idempotencyKeyRef.current = null;
            }}
          >
            <Text style={styles.primaryButtonText}>New Sale</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <ScreenHeader title="Point of Sale (POS)" subtitle="Online Sales" style={styles.headerTitleContainer} />
      </View>

      <View style={styles.layout}>
        {/* Left: Product Search & List */}
        <View style={styles.leftPane}>
          <View style={[styles.searchBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle }]}>
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
                style={[styles.productCard, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderSubtle }]}
                onPress={() => handleAddToCart(item)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.medicine.name}
                  </Text>
                  <Text style={[styles.productMeta, { color: colors.textMuted }]}>
                    Batch: {item.inventoryItem.batchNumber} | Qty: {item.inventoryItem.quantity}
                  </Text>
                </View>
                <Text style={[styles.productPrice, { color: colors.actionPrimary }]}>
                  TZS {item.inventoryItem.sellPrice.toLocaleString()}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.productList}
          />
        </View>

        {/* Right: Cart & Checkout */}
        <View style={[styles.rightPane, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderSubtle }]}>
          <Text style={[styles.cartTitle, { color: colors.textPrimary }]}>Current Cart</Text>

          {/* Customer Selector */}
          <TouchableOpacity
            style={[styles.customerButton, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle }]}
            onPress={() => setCustomerModalVisible(true)}
          >
            <Ionicons name="person-outline" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <Text style={[styles.customerText, { color: selectedCustomer ? colors.textPrimary : colors.textMuted }]} numberOfLines={1}>
              {selectedCustomer ? `${selectedCustomer.fullName} (${selectedCustomer.phone})` : 'Select Patient / Customer'}
            </Text>
          </TouchableOpacity>

          <FlatList
            data={cart}
            keyExtractor={(item) => item.inventoryItemId}
            renderItem={({ item }) => (
              <View style={[styles.cartItemRow, { borderBottomColor: colors.divider }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cartItemName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.medicineName}
                  </Text>
                  <Text style={[styles.cartItemPrice, { color: colors.textMuted }]}>
                    TZS {item.unitPrice.toLocaleString()} each
                  </Text>
                </View>
                <View style={styles.qtyControls}>
                  <TouchableOpacity onPress={() => handleUpdateQuantity(item.inventoryItemId, -1)} style={styles.qtyBtn}>
                    <Ionicons name="remove" size={16} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={[styles.qtyText, { color: colors.textPrimary }]}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => handleUpdateQuantity(item.inventoryItemId, 1)} style={styles.qtyBtn}>
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

          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>TZS {subtotalSum.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Grand Total</Text>
              <Text style={[styles.grandTotalValue, { color: colors.actionPrimary }]}>TZS {grandTotal.toLocaleString()}</Text>
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.actionPrimary, opacity: confirming || cart.length === 0 ? 0.6 : 1 }]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceStrong,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.topChrome,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPane: {
    flex: 1.2,
    padding: 16,
    borderRightWidth: 1,
    borderRightColor: colors.borderSubtle,
  },
  searchBox: {
    height: 44,
    borderRadius: radius.card,
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
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productName: {
    fontSize: 14,
    fontFamily: 'Sora_600SemiBold',
    marginBottom: 2,
  },
  productMeta: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  productPrice: {
    fontSize: 13,
    fontFamily: 'JetBrainsMono_500Medium',
  },
  rightPane: {
    flex: 1,
    padding: 16,
    borderLeftWidth: 1,
  },
  cartTitle: {
    fontSize: 16,
    fontFamily: 'Sora_600SemiBold',
    marginBottom: 12,
  },
  customerButton: {
    height: 40,
    borderRadius: radius.card,
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
  cartItemPrice: {
    fontSize: 11,
    fontFamily: 'JetBrainsMono_400Regular',
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
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 13,
    fontFamily: 'JetBrainsMono_500Medium',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  summaryContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
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
  summaryValue: {
    fontSize: 13,
    fontFamily: 'JetBrainsMono_500Medium',
  },
  grandTotalValue: {
    fontSize: 16,
    fontFamily: 'JetBrainsMono_600SemiBold',
  },
  confirmButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: radius.card,
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
    fontFamily: 'Sora_600SemiBold',
    marginBottom: 4,
  },
  resultId: {
    fontSize: 12,
    fontFamily: 'JetBrainsMono_400Regular',
    marginBottom: 24,
  },
  receiptCard: {
    width: '100%',
    borderRadius: radius.card,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    gap: 8,
  },
  receiptHeader: {
    fontSize: 14,
    fontFamily: 'Sora_600SemiBold',
    marginBottom: 8,
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
  totalLabel: {
    fontSize: 15,
    fontFamily: 'Sora_600SemiBold',
  },
  totalValue: {
    fontSize: 15,
    fontFamily: 'JetBrainsMono_600SemiBold',
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: radius.card,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
