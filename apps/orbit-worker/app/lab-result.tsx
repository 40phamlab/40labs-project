// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#lab]
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme/ThemeProvider';
import { radius } from '../src/theme/rn-tokens';
import { Screen, AppHeader, Text, TextField, BottomSheet, Button, StatusPill, Banner } from '../src/ui';
import { useI18n } from '../src/i18n/I18nProvider';
import { EmptyState, Card, InlineError } from '../src/components';
import { PinPad } from '../src/components/PinPad';
import { useConnectionStore } from '../src/stores/connection';
import { fetchLabOrdersApi, enqueueRecordResult } from '../src/features/lab/api';
import { getCache, putCache, CacheResult } from '../src/db/cache';
import { useRouter } from 'expo-router';

export default function LabResultScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status, activeBusinessId, permissions } = useConnectionStore();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cacheMeta, setCacheMeta] = useState<CacheResult | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [resultValue, setResultValue] = useState('');
  const [referenceRange, setReferenceRange] = useState('');
  const [isOutOfRange, setIsOutOfRange] = useState(false);
  const [resultError, setResultError] = useState<string | null>(null);

  const [pinPadVisible, setPinPadVisible] = useState(false);
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
      const resultOrders = data.filter((o: any) => o.status === 'sample_collected');
      setOrders(resultOrders);
      putCache('lab_orders_result', resultOrders);
      setCacheMeta(null);
    } catch (err: any) {
      const cached = getCache<any[]>('lab_orders_result');
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
      const cached = getCache<any[]>('lab_orders_result');
      if (cached) {
        setOrders(cached.data);
        setCacheMeta(cached);
      }
    }
  }, [status, activeBusinessId, loadOrders]);

  const handleConfirmResult = (pin?: string) => {
    if (!selectedOrder || !resultValue.trim()) {
      setResultError('Result value is required');
      return;
    }

    const needsPinOverride = isOutOfRange && !permissions.includes('can_override_lab_result');
    if (needsPinOverride && !pin) {
      setPinPadVisible(true);
      return;
    }

    executeRecordResult(pin);
  };

  const executeRecordResult = async (pin?: string) => {
    setSaving(true);
    setResultError(null);
    try {
      await enqueueRecordResult({
        labOrderId: selectedOrder.id,
        resultNotes: `Value: ${resultValue.trim()} (Ref: ${referenceRange.trim() || 'N/A'}, Out of Range: ${isOutOfRange ? 'Yes' : 'No'})`,
        status: 'completed',
      });
      setSelectedOrder(null);
      setResultValue('');
      setReferenceRange('');
      setIsOutOfRange(false);
      loadOrders(true);
    } catch (err: any) {
      setResultError(err.message || 'Failed to queue lab result');
    } finally {
      setSaving(false);
      setPinPadVisible(false);
    }
  };

  return (
    <Screen scrollable={false}>
      <AppHeader title="Record Result" onBack={() => router.back()} />

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
                <StatusPill status="info" label={item.status} />
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
            <EmptyState title={t('dashboard.nothingPending')} icon="checkmark-circle-outline" />
          ) : null
        }
      />

      {selectedOrder && (
        <BottomSheet visible={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Record Result">
          <View style={styles.sheetContent}>
            <TextField
              label="Result Value"
              value={resultValue}
              onChangeText={setResultValue}
              error={resultError || undefined}
              placeholder=""
            />
            <TextField
              label="Reference Range"
              value={referenceRange}
              onChangeText={setReferenceRange}
              placeholder=""
            />

            <View style={[styles.toggleRow, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
              <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Out of Range</Text>
              <Switch
                value={isOutOfRange}
                onValueChange={setIsOutOfRange}
                trackColor={{ false: colors.borderSubtle, true: colors.actionPrimary }}
              />
            </View>

            <Button
              title="Save & Queue Result"
              onPress={() => handleConfirmResult()}
              disabled={saving}
              loading={saving}
              style={{ marginTop: 16 }}
            />
          </View>
        </BottomSheet>
      )}

      <PinPad
        visible={pinPadVisible}
        title="Authorize Out-of-Range Result PIN"
        onConfirm={(pin: string) => executeRecordResult(pin)}
        onCancel={() => setPinPadVisible(false)}
      />
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
  toggleRow: {
    height: 48,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
});
