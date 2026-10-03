// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#history]
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@40labs/design-tokens';
import { useI18n } from '../../src/i18n/I18nProvider';

export default function HistoryScreen() {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('nav.history')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceStrong,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontFamily: 'Sora_600SemiBold',
  },
});
