// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#lab]
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme/ThemeProvider';
import { radius } from '../src/theme/rn-tokens';
import { Screen, AppHeader, Text, TextField, BottomSheet, Button, StatusPill, Banner } from '../src/ui';
import { useI18n } from '../src/i18n/I18nProvider';
import { EmptyState, Card, InlineError } from '../src/components';
import { useConnectionStore } from '../src/stores/connection';
import { fetchLabOrdersApi, enqueueCollectSample } from '../src/features/lab/api';
import { getCache, putCache, CacheResult } from '../src/db/cache';
import { useRouter } from 'expo-router';

export default function LabSampleScreen() {
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

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cacheMeta, setCacheMeta] = useState<CacheResult | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [sampleLabel, setSampleLabel] = useState('');
  const [sampleLabelError, setSampleLabelError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadOrders = useCallback(async (isRefresh = false) => {
    if (!activeBusinessId) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage(null);

    try {
      const data = await fetchLabOrdersApi(activeBusinessId);
      const pendingOrders = data.filter((o: any) => o.status === 'pending');
      setOrders(pendingOrders);
      putCache('lab_orders_pending', pendingOrders);
      setCacheMeta(null);
    } catch (err: any) {
      const cached = getCache<any[]>('lab_orders_pending');
      if (cached) {
        setOrders(cached.data);
        setCacheMeta(cached);
      } else {
        setErrorMessage(t('dashboard.errorLoading'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeBusinessId, t]);

  useEffect(() => {
    if (status === 'connected') {
      loadOrders();
    } else if (status === 'unreachable') {
      const cached = getCache<any[]>('lab_orders_pending');
      if (cached) {
        setOrders(cached.data);
        setCacheMeta(cached);
      }
    }
  }, [status, activeBusinessId, loadOrders]);

  const handleCollectSample = async () => {
    if (!selectedOrder || !sampleLabel.trim()) {
      setSampleLabelError('Sample label is required');
      return;
    }

    setSaving(true);
    setSampleLabelError(null);
    try {
      await enqueueCollectSample({
        labOrderId: selectedOrder.id,
        sampleLabel: sampleLabel.trim(),
      });
      setSelectedOrder(null);
      setSampleLabel('');
      loadOrders(true);
    } catch (err: any) {
      setSampleLabelError(err.message || 'Failed to queue sample collection');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scrollable={false}>
      <AppHeader title="Collect Sample" onBack={() => router.back()} />

      {cacheMeta && (
        <Banner title={`Offline mode - cached data as of ${cacheMeta.asOfText}`} variant="cached" />
      )}

      {errorMessage && (
        <View style={styles.errorContainer}>
          <InlineError message={errorMessage} onRetry={() => loadOrders(true)} />
        </View>
      )}

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedOrder(item)}>
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <Text variant="heading" style={{ fontSize: 15 }}>{item.testName || item.testCatalogId}</Text>
                <StatusPill status="warning" label={item.status} />
              </View>
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>Patient: {item.patientName || item.customerId}</Text>
              <Text variant="mono" style={[styles.timeText, { color: colors.textMuted }]}>{new Date(item.createdAt).toLocaleString()}</Text>
            </Card>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadOrders(true)}
            tintColor={colors.actionPrimary}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState title={t('dashboard.nothingPending')} icon="flask-outline" />
          ) : null
        }
      />

      {selectedOrder && (
        <BottomSheet visible={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Sample Label">
          <View style={styles.sheetContent}>
            <TextField
              label="Sample Label"
              value={sampleLabel}
              onChangeText={setSampleLabel}
              error={sampleLabelError || undefined}
              placeholder=""
            />
            <Button
              title="Save & Queue Sample"
              onPress={handleCollectSample}
              disabled={saving}
              loading={saving}
              style={{ marginTop: 12 }}
            />
          </View>
        </BottomSheet>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  listContent: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 11,
  },
  sheetContent: {
    paddingBottom: 16,
  },
});
