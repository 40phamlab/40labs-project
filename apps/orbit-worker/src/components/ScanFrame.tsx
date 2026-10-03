// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/02_DESIGN-TOKENS.md]
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface ScanFrameProps {
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function ScanFrame({ style, accessibilityLabel }: ScanFrameProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.frame, style]}
      accessibilityLabel={accessibilityLabel || 'Scan Frame'}
      accessibilityRole="image"
    >
      <View style={[styles.cornerTopLeft, { borderColor: colors.accent }]} />
      <View style={[styles.cornerTopRight, { borderColor: colors.accent }]} />
      <View style={[styles.cornerBottomLeft, { borderColor: colors.accent }]} />
      <View style={[styles.cornerBottomRight, { borderColor: colors.accent }]} />
      <View style={[styles.scanLine, { backgroundColor: colors.accent, opacity: 0.6 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: 240,
    height: 240,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 32,
    height: 32,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 32,
    height: 32,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanLine: {
    width: '100%',
    height: 2,
  },
});
