// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#notifications]
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { colors } from '@40labs/design-tokens';
import { useI18n } from '../../src/i18n/I18nProvider';
import { ScreenHeader, Chip, EmptyState, Fab } from '../../src/components';

export default function NotificationsScreen() {
  const { t } = useI18n();
  const [tab, setTab] = useState('all');

  return (
    <View style={styles.container}>
      <ScreenHeader title={t('nav.notifications')} />
      <View style={styles.filterRow}>
        <Chip label="All" selected={tab === 'all'} onPress={() => setTab('all')} />
        <Chip label="Role" selected={tab === 'role'} onPress={() => setTab('role')} />
        <Chip label="Direct" selected={tab === 'direct'} onPress={() => setTab('direct')} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <EmptyState title={t('dashboard.nothingPending')} icon="notifications-off-outline" />
      </ScrollView>
      <View style={styles.fabContainer}>
        <Fab label="New" icon="add" onPress={() => {}} />
      </View>
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
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
});
