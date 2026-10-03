// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/02_DESIGN-TOKENS.md]
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';
import { radius } from '@40labs/design-tokens';

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function InlineError({ message, onRetry, style, accessibilityLabel }: InlineErrorProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.dangerBg,
          borderColor: colors.dangerBorder,
          minHeight: 48,
        },
        style,
      ]}
      accessibilityLabel={accessibilityLabel || message}
      accessibilityRole="alert"
    >
      <Ionicons name="alert-circle" size={20} color={colors.danger} style={styles.icon} />
      <Text style={[styles.message, { color: colors.danger }]}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={[styles.retryBtn, { minHeight: 48, minWidth: 48 }]}
          accessibilityRole="button"
          accessibilityLabel="Retry"
        >
          <Text style={[styles.retryText, { color: colors.danger }]}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  icon: {
    marginRight: 8,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  retryBtn: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  retryText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
