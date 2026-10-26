// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#pair]
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Platform } from 'react-native';
import { useTheme } from '../src/theme/ThemeProvider';
import { radius } from '../src/theme/rn-tokens';
import { Screen, AppHeader, Text } from '../src/ui';
import { useI18n } from '../src/i18n/I18nProvider';
import { ScanFrame } from '../src/components/ScanFrame';
import { Fab } from '../src/components/Fab';
import { InlineError } from '../src/components/InlineError';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Device from 'expo-device';
import * as ImagePicker from 'expo-image-picker';
import { ParsedPairQr, parsePairQr } from '../src/lib/qr-parser';
import { decodeQrFromImageUri } from '../src/lib/qr-scanner';
import { saveServerCredential } from '../src/lib/secure-store';
import { pinnedFetch, pinnedFetchFromEndpoints } from '../src/lib/pinned-transport';
import { ApiClient } from '@40labs/api-client';
import { useConnectionStore } from '../src/stores/connection';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function PairScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pairingInProgress, setPairingInProgress] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [networkSetup, setNetworkSetup] = useState(false);
  const [pendingPairQr, setPendingPairQr] = useState<{ qrData: string; parsed: ParsedPairQr } | null>(null);
  const [networkChoice, setNetworkChoice] = useState<'pc_hotspot' | 'same_wifi'>('pc_hotspot');

  const processAndPair = async (qrData: string) => {
    if (pairingInProgress) return;
    setPairingInProgress(true);
    setErrorMessage(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const parsed = parsePairQr(qrData);
      setPendingPairQr({ qrData, parsed });
      setNetworkSetup(false);

      let health;
      try {
        health = await pinnedFetchFromEndpoints(
          parsed.endpoints,
          '/api/pairing/health',
          { method: 'GET', signal: controller.signal },
          parsed.fp,
        );
      } catch (fetchErr: any) {
        console.error('[OrbitWorker Pairing Raw Fetch Error]:', fetchErr);
        const errMsg = fetchErr?.message || String(fetchErr);
        if (errMsg.includes('aborted') || errMsg.includes('timeout')) {
          throw new Error('TIMEOUT: Pairing request timed out after 8s. Check Wi-Fi connection.');
        } else if (errMsg.includes('cleartext') || errMsg.includes('CLEARTEXT')) {
          throw new Error('CLEARTEXT_BLOCKED: Cleartext HTTP traffic is blocked on Android. Use HTTPS.');
        } else if (errMsg.includes('SSL') || errMsg.includes('TLS') || errMsg.includes('pin') || errMsg.includes('certificate')) {
          throw new Error('TLS_FAILED: TLS handshake or fingerprint pinning failed.');
        } else if (errMsg.includes('ECONNREFUSED') || errMsg.includes('Network request failed') || errMsg.includes('Failed to fetch')) {
          throw new Error('REFUSED: Connection refused. Ensure desktop hub is running on hotspot.');
        } else {
          throw new Error(`BAD_SESSION: Unable to connect (${errMsg}).`);
        }
      } finally {
        clearTimeout(timeoutId);
      }

      if (!health.response.ok) throw new Error('ORBIT_NETWORK_UNREACHABLE');
      const selectedEndpoint = health.endpoint;

      const client = new ApiClient({
        baseUrl: selectedEndpoint,
        transport: {
          request: async (opts) => {
            const response = await pinnedFetch(opts.path, {
              method: opts.method,
              headers: opts.headers as Record<string, string>,
              body: opts.body ? JSON.stringify(opts.body) : undefined,
              signal: opts.signal,
            }, parsed.fp);
            const resData = await response.json().catch(() => ({}));
            return {
              status: response.status,
              headers: {},
              data: resData as any,
            };
          },
        },
      });

      const response = await client.pairDevice({
        sessionId: parsed.sessionId,
        token: parsed.token,
        deviceLabel: Device.deviceName || 'Orbit Worker Phone',
        deviceType: 'phone',
      });

      await saveServerCredential({
        businessId: response.businessId || parsed.sessionId,
        businessName: 'Pharmacy Hub',
        endpoint: selectedEndpoint,
        endpoints: parsed.endpoints,
        credential: response.credential,
        fp: parsed.fp,
      });

      await useConnectionStore.getState().initialize();
      setPendingPairQr(null);
      setNetworkSetup(false);
      router.replace('/(tabs)');
    } catch (err: any) {
      if (err instanceof Error && err.message === 'ORBIT_NETWORK_UNREACHABLE') {
        setNetworkSetup(true);
        setPairingInProgress(false);
        setScanned(false);
        return;
      }
      setErrorMessage(err.message && err.message.includes('QR') ? err.message : t('pairing.failed'));
      setPairingInProgress(false);
      setScanned(false);
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || pairingInProgress) return;
    setScanned(true);
    await processAndPair(data);
  };

  const handleUploadQr = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const assetUri = result.assets[0].uri;
      setErrorMessage(null);

      const qrData = await decodeQrFromImageUri(assetUri);
      await processAndPair(qrData);
    } catch (err: any) {
      setErrorMessage(err.message || t('pairing.uploadError'));
      setPairingInProgress(false);
    }
  };

  const openWifiSettings = async () => {
    if (Platform.OS !== 'android') return;
    try {
      await Linking.sendIntent('android.settings.WIFI_SETTINGS');
    } catch {
      setErrorMessage(t('pairing.openWifiSettingsFailed'));
    }
  };

  const retryPendingPairing = async () => {
    if (pendingPairQr) await processAndPair(pendingPairQr.qrData);
  };

  if (!permission) {
    return <Screen scrollable={false} />;
  }

  return (
    <Screen scrollable={false} contentContainerStyle={styles.screenInner}>
      <AppHeader
        title={t('pairing.scanToConnect')}
        onBack={() => router.back()}
      />

      <View style={styles.contentBody}>
        {networkSetup && pendingPairQr ? (
          <View style={styles.networkSetupContainer}>
            <Ionicons name="wifi-outline" size={42} color={colors.actionPrimary} />
            <Text variant="heading" style={styles.networkSetupTitle}>{t('pairing.networkSetupTitle')}</Text>
            <Text style={[styles.networkSetupBody, { color: colors.textSecondary }]}>{t('pairing.networkSetupBody')}</Text>
            <TouchableOpacity
              accessibilityRole="radio"
              accessibilityState={{ selected: networkChoice === 'pc_hotspot' }}
              style={[styles.networkOption, { backgroundColor: colors.surfaceSecondary, borderColor: networkChoice === 'pc_hotspot' ? colors.actionPrimary : colors.borderSubtle, borderRadius: radius.card }]}
              onPress={() => setNetworkChoice('pc_hotspot')}
            >
              <Text style={styles.networkOptionTitle}>{t('pairing.pcHotspot')}</Text>
              <Text style={[styles.networkOptionHelp, { color: colors.textSecondary }]}>{t('pairing.pcHotspotHelp')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="radio"
              accessibilityState={{ selected: networkChoice === 'same_wifi' }}
              style={[styles.networkOption, { backgroundColor: colors.surfaceSecondary, borderColor: networkChoice === 'same_wifi' ? colors.actionPrimary : colors.borderSubtle, borderRadius: radius.card }]}
              onPress={() => setNetworkChoice('same_wifi')}
            >
              <Text style={styles.networkOptionTitle}>{t('pairing.sameWifi')}</Text>
              <Text style={[styles.networkOptionHelp, { color: colors.textSecondary }]}>{t('pairing.sameWifiHelp')}</Text>
            </TouchableOpacity>
            {Platform.OS === 'android' && (
              <TouchableOpacity style={styles.settingsLink} onPress={openWifiSettings}>
                <Text style={[styles.settingsLinkText, { color: colors.actionPrimary }]}>{t('pairing.openWifiSettings')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.actionPrimary, borderRadius: radius.card }]} onPress={retryPendingPairing} disabled={pairingInProgress}>
              {pairingInProgress ? <ActivityIndicator color="#fff" /> : <Text style={styles.retryButtonText}>{t('pairing.retryConnection')}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsLink} onPress={() => { setPendingPairQr(null); setNetworkSetup(false); setScanned(false); }}>
              <Text style={[styles.settingsLinkText, { color: colors.textSecondary }]}>{t('pairing.scanAnotherQr')}</Text>
            </TouchableOpacity>
          </View>
        ) : permission.granted ? (
          <View style={styles.cameraContainer}>
            <CameraView
              style={StyleSheet.absoluteFill}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            />
            <ScanFrame />
            <Text style={[styles.scanCaption, { color: colors.accent }]}>{t('pairing.scan')}</Text>
          </View>
        ) : (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>{t('pairing.cameraPermissionRequired')}</Text>
            <Fab label={t('pairing.grantPermission')} onPress={requestPermission} />
          </View>
        )}

        <View style={styles.uploadSection}>
          <Text style={[styles.orText, { color: colors.textMuted }]}>{t('pairing.or')}</Text>
          <TouchableOpacity
            style={[styles.uploadButton, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
            onPress={handleUploadQr}
            disabled={pairingInProgress}
          >
            <Ionicons name="image-outline" size={20} color={colors.actionPrimary} style={{ marginRight: 8 }} />
            <Text style={styles.uploadButtonText}>{t('pairing.uploadQr')}</Text>
          </TouchableOpacity>
        </View>

        {errorMessage && (
          <View style={styles.errorContainer}>
            <InlineError message={errorMessage} onRetry={() => setScanned(false)} />
          </View>
        )}

        <View style={styles.footer}>
          {pairingInProgress ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color={colors.actionPrimary} />
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t('pairing.inProgress')}</Text>
            </View>
          ) : (
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t('pairing.code')}</Text>
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenInner: {
    padding: 0,
  },
  contentBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
  },
  cameraContainer: {
    width: 260,
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    marginVertical: 12,
  },
  scanCaption: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    position: 'absolute',
    bottom: 16,
  },
  permissionContainer: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  networkSetupContainer: { width: '100%', flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  networkSetupTitle: { fontSize: 20, textAlign: 'center' },
  networkSetupBody: { fontSize: 14, textAlign: 'center', lineHeight: 20, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  networkOption: { width: '100%', borderWidth: 1.5, padding: 14, gap: 4 },
  networkOptionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  networkOptionHelp: { fontSize: 13, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  settingsLink: { paddingVertical: 8 },
  settingsLinkText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  retryButton: { minHeight: 48, width: '100%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  retryButtonText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  permissionText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Inter_400Regular',
  },
  uploadSection: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  orText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  uploadButton: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  errorContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  footer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
