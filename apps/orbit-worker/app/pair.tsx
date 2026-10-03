// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#pair]
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@40labs/design-tokens';
import { useI18n } from '../src/i18n/I18nProvider';
import { ScanFrame } from '../src/components/ScanFrame';
import { Fab } from '../src/components/Fab';
import { useRouter } from 'expo-router';

export default function PairScreen() {
  const { t } = useI18n();
  const router = useRouter();

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

      <View style={styles.scanContainer}>
        <ScanFrame />
        <Text style={styles.scanCaption}>{t('pairing.scan')}</Text>
      </View>

      <View style={styles.footer}>
        <Fab
          label={t('pairing.title')}
          icon="qr-code-outline"
          onPress={() => router.replace('/(tabs)')}
        />
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
    marginTop: 48,
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
  scanContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCaption: {
    color: colors.accent,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginTop: 24,
  },
  footer: {
    marginBottom: 48,
    width: '100%',
    alignItems: 'center',
  },
});
