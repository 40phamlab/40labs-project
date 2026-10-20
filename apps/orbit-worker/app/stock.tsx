// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TextInput, RefreshControl, TouchableOpacity } from 'react-native';
import { useTheme } from '../src/theme/ThemeProvider';
import { radius } from '../src/theme/rn-tokens';
import { Screen, AppHeader, Text } from '../src/ui';
import { useI18n } from '../src/i18n/I18nProvider';
import { Chip, EmptyState, Fab, InlineError } from '../src/components';
import { useConnectionStore } from '../src/stores/connection';
import { StockItem } from '../src/features/stock/types';
import { fetchStockListApi } from '../src/features/stock/api';
import { StockCard } from '../src/features/stock/StockCard';
import { StockDetailModal } from '../src/features/stock/StockDetailModal';
import { StockAddModal } from '../src/features/stock/StockAddModal';
import { getCache, putCache, CacheResult } from '../src/db/cache';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';

export default function StockScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const { status, activeBusinessId } = useConnectionStore();
  const [items, setItems] = useState<StockItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cacheMeta, setCacheMeta] = useState<CacheResult | null>(null);

  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);

  const loadStock = useCallback(async (isRefresh = false) => {
    if (!activeBusinessId) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage(null);

    try {
      const data = await fetchStockListApi(activeBusinessId, searchQuery || undefined, lowStockOnly);
      setItems(data);
      putCache(`stock_list_${searchQuery}_${lowStockOnly}`, data);
      setCacheMeta(null);
    } catch (err: any) {
      const cached = getCache<StockItem[]>(`stock_list_${searchQuery}_${lowStockOnly}`);
      if (cached) {
        setItems(cached.data);
        setCacheMeta(cached);
      } else {
        setErrorMessage(t('dashboard.errorLoading'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeBusinessId, searchQuery, lowStockOnly]);

  useEffect(() => {
    if (status === 'connected') {
      loadStock();
    } else if (status === 'unreachable') {
      const cached = getCache<StockItem[]>(`stock_list_${searchQuery}_${lowStockOnly}`);
      if (cached) {
        setItems(cached.data);
        setCacheMeta(cached);
      }
    }
  }, [status, activeBusinessId, searchQuery, lowStockOnly, loadStock]);

  return (
    <Screen scrollable={false}>
      <AppHeader
        title="View Stock"
        onBack={() => router.back()}
      />

      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search medicine, generic name, batch..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <Chip
          label="Low Stock"
          selected={lowStockOnly}
          onPress={() => setLowStockOnly(!lowStockOnly)}
        />
      </View>

      {cacheMeta && (
        <View style={[styles.cacheBanner, { backgroundColor: colors.surfaceSecondary }]}>
          <Text style={[styles.cacheText, { color: colors.accent }]}>
            Offline mode - displaying cached data as of {cacheMeta.asOfText}
          </Text>
        </View>
      )}

      {errorMessage && (
        <View style={styles.errorContainer}>
          <InlineError message={errorMessage} onRetry={() => loadStock(true)} />
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.inventoryItem.id}
        renderItem={({ item }) => (
          <StockCard
            item={item}
            onPress={() => {
              setSelectedItem(item);
              setDetailVisible(true);
            }}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadStock(true)}
            tintColor={colors.actionPrimary}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState title={t('dashboard.noData')} icon="medical-outline" />
          ) : null
        }
      />

      <View style={styles.fabContainer}>
        <Fab label="Add Stock" icon="add" onPress={() => setAddModalVisible(true)} />
      </View>

      <StockDetailModal
        visible={detailVisible}
        item={selectedItem}
        onClose={() => setDetailVisible(false)}
      />

      <StockAddModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSuccess={() => loadStock(true)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  cacheBanner: {
    padding: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  cacheText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  errorContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
});
