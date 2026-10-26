// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md]
import React, { ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: ReactNode;
}

export function AppHeader({ title, onBack, rightAction }: AppHeaderProps) {
  const { colors } = useTheme();
  let insets = { top: 0, bottom: 0, left: 0, right: 0 };
  try {
    insets = useSafeAreaInsets();
  } catch {
    // fallback for test environments without SafeAreaProvider
  }

  const totalHeight = 56 + insets.top;

  return (
    <View
      testID="app-header"
      style={[
        styles.header,
        {
          paddingTop: insets.top,
          height: totalHeight,
          minHeight: totalHeight,
          maxHeight: totalHeight,
          backgroundColor: colors.surfacePrimary,
          borderBottomColor: colors.borderSubtle,
        },
      ]}
    >
      <View style={styles.left}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        <Text variant="heading" style={styles.title}>
          {title}
        </Text>
      </View>
      {rightAction && <View style={styles.right}>{rightAction}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    width: '100%',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    marginRight: 12,
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
