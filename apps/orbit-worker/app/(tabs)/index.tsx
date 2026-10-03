// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@40labs/design-tokens';
import { t } from '@40labs/i18n';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('dashboard.title', 'sw')}</Text>
      <Text style={styles.subtitle}>Orbit Worker Home</Text>
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
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
