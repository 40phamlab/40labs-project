// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#pos]
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { radius } from '../../theme/rn-tokens';
import { Screen, AppHeader, Text, Banner } from '../../ui';
import { useI18n } from '../../i18n/I18nProvider';
import { useConnectionStore } from '../../stores/connection';
import { StockItem } from '../stock/types';
import { fetchStockListApi } from '../stock/api';
import { CartItem, SaleResponse } from './types';
import { createSaleApi } from './api';
import { Customer } from '../customers/types';
import { PinPad } from '../../components/PinPad';
import { ScanFrame } from '../../components/ScanFrame';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ProductList } from './ProductList';
import { CartSheet } from './CartSheet';
import { CheckoutSheet } from './CheckoutSheet';
import { useResponsive } from '../../theme/useResponsive';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';

export function PosScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  let insets = { top: 0, bottom: 0, left: 0, right: 0 };
  try {
    insets = useSafeAreaInsets();
  } catch {
    // fallback for test environments without SafeAreaProvider
  }
  const { status, activeBusinessId } = useConnectionStore();
  const { width } = useResponsive();
  const isCompact = width < 600;

  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mobile_money' | 'card'>('cash');
  const [discountAmount, setDiscountAmount] = useState('0');

  const [cartSheetVisible, setCartSheetVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [pinPadVisible, setPinPadVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [onlineErrorBanner, setOnlineErrorBanner] = useState(false);
  const [completedSale, setCompletedSale] = useState<SaleResponse | null>(null);

  const idempotencyKeyRef = useRef<string | null>(null);

  const loadStock = useCallback(async () => {
    if (!activeBusinessId) return;
    setLoading(true);
    try {
      const data = await fetchStockListApi(activeBusinessId, searchQuery || undefined);
      setStockItems(data);
    } catch {
      setStockItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeBusinessId, searchQuery]);

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  const handleAddToCart = (stockItem: StockItem) => {
    if (stockItem.inventoryItem.quantity <= 0) return;

    setCart((prev) => {
      const existing = prev.find((i) => i.inventoryItemId === stockItem.inventoryItem.id);
      if (existing) {
        if (existing.quantity >= stockItem.inventoryItem.quantity) return prev;
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
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const executeCheckout = async (pin?: string) => {
    if (status !== 'connected') {
      setOnlineErrorBanner(true);
      setPinPadVisible(false);
      return;
    }

    if (cart.length === 0) return;

    setConfirming(true);
    setOnlineErrorBanner(false);
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
      setCartSheetVisible(false);
    } catch (err: any) {
      setOnlineErrorBanner(true);
    } finally {
      setConfirming(false);
      setPinPadVisible(false);
    }
  };

  if (completedSale) {
    return (
      <CheckoutSheet
        completedSale={completedSale}
        onNewSale={() => {
          setCompletedSale(null);
          idempotencyKeyRef.current = null;
        }}
        onBack={() => router.back()}
      />
    );
  }

  return (
    <Screen scrollable={false}>
      <AppHeader
        title="Point of Sale (POS)"
        onBack={() => router.back()}
      />

      {onlineErrorBanner && (
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <Banner title="Sales are online only. Cannot process sale while offline/unreachable." variant="offline" />
        </View>
      )}

      <View style={[styles.layout, isCompact ? styles.layoutCompact : styles.layoutMedium]}>
        <View style={styles.listPane}>
          <View style={[styles.searchBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
            <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search products..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              onPress={() => {
                if (!permission?.granted) {
                  requestPermission();
                }
                setScannerVisible(true);
              }}
              style={styles.scanIconBtn}
            >
              <Ionicons name="barcode-outline" size={22} color={colors.actionPrimary} />
            </TouchableOpacity>
          </View>

          <ProductList items={stockItems} onAddToCart={handleAddToCart} loading={loading} />
        </View>

        {!isCompact && (
          <View style={[styles.cartPane, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderSubtle }]}>
            <Text variant="heading" style={{ fontSize: 16, marginBottom: 12 }}>Current Cart</Text>
            <CartSheet
              visible={true}
              onClose={() => {}}
              cart={cart}
              selectedCustomer={selectedCustomer}
              onSelectCustomer={setSelectedCustomer}
              onUpdateQuantity={handleUpdateQuantity}
              paymentMethod={paymentMethod}
              onSelectPaymentMethod={setPaymentMethod}
              discountAmount={discountAmount}
              onDiscountChange={setDiscountAmount}
              onConfirm={() => setPinPadVisible(true)}
              confirming={confirming}
            />
          </View>
        )}
      </View>

      {isCompact && cart.length > 0 && (
        <View style={[styles.bottomCartBar, { backgroundColor: colors.surfaceStrong, borderTopColor: colors.borderSubtle, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[styles.cartBarBtn, { backgroundColor: colors.actionPrimary, borderRadius: radius.card }]}
            onPress={() => setCartSheetVisible(true)}
          >
            <Text style={styles.cartBarText}>Cart · {totalItemsCount} items · TZS {grandTotal.toLocaleString()}</Text>
          </TouchableOpacity>
        </View>
      )}

      {isCompact && (
        <CartSheet
          visible={cartSheetVisible}
          onClose={() => setCartSheetVisible(false)}
          cart={cart}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
          onUpdateQuantity={handleUpdateQuantity}
          paymentMethod={paymentMethod}
          onSelectPaymentMethod={setPaymentMethod}
          discountAmount={discountAmount}
          onDiscountChange={setDiscountAmount}
          onConfirm={() => setPinPadVisible(true)}
          confirming={confirming}
        />
      )}

      <Modal visible={scannerVisible} animationType="slide" onRequestClose={() => setScannerVisible(false)}>
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
          {permission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              onBarcodeScanned={({ data }) => {
                setSearchQuery(data);
                setScannerVisible(false);
              }}
            />
          ) : null}
          <ScanFrame />
          <TouchableOpacity
            style={{ position: 'absolute', top: 40, right: 20, padding: 12 }}
            onPress={() => setScannerVisible(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>

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
  },
  layoutCompact: {
    flexDirection: 'column',
  },
  layoutMedium: {
    flexDirection: 'row',
  },
  listPane: {
    flex: 1,
    padding: 16,
  },
  cartPane: {
    width: 360,
    padding: 16,
    borderLeftWidth: 1,
  },
  searchBox: {
    height: 48,
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
  scanIconBtn: {
    padding: 4,
  },
  bottomCartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  cartBarBtn: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBarText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
