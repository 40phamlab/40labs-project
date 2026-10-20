// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#history]
import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { Screen, AppHeader, Text, Skeleton, Banner } from '../../src/ui';
import { useI18n } from '../../src/i18n/I18nProvider';
import { Chip, Card, EmptyState, InlineError } from '../../src/components';
import { useConnectionStore } from '../../src/stores/connection';
import { useActivity, getCachedMeta } from '../../src/hooks/useQueries';
import { getDatabase } from '../../src/db/outbox';
import { useLocalSearchParams } from 'expo-router';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ filter?: string }>();
  const [selectedFilter, setSelectedFilter] = useState(params.filter || 'all');
  const [outboxItems, setOutboxItems] = useState<any[]>([]);

  const { data: activities = [], isLoading, isError, error, refetch, isRefetching } = useActivity();
  const cacheMeta = getCachedMeta('history_activity');

  const loadOutboxItems = () => {
    try {
      const db = getDatabase();
      const rows = db.getAllSync(`SELECT * FROM outbox ORDER BY created_at DESC;`);
      setOutboxItems(rows || []);
    } catch {
      setOutboxItems([]);
    }
  };

  React.useEffect(() => {
    loadOutboxItems();
  }, [activities]);

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
    <Screen scrollable={false}>
      <AppHeader title={t('nav.history')} />
      <View style={styles.filterRow}>
        <Chip label="All" selected={selectedFilter === 'all'} onPress={() => setSelectedFilter('all')} />
        <Chip label={t('dashboard.metricSales')} selected={selectedFilter === 'sales'} onPress={() => setSelectedFilter('sales')} />
        <Chip label={t('dashboard.addStock')} selected={selectedFilter === 'stock'} onPress={() => setSelectedFilter('stock')} />
        <Chip label={t('dashboard.addPatient')} selected={selectedFilter === 'patients'} onPress={() => setSelectedFilter('patients')} />
        <Chip label={t('dashboard.labTests')} selected={selectedFilter === 'lab'} onPress={() => setSelectedFilter('lab')} />
      </View>

      {cacheMeta && !activities.length && (
        <Banner title={`Offline mode - cached data as of ${cacheMeta.asOfText}`} variant="cached" />
      )}

      {isError && !activities.length && (
        <View style={styles.errorContainer}>
          <InlineError message={error?.message || t('dashboard.errorLoading')} onRetry={() => refetch()} />
        </View>
      )}

      {isLoading && !activities.length ? (
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton height={80} />
          <Skeleton height={80} />
          <Skeleton height={80} />
        </View>
      ) : (
        <FlatList
          data={filteredRows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.actionPrimary} />}
          ListEmptyComponent={<EmptyState title={t('dashboard.noData')} icon="time-outline" />}
          renderItem={({ item }) => (
            <Card style={styles.rowCard}>
              <View style={styles.rowHeader}>
                <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.statusBadge, item.status === 'failed' ? styles.statusFailed : item.status === 'pending' ? styles.statusPending : styles.statusDone]}>
                  {item.status}
                </Text>
              </View>
              <Text style={[styles.rowSubject, { color: colors.textSecondary }]}>{item.subject}</Text>
              <Text style={[styles.rowTime, { color: colors.textMuted }]}>{new Date(item.createdAt).toLocaleString()}</Text>

              {item.status === 'failed' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle }]} onPress={() => handleRetryOutbox(item.id)}>
                    <Text style={[styles.actionText, { color: colors.textPrimary }]}>Retry</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.discardBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.danger }]} onPress={() => handleDiscardOutbox(item.id)}>
                    <Text style={[styles.actionText, styles.discardText, { color: colors.danger }]}>Discard</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
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
    color: '#16A34A',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusPending: {
    color: '#F97316',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  statusFailed: {
    color: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  rowSubject: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 6,
  },
  rowTime: {
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
    borderWidth: 1,
  },
  discardBtn: {},
  actionText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  discardText: {},
});
