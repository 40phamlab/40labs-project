// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md]
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { radius as r } from '../theme/rn-tokens';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface BannerProps {
  title: string;
  variant?: 'offline' | 'cached' | 'warning';
}

export function Banner({ title, variant = 'offline' }: BannerProps) {
  const { colors } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'cached':
        return { bg: colors.surfaceSecondary, border: colors.borderSubtle, text: colors.accentOrange };
      case 'warning':
        return { bg: colors.warningBg, border: colors.warningBorder, text: colors.warning };
      case 'offline':
      default:
        return { bg: colors.dangerBg, border: colors.dangerBorder, text: colors.danger };
    }
  };

  const c = getColors();

  return (
    <View style={[styles.banner, { backgroundColor: c.bg, borderColor: c.border, borderRadius: r.card }]}>
      <Ionicons name={variant === 'offline' ? 'cloud-offline-outline' : 'save-outline'} size={18} color={c.text} style={styles.icon} />
      <Text style={[styles.text, { color: c.text }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
});
