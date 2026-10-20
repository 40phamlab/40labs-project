// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md]
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { radius as r } from '../theme/rn-tokens';

interface StatusPillProps {
  status: 'success' | 'warning' | 'danger' | 'info';
  label: string;
}

export function StatusPill({ status, label }: StatusPillProps) {
  const { colors } = useTheme();

  const getColors = () => {
    switch (status) {
      case 'success':
        return { bg: colors.successBg, text: colors.success, border: colors.successBorder };
      case 'warning':
        return { bg: colors.warningBg, text: colors.warning, border: colors.warningBorder };
      case 'danger':
        return { bg: colors.dangerBg, text: colors.danger, border: colors.dangerBorder };
      case 'info':
      default:
        return { bg: colors.infoBg, text: colors.info, border: colors.infoBorder };
    }
  };

  const c = getColors();

  return (
    <View style={[styles.pill, { backgroundColor: c.bg, borderColor: c.border, borderRadius: r.pill }]}>
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
});
