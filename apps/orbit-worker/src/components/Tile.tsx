// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/02_DESIGN-TOKENS.md]
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { useElevation } from '../theme/useElevation';
import { radius } from '@40labs/design-tokens';

export type TileState = 'enabled' | 'disabled' | 'pressed' | 'locked';

interface TileProps {
  title: string;
  value?: string | number;
  state?: TileState;
  onPress?: () => void;
  onLockedPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function Tile({
  title,
  value,
  state = 'enabled',
  onPress,
  onLockedPress,
  style,
  accessibilityLabel,
}: TileProps) {
  const { colors } = useTheme();
  const raisedStyle = useElevation('raised');
  const pressedStyle = useElevation('pressed');

  const isDisabled = state === 'disabled' || state === 'locked';
  const isPressed = state === 'pressed';

  const handlePress = () => {
    if (state === 'locked' && onLockedPress) {
      onLockedPress();
    } else if (!isDisabled && onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled && state !== 'locked'}
      onPress={handlePress}
      style={[
        styles.tile,
        {
          backgroundColor: isDisabled ? colors.surfaceDisabled : colors.surfaceSecondary,
          borderColor: colors.borderSubtle,
          minHeight: 48,
          minWidth: 48,
        },
        isPressed || isDisabled ? pressedStyle : raisedStyle,
        style,
      ]}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isPressed }}
    >
      {state === 'locked' && (
        <Ionicons name="lock-closed" size={16} color={colors.textDisabled} style={styles.icon} />
      )}
      <Text
        style={[
          styles.title,
          { color: isDisabled ? colors.textDisabled : colors.textSecondary },
        ]}
      >
        {title}
      </Text>
      {value !== undefined && (
        <Text
          style={[
            styles.value,
            { color: isDisabled ? colors.textDisabled : colors.textPrimary },
          ]}
        >
          {value}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  icon: {
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontFamily: 'JetBrainsMono_500Medium',
  },
});
