// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#history]
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { colors } from '@40labs/design-tokens';
import { useI18n } from '../../src/i18n/I18nProvider';
import { ScreenHeader, Chip, Card, EmptyState, InlineError } from '../../src/components';
import { useConnectionStore } from '../../src/stores/connection';
import { getServerCredential } from '../../src/lib/secure-store';
import { ApiClient } from '@40labs/api-client';
import { getDatabase } from '../../src/db/outbox';
import { putCache, getCache, CacheResult } from '../../src/db/cache';
import { useLocalSearchParams } from 'expo-router';

export default function HistoryScreen() {
  const { t } = useI18n();
  const { status, activeBusinessId } = useConnectionStore();
  const params = useLocalSearchParams<{ filter?: string }>();
  const [selectedFilter, setSelectedFilter] = useState(params.filter || 'all');
  const [activities, setActivities] = useState<any[]>([]);
  const [outboxItems, setOutboxItems] = useState<any[]>([]);
  const [cacheMeta, setCacheMeta] = useState<CacheResult | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOutboxItems = () => {
    try {
      const db = getDatabase();
      const rows = db.getAllSync(`SELECT * FROM outbox ORDER BY created_at DESC;`);
      setOutboxItems(rows || []);
    } catch {
      setOutboxItems([]);
    }
  };

  const fetchHistory = async () => {
    if (!activeBusinessId) return;
    const server = await getServerCredential(activeBusinessId);
    if (!server) return;

    setErrorMessage(null);
    try {
      const client = new ApiClient({
        baseUrl: server.endpoint,
        transport: {
          request: async (opts) => {
            const response = await fetch(`${server.endpoint}${opts.path}`, {
              method: opts.method,
              headers: opts.headers,
              body: opts.body ? JSON.stringify(opts.body) : undefined,
              signal: opts.signal,
            });
            const data = await response.json().catch(() => ({}));
            return {
              status: response.status,
              headers: {},
              data,
            };
          },
        },
      });

      const data = await client.request<any>({
        method: 'GET',
        path: '/api/v1/activity',
        headers: {
          Authorization: `Bearer ${server.credential}`,
        },
      });

      const items = data.items || [];
      setActivities(items);
      putCache('history_activity', items);
      setCacheMeta(null);
    } catch (err: any) {
      const cached = getCache<any[]>('history_activity');
      if (cached) {
        setActivities(cached.data);
        setCacheMeta(cached);
      } else {
        setErrorMessage(t('dashboard.errorLoading'));
      }
    } finally {
      setRefreshing(false);
      loadOutboxItems();
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [activeBusinessId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHistory();
  }, [activeBusinessId]);

  const pendingOrFailedRows = outboxItems.map((item) => ({
    id: item.id,
    type: item.kind,
    title: `Pending: ${item.kind}`,
    subject: item.payload_json,
    createdAt: item.created_at,
    status: item.status === 'failed' ? 'failed' : 'pending',
    lastError: item.last_error,
  }));

  const allRows = [...pendingOrFailedRows, ...activities];

  const filteredRows = allRows.filter((row) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'sales' && row.type === 'sale') return true;
    if (selectedFilter === 'stock' && (row.type === 'stock_receipt' || row.type === 'stock')) return true;
    if (selectedFilter === 'patients' && (row.type === 'patient_added' || row.type === 'customer_create')) return true;
    if (selectedFilter === 'lab' && (row.type === 'lab_sample' || row.type === 'lab_result')) return true;
    return false;
  });

  const handleRetryOutbox = (id: string) => {
    try {
      const db = getDatabase();
      db.runSync(`UPDATE outbox SET status = 'pending', last_error = NULL WHERE id = ?;`, [id]);
      loadOutboxItems();
    } catch {}
  };

  const handleDiscardOutbox = (id: string) => {
    try {
      const db = getDatabase();
      db.runSync(`DELETE FROM outbox WHERE id = ?;`, [id]);
      loadOutboxItems();
    } catch {}
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('nav.history')} />
      <View style={styles.filterRow}>
        <Chip label="All" selected={selectedFilter === 'all'} onPress={() => setSelectedFilter('all')} />
        <Chip label={t('dashboard.metricSales')} selected={selectedFilter === 'sales'} onPress={() => setSelectedFilter('sales')} />
        <Chip label={t('dashboard.addStock')} selected={selectedFilter === 'stock'} onPress={() => setSelectedFilter('stock')} />
        <Chip label={t('dashboard.addPatient')} selected={selectedFilter === 'patients'} onPress={() => setSelectedFilter('patients')} />
        <Chip label={t('dashboard.labTests')} selected={selectedFilter === 'lab'} onPress={() => setSelectedFilter('lab')} />
      </View>

      {cacheMeta && (
        <View style={styles.cacheBanner}>
          <Text style={styles.cacheText}>Offline mode - cached data as of {cacheMeta.asOfText}</Text>
        </View>
      )}

      {errorMessage && (
        <View style={styles.errorContainer}>
          <InlineError message={errorMessage} onRetry={fetchHistory} />
        </View>
      )}

      <FlatList
        data={filteredRows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<EmptyState title={t('dashboard.noData')} description={t('dashboard.nothingPending')} icon="time-outline" />}
        renderItem={({ item }) => (
          <Card style={styles.rowCard}>
            <View style={styles.rowHeader}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={[styles.statusBadge, item.status === 'failed' ? styles.statusFailed : item.status === 'pending' ? styles.statusPending : styles.statusDone]}>
                {item.status}
              </Text>
            </View>
            <Text style={styles.rowSubject}>{item.subject}</Text>
            <Text style={styles.rowTime}>{new Date(item.createdAt).toLocaleString()}</Text>

            {item.status === 'failed' && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleRetryOutbox(item.id)}>
                  <Text style={styles.actionText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.discardBtn]} onPress={() => handleDiscardOutbox(item.id)}>
                  <Text style={[styles.actionText, styles.discardText]}>Discard</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceStrong,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  cacheBanner: {
    backgroundColor: colors.surfaceSecondary,
    padding: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  cacheText: {
    color: colors.accent,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  errorContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  rowCard: {
    marginBottom: 12,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rowTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: 'Sora_600SemiBold',
  },
  statusBadge: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusDone: {
    color: colors.success,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusPending: {
    color: colors.accent,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  statusFailed: {
    color: colors.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  rowSubject: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 6,
  },
  rowTime: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: 'JetBrainsMono_400Regular',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  discardBtn: {
    borderColor: colors.danger,
  },
  actionText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  discardText: {
    color: colors.danger,
  },
});
