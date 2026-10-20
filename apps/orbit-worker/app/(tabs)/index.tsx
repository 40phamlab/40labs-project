// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { radius } from '../../src/theme/rn-tokens';
import { Screen, AppHeader, Text, Skeleton, Banner, KpiCard, Button } from '../../src/ui';
import { useI18n } from '../../src/i18n/I18nProvider';
import { StatusDot, CountBadge, EmptyState } from '../../src/components';
import { QuickActionTile } from '../../src/features/home/QuickActionTile';
import { useConnectionStore } from '../../src/stores/connection';
import { useSummary, getCachedMeta } from '../../src/hooks/useQueries';
import { useResponsive } from '../../src/theme/useResponsive';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const { status, permissions, userInfo, activeBusinessId } = useConnectionStore();
  const { isCompact, contentMaxWidth, columns } = useResponsive();

  const { data: summary, isLoading, isError, error, refetch, isRefetching } = useSummary();
  const cacheMeta = getCachedMeta('home_summary');
  const [noPermissionBanner, setNoPermissionBanner] = useState(false);

  useEffect(() => {
    useConnectionStore.getState().initialize();
  }, []);

  const hasPermission = (key: string) => {
    if (status !== 'connected') return true;
    return permissions.includes(key) || (permissions as any)[key] === true;
  };

  const handleTilePress = (permKey: string, route: string) => {
    if (!hasPermission(permKey)) {
      setNoPermissionBanner(true);
      return;
    }
    setNoPermissionBanner(false);
    router.push(route as any);
  };

  if (status === 'unpaired') {
    return (
      <Screen scrollable={false}>
        <AppHeader title={t('dashboard.title')} />
        <View style={styles.unpairedContainer}>
          <EmptyState
            title={t('pairing.notConnected')}
            description={t('pairing.connectPrompt')}
            icon="qr-code-outline"
          />
          <View style={{ width: '100%', maxWidth: 320, marginTop: 16 }}>
            <Button
              title={t('pairing.scanToConnect')}
              onPress={() => router.push('/pair')}
            />
          </View>
        </View>
      </Screen>
    );
  }

  const headerTitle = userInfo?.name
    ? `${userInfo.name} (${userInfo.role || 'Staff'})`
    : t('dashboard.title');

  const qaColumns = columns >= 3 ? 4 : columns === 2 ? 3 : 2;

  return (
    <Screen scrollable={false}>
      <AppHeader
        title={headerTitle}
        rightAction={
          <View style={styles.headerRight}>
            <StatusDot state={status === 'connected' ? 'connected' : status === 'connecting' ? 'connecting' : 'offline'} />
            <CountBadge count={summary?.unreadNotifications || 0} />
          </View>
        }
      />
      <ScrollView
        contentContainerStyle={[styles.content, { maxWidth: contentMaxWidth > 720 ? 720 : contentMaxWidth, alignSelf: 'center', width: '100%' }]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.actionPrimary} />}
      >
        {cacheMeta && !summary && (
          <Banner title={`Offline mode - cached data as of ${cacheMeta.asOfText}`} variant="cached" />
        )}

        {noPermissionBanner && (
          <Banner title={t('emptystate.noAccess.title') || 'No permission'} variant="warning" />
        )}

        {isLoading && !summary ? (
          <View style={styles.kpiGrid}>
            <Skeleton height={80} style={{ width: '48%' }} />
            <Skeleton height={80} style={{ width: '48%' }} />
          </View>
        ) : (
          <View style={styles.kpiGrid}>
            <KpiCard
              style={{ width: '48%' }}
              label={t('dashboard.todaysSales')}
              value={`TZS ${summary?.sales?.toLocaleString() || '0'}`}
            />
            <KpiCard
              style={{ width: '48%' }}
              label={t('dashboard.patientsInTrack')}
              value={summary?.patients || 0}
            />
            <KpiCard
              style={{ width: '48%' }}
              label={t('dashboard.labTests')}
              value={summary?.samples || 0}
            />
            <KpiCard
              style={{ width: '48%' }}
              label={t('dashboard.inventoryValue')}
              value={`TZS ${summary?.stockValue?.toLocaleString() || '0'}`}
            />
          </View>
        )}

        <Text variant="heading" style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {t('dashboard.quickActions')}
        </Text>

        <View style={styles.qaGrid}>
          <QuickActionTile
            title={t('dashboard.addStock')}
            icon="cube-outline"
            locked={!hasPermission('can_update_stock')}
            onPress={() => handleTilePress('can_update_stock', '/stock')}
            onLockedPress={() => setNoPermissionBanner(true)}
            style={{ width: `${100 / qaColumns - 3}%` }}
          />
          <QuickActionTile
            title={t('dashboard.addPatient')}
            icon="person-add-outline"
            locked={!hasPermission('can_manage_customers')}
            onPress={() => handleTilePress('can_manage_customers', '/stock')}
            onLockedPress={() => setNoPermissionBanner(true)}
            style={{ width: `${100 / qaColumns - 3}%` }}
          />
          <QuickActionTile
            title={t('dashboard.newSale')}
            icon="cart-outline"
            locked={!hasPermission('can_create_sale')}
            onPress={() => handleTilePress('can_create_sale', '/pos')}
            onLockedPress={() => setNoPermissionBanner(true)}
            style={{ width: `${100 / qaColumns - 3}%` }}
          />
          <QuickActionTile
            title={t('dashboard.labTests')}
            icon="flask-outline"
            locked={!hasPermission('can_add_lab_sample')}
            onPress={() => handleTilePress('can_add_lab_sample', '/lab-sample')}
            onLockedPress={() => setNoPermissionBanner(true)}
            style={{ width: `${100 / qaColumns - 3}%` }}
          />
          <QuickActionTile
            title={t('dashboard.viewReports')}
            icon="document-text-outline"
            locked={!hasPermission('can_record_lab_result')}
            onPress={() => handleTilePress('can_record_lab_result', '/lab-result')}
            onLockedPress={() => setNoPermissionBanner(true)}
            style={{ width: `${100 / qaColumns - 3}%` }}
          />
          <QuickActionTile
            title={t('nav.inventory')}
            icon="medical-outline"
            locked={!hasPermission('can_view_stock')}
            onPress={() => handleTilePress('can_view_stock', '/stock')}
            onLockedPress={() => setNoPermissionBanner(true)}
            style={{ width: `${100 / qaColumns - 3}%` }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  unpairedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Sora_600SemiBold',
    marginBottom: 12,
  },
  qaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
});
