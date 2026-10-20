// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md]
import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { radius as r } from '../theme/rn-tokens';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 20, radius = r.sm, style }: SkeletonProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius,
          backgroundColor: colors.surfaceHover,
        },
        style,
      ]}
    />
  );
}
