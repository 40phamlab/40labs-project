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

  const quickActionsList = [
    {
      title: 'Ongeza Bidhaa',
      icon: 'cube-outline',
      perm: 'can_update_stock',
      route: '/stock',
    },
    {
      title: 'Sajili Mgonjwa',
      icon: 'person-add-outline',
      perm: 'can_manage_customers',
      route: '/stock',
    },
    {
      title: 'Mauzo Mapya',
      icon: 'cart-outline',
      perm: 'can_create_sale',
      route: '/pos',
    },
    {
      title: 'Vipimo vya Maabara',
      icon: 'flask-outline',
      perm: 'can_add_lab_sample',
      route: '/lab-sample',
    },
    {
      title: 'Ona Ripoti',
      icon: 'document-text-outline',
      perm: 'can_record_lab_result',
      route: '/lab-result',
    },
    {
      title: 'Bidhaa',
      icon: 'medical-outline',
      perm: 'can_view_stock',
      route: '/stock',
    },
  ];

  const visibleActions = status === 'connected'
    ? quickActionsList.filter((qa) => hasPermission(qa.perm))
    : quickActionsList;

  const handleTilePress = (route: string, perm: string) => {
    console.log(`[OrbitWorker] Tile pressed: route=${route}, status=${status}, hasPermission=${hasPermission(perm)}`);
    if (status === 'unpaired' || status === 'revoked') {
      router.push('/pair');
      return;
    }
    try {
      router.push(route as any);
    } catch (err: any) {
      setBannerMessage(`Navigation error: route ${route} not found`);
      const timer = setTimeout(() => setBannerMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  };

  const headerTitle = userInfo?.name
    ? `${userInfo.name} (${userInfo.role || 'Staff'})`
    : 'Orbit Worker';

  const qaColumns = 2;

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
          <Skeleton height={140} style={{ width: '100%', marginBottom: 24 }} />
        ) : (
          <View style={[styles.overviewCard, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}>
            <Text variant="heading" style={[styles.overviewTitle, { color: colors.textPrimary }]}>
              {t('dashboard.salesAndProfitOverview')}
            </Text>
            <View style={styles.kpi2x2Grid}>
              <View style={styles.kpiCell}>
                <Text variant="label" numberOfLines={1} adjustsFontSizeToFit style={[styles.kpiLabel, { color: colors.textMuted }]}>{t('dashboard.todaysSales')}</Text>
                <Text variant="mono" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[styles.kpiValue, { color: colors.textPrimary }]}>{salesVal}</Text>
              </View>
              <View style={styles.kpiCell}>
                <Text variant="label" numberOfLines={1} adjustsFontSizeToFit style={[styles.kpiLabel, { color: colors.textMuted }]}>{t('dashboard.patientsInTrack')}</Text>
                <Text variant="mono" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[styles.kpiValue, { color: colors.textPrimary }]}>{patientsVal}</Text>
              </View>
              <View style={styles.kpiCell}>
                <Text variant="label" numberOfLines={1} adjustsFontSizeToFit style={[styles.kpiLabel, { color: colors.textMuted }]}>{t('dashboard.labTests')}</Text>
                <Text variant="mono" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[styles.kpiValue, { color: colors.textPrimary }]}>{samplesVal}</Text>
              </View>
              <View style={styles.kpiCell}>
                <Text variant="label" numberOfLines={1} adjustsFontSizeToFit style={[styles.kpiLabel, { color: colors.textMuted }]}>{t('dashboard.inventoryValue')}</Text>
                <Text variant="mono" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[styles.kpiValue, { color: colors.textPrimary }]}>{stockVal}</Text>
              </View>
            </View>
          </View>
        )}

        <Text variant="heading" style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {t('dashboard.quickActions')}
        </Text>

        <View style={styles.qaGrid} onLayout={() => {}}>
          {visibleActions.map((qa, index) => (
            <QuickActionTile
              key={index}
              title={qa.title}
              icon={qa.icon}
              locked={false}
              onPress={() => handleTilePress(qa.route, qa.perm)}
              onLockedPress={() => {}}
              style={{ width: '48%', minHeight: 48 }}
            />
          ))}
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
  overviewCard: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  overviewTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  kpi2x2Grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCell: {
    width: '48%',
    paddingVertical: 8,
  },
  kpiLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 22,
    fontFamily: 'JetBrainsMono_700Bold',
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
