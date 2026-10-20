// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { radius } from '../../theme/rn-tokens';
import { Screen, AppHeader, Text, Skeleton, Banner, KpiCard } from '../../ui';
import { useI18n } from '../../i18n/I18nProvider';
import { StatusDot, CountBadge } from '../../components';
import { QuickActionTile } from './QuickActionTile';
import { ConnectChip } from './ConnectChip';
import { useConnectionStore } from '../../stores/connection';
import { useSummary, getCachedMeta } from '../../hooks/useQueries';
import { useResponsive } from '../../theme/useResponsive';
import { useRouter } from 'expo-router';

export function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const { status, permissions, userInfo, activeBusinessId } = useConnectionStore();
  const { isCompact, contentMaxWidth, columns } = useResponsive();

  const { data: summary, isLoading, isError, error, refetch, isRefetching } = useSummary();
  const cacheMeta = getCachedMeta('home_summary');
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'connected' && userInfo?.name) {
      setBannerMessage(`Connected to ${userInfo.name}`);
      const timer = setTimeout(() => setBannerMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [status, userInfo]);

  const hasPermission = (key: string) => {
    if (status !== 'connected') return true;
    return permissions.includes(key) || (permissions as any)[key] === true;
  };

  const handleTilePress = (permKey: string, route: string) => {
    if (status === 'unpaired' || status === 'revoked') {
      router.push('/pair');
      return;
    }
    if (!hasPermission(permKey)) {
      setBannerMessage(t('emptystate.noAccess.title') || 'No permission');
      const timer = setTimeout(() => setBannerMessage(null), 3000);
      return () => clearTimeout(timer);
    }
    router.push(route as any);
  };

  const headerTitle = userInfo?.name
    ? `${userInfo.name} (${userInfo.role || 'Staff'})`
    : 'Orbit Worker';

  const qaColumns = columns >= 3 ? 4 : columns === 2 ? 3 : 2;

  const salesVal = summary?.sales !== undefined ? `TZS ${summary.sales.toLocaleString()}` : 'TZS 0';
  const patientsVal = summary?.patients !== undefined ? summary.patients : 0;
  const samplesVal = summary?.samples !== undefined ? summary.samples : 0;
  const stockVal = summary?.stockValue !== undefined ? `TZS ${summary.stockValue.toLocaleString()}` : 'TZS 0';

  return (
    <Screen scrollable={false}>
      <AppHeader
        title={headerTitle}
        rightAction={
          <View style={styles.headerRight}>
            <StatusDot state={status === 'connected' ? 'connected' : status === 'connecting' ? 'connecting' : 'offline'} />
            <CountBadge count={summary?.unreadNotifications || 0} />
            <ConnectChip status={status} onPress={() => router.push('/pair')} />
          </View>
        }
      />
      <ScrollView
        contentContainerStyle={[styles.content, { maxWidth: contentMaxWidth > 720 ? 720 : contentMaxWidth, alignSelf: 'center', width: '100%' }]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.actionPrimary} />}
      >
        {bannerMessage && (
          <Banner title={bannerMessage} variant={status === 'revoked' ? 'offline' : status === 'unreachable' ? 'cached' : 'success'} />
        )}

        {status === 'revoked' && (
          <Banner title="Device Access Revoked. Please re-pair." variant="offline" />
        )}

        {status === 'unreachable' && cacheMeta && !summary && (
          <Banner title={`Offline — cached data as of ${cacheMeta.asOfText}`} variant="cached" />
        )}

        {isLoading && !summary && status !== 'unpaired' ? (
          <View style={styles.kpiGrid}>
            <Skeleton height={80} style={{ width: '48%' }} />
            <Skeleton height={80} style={{ width: '48%' }} />
          </View>
        ) : (
          <View style={styles.kpiGrid}>
            <KpiCard
              style={{ width: '48%' }}
              label={t('dashboard.todaysSales')}
              value={salesVal}
            />
            <KpiCard
              style={{ width: '48%' }}
              label={t('dashboard.patientsInTrack')}
              value={patientsVal}
            />
            <KpiCard
              style={{ width: '48%' }}
              label={t('dashboard.labTests')}
              value={samplesVal}
            />
            <KpiCard
              style={{ width: '48%' }}
              label={t('dashboard.inventoryValue')}
              value={stockVal}
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
            locked={status === 'connected' && !hasPermission('can_update_stock')}
            onPress={() => handleTilePress('can_update_stock', '/stock')}
            onLockedPress={() => setBannerMessage('No permission')}
            style={{ width: `${100 / qaColumns - 3}%` }}
          />
          <QuickActionTile
            title={t('dashboard.addPatient')}
            icon="person-add-outline"
            locked={status === 'connected' && !hasPermission('can_manage_customers')}
            onPress={() => handleTilePress('can_manage_customers', '/stock')}
            onLockedPress={() => setBannerMessage('No permission')}
            style={{ width: `${100 / qaColumns - 3}%` }}
          />
          <QuickActionTile
            title={t('dashboard.newSale')}
            icon="cart-outline"
            locked={status === 'connected' && !hasPermission('can_create_sale')}
            onPress={() => handleTilePress('can_create_sale', '/pos')}
            onLockedPress={() => setBannerMessage('No permission')}
            style={{ width: `${100 / qaColumns - 3}%` }}
          />
          <QuickActionTile
            title={t('dashboard.labTests')}
            icon="flask-outline"
            locked={status === 'connected' && !hasPermission('can_add_lab_sample')}
            onPress={() => handleTilePress('can_add_lab_sample', '/lab-sample')}
            onLockedPress={() => setBannerMessage('No permission')}
            style={{ width: `${100 / qaColumns - 3}%` }}
          />
          <QuickActionTile
            title={t('dashboard.viewReports')}
            icon="document-text-outline"
            locked={status === 'connected' && !hasPermission('can_record_lab_result')}
            onPress={() => handleTilePress('can_record_lab_result', '/lab-result')}
            onLockedPress={() => setBannerMessage('No permission')}
            style={{ width: `${100 / qaColumns - 3}%` }}
          />
          <QuickActionTile
            title={t('nav.inventory')}
            icon="medical-outline"
            locked={status === 'connected' && !hasPermission('can_view_stock')}
            onPress={() => handleTilePress('can_view_stock', '/stock')}
            onLockedPress={() => setBannerMessage('No permission')}
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
    gap: 8,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
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
