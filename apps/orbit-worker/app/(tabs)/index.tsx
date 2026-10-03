// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '@40labs/design-tokens';
import { useI18n } from '../../src/i18n/I18nProvider';
import { ScreenHeader, StatusDot, CountBadge, Card, Tile } from '../../src/components';

export default function HomeScreen() {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Daktari / Mwuzaji"
        subtitle={t('dashboard.title')}
        rightAction={
          <View style={styles.headerRight}>
            <StatusDot state="connected" />
            <CountBadge count={3} />
          </View>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.todayCard}>
          <Text style={styles.sectionTitle}>{t('dashboard.overview')}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('dashboard.todaysSales')}</Text>
              <Text style={styles.statValue}>TZS 450,000</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('dashboard.monthlyProfit')}</Text>
              <Text style={styles.statValue}>TZS 1,200,000</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>
        <View style={styles.tilesGrid}>
          <Tile title={t('dashboard.addStock')} value="0 active" state="enabled" />
          <Tile title={t('dashboard.addPatient')} value="12 today" state="enabled" />
          <Tile title={t('dashboard.newSale')} value="TZS" state="enabled" />
          <Tile title={t('dashboard.inventoryValue')} value="TZS 8.5M" state="enabled" />
          <Tile title={t('dashboard.labTests')} value="4 pending" state="locked" />
          <Tile title={t('dashboard.businessHealth')} value="98%" state="disabled" />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceStrong,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  todayCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontFamily: 'Sora_600SemiBold',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontFamily: 'JetBrainsMono_500Medium',
    marginTop: 4,
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
});
