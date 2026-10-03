// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#settings]
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@40labs/design-tokens';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
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
