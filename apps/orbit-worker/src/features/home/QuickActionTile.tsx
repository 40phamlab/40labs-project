// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../ui/Text';
import { radius } from '../../theme/rn-tokens';

interface QuickActionTileProps {
  title: string;
  icon: string;
  locked?: boolean;
  onPress: () => void;
  onLockedPress: () => void;
  style?: ViewStyle;
}

export function QuickActionTile({
  title,
  icon,
  locked,
  onPress,
  onLockedPress,
  style,
}: QuickActionTileProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={locked ? onLockedPress : onPress}
      style={[
        styles.tile,
        {
          backgroundColor: locked ? colors.surfaceDisabled : colors.surfaceSecondary,
          borderColor: colors.borderSubtle,
          borderRadius: radius.card,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: locked }}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={locked ? 'lock-closed' : icon}
          size={24}
          color={locked ? colors.textDisabled : colors.actionPrimary}
        />
      </View>
      <Text
        style={[
          styles.title,
          { color: locked ? colors.textDisabled : colors.textPrimary },
        ]}
        numberOfLines={2}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    height: 96,
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderWidth: 1,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
});
