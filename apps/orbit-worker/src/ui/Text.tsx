// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md]
import React from 'react';
import { Text as RNText, TextProps as RNTextProps, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export interface TextProps extends RNTextProps {
  variant?: 'body' | 'title' | 'heading' | 'mono' | 'label';
}

export function Text({ style, variant = 'body', ...props }: TextProps) {
  const { colors } = useTheme();

  const getStyle = () => {
    switch (variant) {
      case 'title':
      case 'heading':
        return { fontFamily: 'Sora_600SemiBold', color: colors.textPrimary };
      case 'mono':
        return { fontFamily: Platform.OS === 'web' ? 'JetBrainsMono, monospace' : 'JetBrainsMono_700Bold', color: colors.textPrimary };
      case 'label':
        return { fontFamily: 'Inter_600SemiBold', color: colors.textMuted };
      case 'body':
      default:
        return { fontFamily: 'Inter_400Regular', color: colors.textPrimary };
    }
  };

  return <RNText maxFontSizeMultiplier={1.3} style={[getStyle(), style]} {...props} />;
}
