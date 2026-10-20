// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md]
import React from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { radius as r } from '../theme/rn-tokens';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const { colors } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return colors.surfaceDisabled;
    switch (variant) {
      case 'secondary':
        return colors.surfaceSecondary;
      case 'danger':
        return colors.danger;
      case 'primary':
      default:
        return colors.actionPrimary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textDisabled;
    if (variant === 'secondary') return colors.textPrimary;
    return colors.textOnDark;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: variant === 'secondary' ? colors.borderDefault : 'transparent',
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderRadius: r.card,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  text: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
