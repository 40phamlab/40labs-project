// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, Modal } from 'react-native';
import { useTheme } from '../src/theme/ThemeProvider';
import { radius } from '../src/theme/rn-tokens';
import { Screen, AppHeader, Text } from '../src/ui';
import { useI18n } from '../src/i18n/I18nProvider';
import { EmptyState, InlineError } from '../src/components';
import { useConnectionStore } from '../src/stores/connection';
import { LabOrder } from '../src/features/lab/types';
import { fetchLabOrdersApi, enqueueCollectSample } from '../src/features/lab/api';
import { getCache, putCache, CacheResult } from '../src/db/cache';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';

export default function LabSampleScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const { status, activeBusinessId } = useConnectionStore();
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cacheMeta, setCacheMeta] = useState<CacheResult | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [sampleLabel, setSampleLabel] = useState('');
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
      const pendingOrders = data.filter((o) => o.status === 'pending');
      setOrders(pendingOrders);
      putCache('lab_orders_pending', pendingOrders);
      setCacheMeta(null);
    } catch (err: any) {
      const cached = getCache<LabOrder[]>('lab_orders_pending');
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
  }, [activeBusinessId]);

  useEffect(() => {
    if (status === 'connected') {
      loadOrders();
    } else if (status === 'unreachable') {
      const cached = getCache<LabOrder[]>('lab_orders_pending');
      if (cached) {
        setOrders(cached.data);
        setCacheMeta(cached);
      }
    }
  }, [status, activeBusinessId, loadOrders]);

  const handleCollectSample = async () => {
    if (!selectedOrder || !sampleLabel.trim()) {
      Alert.alert('Error', 'Please enter a sample label.');
      return;
    }

    setSaving(true);
    try {
      await enqueueCollectSample({
        labOrderId: selectedOrder.id,
        sampleLabel: sampleLabel.trim(),
      });
      Alert.alert('Success', 'Sample collection queued in outbox for synchronization.');
      setSelectedOrder(null);
      setSampleLabel('');
      loadOrders(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to queue sample collection');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scrollable={false}>
      <AppHeader
        title="Collect Sample"
        onBack={() => router.back()}
      />

      {cacheMeta && (
        <View style={[styles.cacheBanner, { backgroundColor: colors.surfaceSecondary }]}>
          <Text style={[styles.cacheText, { color: colors.accent }]}>
            Offline mode - displaying cached data as of {cacheMeta.asOfText}
          </Text>
        </View>
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
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
            onPress={() => setSelectedOrder(item)}
          >
            <View style={styles.cardHeader}>
              <Text variant="heading" style={{ fontSize: 15 }}>Order #{item.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: colors.surfaceSecondary, borderRadius: radius.card }]}>
                <Text variant="mono" style={{ fontSize: 12, color: colors.actionPrimary }}>{item.status}</Text>
              </View>
            </View>
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>Test Catalog ID: {item.testCatalogId}</Text>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>Customer: {item.customerId}</Text>
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

      <Modal transparent visible={!!selectedOrder} animationType="slide" onRequestClose={() => setSelectedOrder(null)}>
        <View style={styles.overlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
            <View style={styles.modalHeader}>
              <Text variant="heading" style={{ fontSize: 15 }}>Collect Sample for Order #{selectedOrder?.id}</Text>
              <TouchableOpacity onPress={() => setSelectedOrder(null)} accessibilityLabel="Close">
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text variant="label" style={{ marginBottom: 4 }}>Sample Label *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
                placeholder="e.g. Blood / Urine sample #123"
                placeholderTextColor={colors.textMuted}
                value={sampleLabel}
                onChangeText={setSampleLabel}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.actionPrimary, borderRadius: radius.card, opacity: saving ? 0.7 : 1 }]}
                onPress={handleCollectSample}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Save & Queue Sample</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cacheBanner: {
    padding: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  cacheText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  errorContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  listContent: {
    padding: 16,
  },
  card: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  metaText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalBody: {
    padding: 20,
    gap: 8,
  },
  input: {
    height: 46,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  button: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
