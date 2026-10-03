// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, Modal } from 'react-native';
import { colors, radius } from '@40labs/design-tokens';
import { useI18n } from '../src/i18n/I18nProvider';
import { ScreenHeader, EmptyState, InlineError } from '../src/components';
import { useConnectionStore } from '../src/stores/connection';
import { LabOrder } from '../src/features/lab/types';
import { fetchLabOrdersApi, enqueueRecordResult } from '../src/features/lab/api';
import { getCache, putCache, CacheResult } from '../src/db/cache';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router';

export default function LabResultScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { status, activeBusinessId } = useConnectionStore();
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cacheMeta, setCacheMeta] = useState<CacheResult | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [resultNotes, setResultNotes] = useState('');
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
      // Filter orders awaiting result (status === 'sample_collected')
      const resultOrders = data.filter((o) => o.status === 'sample_collected');
      setOrders(resultOrders);
      putCache('lab_orders_result', resultOrders);
      setCacheMeta(null);
    } catch (err: any) {
      const cached = getCache<LabOrder[]>('lab_orders_result');
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
      const cached = getCache<LabOrder[]>('lab_orders_result');
      if (cached) {
        setOrders(cached.data);
        setCacheMeta(cached);
      }
    }
  }, [status, activeBusinessId, loadOrders]);

  const handleRecordResult = async () => {
    if (!selectedOrder || !resultNotes.trim()) {
      Alert.alert('Error', 'Please enter result notes / outcome.');
      return;
    }

    setSaving(true);
    try {
      await enqueueRecordResult({
        labOrderId: selectedOrder.id,
        resultNotes: resultNotes.trim(),
        status: 'completed',
      });
      Alert.alert('Success', 'Lab result recorded and queued in outbox for synchronization.');
      setSelectedOrder(null);
      setResultNotes('');
      loadOrders(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to queue lab result');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <ScreenHeader
          title="Record Result"
          subtitle="Awaiting Result Orders"
          style={styles.headerTitleContainer}
        />
      </View>

      {cacheMeta && (
        <View style={styles.cacheBanner}>
          <Text style={styles.cacheText}>
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
            style={[styles.card, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderSubtle }]}
            onPress={() => setSelectedOrder(item)}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.orderIdText, { color: colors.textPrimary }]}>Order #{item.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.statusText, { color: colors.actionPrimary }]}>{item.status}</Text>
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
            <EmptyState title={t('dashboard.nothingPending')} icon="checkmark-circle-outline" />
          ) : null
        }
      />

      <Modal transparent visible={!!selectedOrder} animationType="slide" onRequestClose={() => setSelectedOrder(null)}>
        <View style={styles.overlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderSubtle }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Record Result for Order #{selectedOrder?.id}</Text>
              <TouchableOpacity onPress={() => setSelectedOrder(null)} accessibilityLabel="Close">
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Result Notes / Outcome *</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                placeholder="Enter test results and notes..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                value={resultNotes}
                onChangeText={setResultNotes}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.actionPrimary, opacity: saving ? 0.7 : 1 }]}
                onPress={handleRecordResult}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Save & Queue Result</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  cacheBanner: {
    backgroundColor: colors.surfaceSecondary,
    padding: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  cacheText: {
    color: colors.accent,
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
    borderRadius: radius.card,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderIdText: {
    fontSize: 15,
    fontFamily: 'Sora_600SemiBold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.card,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'JetBrainsMono_500Medium',
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
    borderRadius: radius.card,
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
  modalTitle: {
    fontSize: 15,
    fontFamily: 'Sora_600SemiBold',
  },
  modalBody: {
    padding: 20,
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  textArea: {
    height: 100,
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlignVertical: 'top',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  button: {
    paddingVertical: 14,
    borderRadius: radius.card,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
