// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme } from '../../src/theme/ThemeProvider';
import { radius } from '../../src/theme/rn-tokens';
import { Screen, AppHeader, Text, Skeleton, Banner } from '../../src/ui';
import { useI18n } from '../../src/i18n/I18nProvider';
import { StatusDot, CountBadge, Card, Tile, InlineError } from '../../src/components';
import { useConnectionStore } from '../../src/stores/connection';
import { useSummary, getCachedMeta } from '../../src/hooks/useQueries';
import { useRouter } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const { status, permissions, activeBusinessId } = useConnectionStore();

  const { data: summary, isLoading, isError, error, refetch, isRefetching } = useSummary();
  const cacheMeta = getCachedMeta('home_summary');

  useEffect(() => {
    useConnectionStore.getState().initialize();
  }, []);

  const hasPermission = (key: string) => {
    return permissions.includes(key) || (permissions as any)[key] === true;
  };

  const handleTilePress = (title: string, permKey: string) => {
    if (status === 'unpaired') {
      Alert.alert('Not Connected', 'Please connect to your desktop computer first using "Scan to Connect".');
      return;
    }
    if (!hasPermission(permKey) && status === 'connected') {
      Alert.alert('Permission Denied', `You do not have permission (${permKey}) to perform this action.`);
      return;
    }
    if (permKey === 'can_update_stock' || permKey === 'can_view_stock') {
      router.push('/stock');
    } else if (permKey === 'can_add_lab_sample') {
      router.push('/lab-sample');
    } else if (permKey === 'can_record_lab_result') {
      router.push('/lab-result');
    } else if (permKey === 'can_create_sale') {
      router.push('/pos');
    } else {
      Alert.alert(title, t('dashboard.comingSoon'));
    }
  };

  return (
    <Screen scrollable={false}>
      <AppHeader
        title={t('dashboard.title')}
        rightAction={
          <View style={styles.headerRight}>
            <StatusDot state={status === 'connected' ? 'connected' : status === 'connecting' ? 'connecting' : 'offline'} />
            <CountBadge count={summary?.unreadNotifications || 0} />
          </View>
        }
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.actionPrimary} />}
      >
        {status === 'unpaired' && (
          <Card style={[styles.connectBanner, { backgroundColor: colors.surfacePrimary, borderColor: colors.actionPrimary }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="desktop-outline" size={28} color={colors.actionPrimary} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.connectBannerTitle, { color: colors.textPrimary }]}>Connect to Computer</Text>
                <Text style={[styles.connectBannerDesc, { color: colors.textMuted }]}>{t('pairing.notConnected')}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.connectButton, { backgroundColor: colors.actionPrimary, borderRadius: radius.card }]}
              onPress={() => router.push('/pair')}
              accessibilityLabel="Scan to Connect Simply Connect"
            >
              <Ionicons name="qr-code-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.connectButtonText}>{t('pairing.scanToConnect')} (Simply Connect)</Text>
            </TouchableOpacity>
          </Card>
        )}

        {cacheMeta && status !== 'unpaired' && !summary && (
          <Banner title={`Offline mode - cached data as of ${cacheMeta.asOfText}`} variant="cached" />
        )}

        {isError && !summary && (
          <View style={styles.errorContainer}>
            <InlineError message={error?.message || t('dashboard.errorLoading')} onRetry={() => refetch()} />
          </View>
        )}

        {isLoading && !summary ? (
          <Card style={styles.todayCard}>
            <Skeleton height={24} style={{ marginBottom: 16 }} />
            <View style={styles.statsGrid}>
              <Skeleton width="45%" height={50} />
              <Skeleton width="45%" height={50} />
            </View>
            <View style={[styles.statsGrid, { marginTop: 12 }]}>
              <Skeleton width="45%" height={50} />
              <Skeleton width="45%" height={50} />
            </View>
          </Card>
        ) : (
          <Card style={styles.todayCard}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('dashboard.overview')}</Text>
            <View style={styles.statsGrid}>
              <TouchableOpacity style={styles.statItem} onPress={() => router.push('/(tabs)/history?filter=sales')}>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('dashboard.todaysSales')}</Text>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>TZS {summary?.sales?.toLocaleString() || '0'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statItem} onPress={() => router.push('/(tabs)/history?filter=patients')}>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('dashboard.patientsInTrack')}</Text>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{summary?.patients || 0}</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.statsGrid, { marginTop: 12 }]}>
              <TouchableOpacity style={styles.statItem} onPress={() => router.push('/(tabs)/history?filter=lab')}>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('dashboard.labTests')}</Text>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{summary?.samples || 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statItem} onPress={() => router.push('/(tabs)/history?filter=stock')}>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('dashboard.inventoryValue')}</Text>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>TZS {summary?.stockValue?.toLocaleString() || '0'}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('dashboard.quickActions')}</Text>
        <View style={styles.tilesGrid}>
          <Tile
            title={t('dashboard.addStock')}
            value="Stock"
            state={hasPermission('can_update_stock') || status !== 'connected' ? 'enabled' : 'locked'}
            onPress={() => handleTilePress(t('dashboard.addStock'), 'can_update_stock')}
          />
          <Tile
            title={t('dashboard.addPatient')}
            value="Patient"
            state={hasPermission('can_manage_customers') || status !== 'connected' ? 'enabled' : 'locked'}
            onPress={() => handleTilePress(t('dashboard.addPatient'), 'can_manage_customers')}
          />
          <Tile
            title={t('dashboard.newSale')}
            value="POS"
            state={hasPermission('can_create_sale') || status !== 'connected' ? 'enabled' : 'locked'}
            onPress={() => handleTilePress(t('dashboard.newSale'), 'can_create_sale')}
          />
          <Tile
            title={t('dashboard.viewReports')}
            value="Stock"
            state={hasPermission('can_view_stock') || status !== 'connected' ? 'enabled' : 'locked'}
            onPress={() => handleTilePress(t('dashboard.viewReports'), 'can_view_stock')}
          />
          <Tile
            title={t('dashboard.labTests')}
            value="Lab"
            state={hasPermission('can_record_lab_result') || status !== 'connected' ? 'enabled' : 'locked'}
            onPress={() => handleTilePress(t('dashboard.labTests'), 'can_record_lab_result')}
          />
          <Tile
            title={t('dashboard.businessHealth')}
            value="Alerts"
            state={hasPermission('can_send_notifications') || status !== 'connected' ? 'enabled' : 'locked'}
            onPress={() => handleTilePress(t('dashboard.businessHealth'), 'can_send_notifications')}
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
  connectBanner: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  connectBannerTitle: {
    fontSize: 16,
    fontFamily: 'Sora_600SemiBold',
    marginBottom: 2,
  },
  connectBannerDesc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  errorContainer: {
    marginBottom: 12,
  },
  todayCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Sora_600SemiBold',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  statValue: {
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
  connectButton: {
    width: '100%',
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
