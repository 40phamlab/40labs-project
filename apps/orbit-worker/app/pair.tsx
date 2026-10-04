// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#pair]
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, radius } from '@40labs/design-tokens';
import { useI18n } from '../src/i18n/I18nProvider';
import { ScanFrame } from '../src/components/ScanFrame';
import { Fab } from '../src/components/Fab';
import { InlineError } from '../src/components/InlineError';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Device from 'expo-device';
import * as ImagePicker from 'expo-image-picker';
import { parsePairQr } from '../src/lib/qr-parser';
import { decodeQrFromImageUri } from '../src/lib/qr-scanner';
import { saveServerCredential } from '../src/lib/secure-store';
import { ApiClient } from '@40labs/api-client';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function PairScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pairingInProgress, setPairingInProgress] = useState(false);
  const [scanned, setScanned] = useState(false);

  const processAndPair = async (qrData: string) => {
    if (pairingInProgress) return;
    setPairingInProgress(true);
    setErrorMessage(null);

    try {
      const parsed = parsePairQr(qrData);

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
    } catch (err: any) {
      // SECURITY: Generic pairing failure message. Never reveal whether token is expired, used, or incorrect. Never log credential or token.
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
      setPairingInProgress(true);
      setErrorMessage(null);

      const qrData = await decodeQrFromImageUri(assetUri);
      await processAndPair(qrData);
    } catch (err: any) {
      setErrorMessage(err.message || t('pairing.uploadError'));
      setPairingInProgress(false);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>{t('pairing.scanToConnect')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {permission.granted ? (
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
      ) : (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>{t('pairing.cameraPermissionRequired')}</Text>
          <Fab label={t('pairing.grantPermission')} onPress={requestPermission} />
        </View>
      )}

      <View style={styles.uploadSection}>
        <Text style={[styles.orText, { color: colors.textMuted }]}>{t('pairing.or')}</Text>
        <TouchableOpacity
          style={[styles.uploadButton, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle }]}
          onPress={handleUploadQr}
          disabled={pairingInProgress}
        >
          <Ionicons name="image-outline" size={20} color={colors.actionPrimary} style={{ marginRight: 8 }} />
          <Text style={[styles.uploadButtonText, { color: colors.textPrimary }]}>{t('pairing.uploadQr')}</Text>
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
            <Text style={styles.footerText}>{t('pairing.inProgress')}</Text>
          </View>
        ) : (
          <Text style={styles.footerText}>{t('pairing.code')}</Text>
        )}
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
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  backButton: {
    padding: 8,
  },
  screenTitle: {
    fontSize: 16,
    fontFamily: 'Sora_600SemiBold',
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
    color: colors.accent,
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
  permissionText: {
    color: colors.textPrimary,
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
    borderRadius: radius.card,
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
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
