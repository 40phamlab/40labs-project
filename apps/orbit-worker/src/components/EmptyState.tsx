// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/02_DESIGN-TOKENS.md]
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function EmptyState({ title, description, icon = 'folder-open-outline', style, accessibilityLabel }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.container, style]}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="summary"
    >
      <Ionicons name={icon} size={48} color={colors.textMuted} style={styles.icon} />
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {description && <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 120,
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Sora_600SemiBold',
    textAlign: 'center',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
