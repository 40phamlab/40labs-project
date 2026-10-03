// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#pair]
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@40labs/design-tokens';
import { useI18n } from '../src/i18n/I18nProvider';
import { ScanFrame } from '../src/components/ScanFrame';
import { Fab } from '../src/components/Fab';
import { InlineError } from '../src/components/InlineError';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Device from 'expo-device';
import { parsePairQr } from '../src/lib/qr-parser';
import { saveServerCredential } from '../src/lib/secure-store';
import { ApiClient } from '@40labs/api-client';

export default function PairScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pairingInProgress, setPairingInProgress] = useState(false);
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>{t('pairing.cameraPermissionRequired')}</Text>
        <Fab label={t('pairing.grantPermission')} onPress={requestPermission} />
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || pairingInProgress) return;
    setScanned(true);
    setPairingInProgress(true);
    setErrorMessage(null);

    try {
      const parsed = parsePairQr(data);

      const client = new ApiClient({
        baseUrl: parsed.endpoint,
        transport: {
          request: async (opts) => {
            const response = await fetch(`${parsed.endpoint}${opts.path}`, {
              method: opts.method,
              headers: opts.headers,
              body: opts.body ? JSON.stringify(opts.body) : undefined,
              signal: opts.signal,
            });
            const resData = await response.json().catch(() => ({}));
            return {
              status: response.status,
              headers: {},
              data: resData,
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
        endpoint: parsed.endpoint,
        credential: response.credential,
        fp: parsed.fp,
      });

      router.replace('/(tabs)');
    } catch (err) {
      // SECURITY: Generic pairing failure message. Never reveal whether token is expired, used, or incorrect. Never log credential or token.
      setErrorMessage(t('pairing.failed'));
      setPairingInProgress(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.brandContainer}>
        <Text style={styles.brandTitle}>
          <Text style={{ color: colors.success }}>4</Text>
          <Text style={{ color: colors.accent }}>0</Text>
          <Text style={{ color: colors.textPrimary }}>Labs</Text>
        </Text>
        <Text style={styles.subtitle}>Orbit Worker</Text>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFill}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
        <ScanFrame />
        <Text style={styles.scanCaption}>{t('pairing.scan')}</Text>
      </View>

      {errorMessage && (
        <View style={styles.errorContainer}>
          <InlineError message={errorMessage} onRetry={() => setScanned(false)} />
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {pairingInProgress ? t('pairing.inProgress') : t('pairing.code')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceStrong,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  brandTitle: {
    fontSize: 32,
    fontFamily: 'Sora_700Bold',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.textSecondary,
    marginTop: 4,
  },
  cameraContainer: {
    width: 280,
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  scanCaption: {
    color: colors.accent,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    position: 'absolute',
    bottom: 16,
  },
  permissionText: {
    color: colors.textPrimary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  footer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
