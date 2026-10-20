// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md]
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface EmptyStateProps {
  title: string;
  icon?: string;
}

export function EmptyState({ title, icon = 'folder-open-outline' }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color={colors.textMuted} style={styles.icon} />
      <Text variant="heading" style={[styles.title, { color: colors.textMuted }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    textAlign: 'center',
  },
});
