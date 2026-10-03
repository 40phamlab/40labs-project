// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#history]
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { colors } from '@40labs/design-tokens';
import { useI18n } from '../../src/i18n/I18nProvider';
import { ScreenHeader, Chip, EmptyState } from '../../src/components';

export default function HistoryScreen() {
  const { t } = useI18n();
  const [selectedFilter, setSelectedFilter] = useState('all');

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('nav.history')} />
      <View style={styles.filterRow}>
        <Chip label="All" selected={selectedFilter === 'all'} onPress={() => setSelectedFilter('all')} />
        <Chip label={t('dashboard.metricSales')} selected={selectedFilter === 'sales'} onPress={() => setSelectedFilter('sales')} />
        <Chip label={t('dashboard.addStock')} selected={selectedFilter === 'stock'} onPress={() => setSelectedFilter('stock')} />
        <Chip label={t('dashboard.labTests')} selected={selectedFilter === 'lab'} onPress={() => setSelectedFilter('lab')} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <EmptyState title={t('dashboard.noData')} description={t('dashboard.nothingPending')} icon="time-outline" />
      </ScrollView>
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
    padding: 16,
    gap: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});
