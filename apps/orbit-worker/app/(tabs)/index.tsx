// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { colors, radius } from '@40labs/design-tokens';
import { useI18n } from '../../src/i18n/I18nProvider';
import { ScreenHeader, StatusDot, CountBadge, Card, Tile, InlineError } from '../../src/components';
import { useConnectionStore } from '../../src/stores/connection';
import { getServerCredential } from '../../src/lib/secure-store';
import { ApiClient } from '@40labs/api-client';
import { putCache, getCache, CacheResult } from '../../src/db/cache';
import { useRouter } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function HomeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { status, permissions, userInfo, activeBusinessId } = useConnectionStore();
  const [summary, setSummary] = useState<any>(null);
  const [cacheMeta, setCacheMeta] = useState<CacheResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSummary = async () => {
    if (!activeBusinessId || status === 'unpaired') return;
    const server = await getServerCredential(activeBusinessId);
    if (!server) return;

    setLoading(true);
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
        path: '/api/v1/me/summary',
        headers: {
          Authorization: `Bearer ${server.credential}`,
        },
      });

      setSummary(data);
      putCache('home_summary', data);
      setCacheMeta(null);
    } catch (err: any) {
      const cached = getCache<any>('home_summary');
      if (cached) {
        setSummary(cached.data);
        setCacheMeta(cached);
      } else {
        setErrorMessage(t('dashboard.errorLoading'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    useConnectionStore.getState().initialize();
  }, []);

  useEffect(() => {
    if (status === 'connected') {
      fetchSummary();
    } else if (status === 'unreachable') {
      const cached = getCache<any>('home_summary');
      if (cached) {
        setSummary(cached.data);
        setCacheMeta(cached);
      }
    }
  }, [status, activeBusinessId]);

  const hasPermission = (key: string) => {
    return permissions.includes(key) || (permissions as any)[key] === true;
  };

  const handleTilePress = (title: string, permKey: string) => {
    if (status === 'unpaired') {
      router.push('/pair');
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

  if (status === 'unpaired') {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="Orbit Worker"
          subtitle={t('dashboard.title')}
          rightAction={
            <View style={styles.headerRight}>
              <StatusDot state="offline" />
            </View>
          }
        />
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.notConnectedCard}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={[styles.notConnectedTitle, { color: colors.textPrimary }]}>{t('pairing.notConnected')}</Text>
            <Text style={[styles.notConnectedSubtitle, { color: colors.textMuted }]}>{t('pairing.connectPrompt')}</Text>
            <TouchableOpacity
              style={[styles.connectButton, { backgroundColor: colors.actionPrimary }]}
              onPress={() => router.push('/pair')}
            >
              <Ionicons name="qr-code-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.connectButtonText}>{t('pairing.scanToConnect')}</Text>
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={userInfo?.name || 'Daktari / Mwuzaji'}
        subtitle={userInfo?.role || t('dashboard.title')}
        rightAction={
          <View style={styles.headerRight}>
            <StatusDot state={status === 'connected' ? 'connected' : status === 'connecting' ? 'connecting' : 'offline'} />
            <CountBadge count={summary?.unreadNotifications || 0} />
          </View>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        {cacheMeta && (
          <View style={styles.cacheBanner}>
            <Text style={styles.cacheText}>
              Offline mode - displaying cached data as of {cacheMeta.asOfText}
            </Text>
          </View>
        )}

        {errorMessage && (
          <View style={styles.errorContainer}>
            <InlineError message={errorMessage} onRetry={fetchSummary} />
          </View>
        )}

        <Card style={styles.todayCard}>
          <Text style={styles.sectionTitle}>{t('dashboard.overview')}</Text>
          <View style={styles.statsGrid}>
            <TouchableOpacity style={styles.statItem} onPress={() => router.push('/(tabs)/history?filter=sales')}>
              <Text style={styles.statLabel}>{t('dashboard.todaysSales')}</Text>
              <Text style={styles.statValue}>TZS {summary?.sales?.toLocaleString() || '0'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem} onPress={() => router.push('/(tabs)/history?filter=patients')}>
              <Text style={styles.statLabel}>{t('dashboard.patientsInTrack')}</Text>
              <Text style={styles.statValue}>{summary?.patients || 0}</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.statsGrid, { marginTop: 12 }]}>
            <TouchableOpacity style={styles.statItem} onPress={() => router.push('/(tabs)/history?filter=lab')}>
              <Text style={styles.statLabel}>{t('dashboard.labTests')}</Text>
              <Text style={styles.statValue}>{summary?.samples || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statItem} onPress={() => router.push('/(tabs)/history?filter=stock')}>
              <Text style={styles.statLabel}>{t('dashboard.inventoryValue')}</Text>
              <Text style={styles.statValue}>{summary?.lowStockCount || 0} low</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>{t('dashboard.quickActions')}</Text>
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
  cacheBanner: {
    backgroundColor: colors.surfaceSecondary,
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  cacheText: {
    color: colors.accent,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  errorContainer: {
    marginBottom: 12,
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
  notConnectedCard: {
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
  },
  notConnectedTitle: {
    fontSize: 18,
    fontFamily: 'Sora_600SemiBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  notConnectedSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  connectButton: {
    width: '100%',
    height: 48,
    borderRadius: radius.card,
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
