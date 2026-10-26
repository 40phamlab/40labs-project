// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/02_DESIGN-TOKENS.md]
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';
import { useElevation } from '../theme/useElevation';
import { CountBadge } from './CountBadge';

export interface TabItem {
  id: string;
  label: string;
  icon: string;
  activeIcon: string;
  badgeCount?: number;
}

interface BottomTabBarProps {
  tabs: TabItem[];
  activeTabId: string;
  onTabPress: (id: string) => void;
  style?: ViewStyle;
}

export function BottomTabBar({ tabs, activeTabId, onTabPress, style }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const raisedStyle = useElevation('raised');

  return (
    <View
      testID="bottom-tab-bar"
      style={[
        styles.bar,
        {
          backgroundColor: colors.tabContainer,
          borderTopColor: colors.borderSubtle,
          paddingBottom: insets.bottom,
          height: 56 + insets.bottom,
        },
        raisedStyle,
        style,
      ]}
      accessibilityRole="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const iconName = isActive ? tab.activeIcon : tab.icon;
        const color = isActive ? colors.actionPrimary : colors.textMuted;

        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, { minHeight: 48, minWidth: 48 }]}
            onPress={() => onTabPress(tab.id)}
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <View style={styles.iconContainer}>
              <Ionicons name={iconName} size={20} color={color} />
              {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                <View style={styles.badgeWrapper}>
                  <CountBadge count={tab.badgeCount} />
                </View>
              )}
            </View>
            <Text
              style={[
                styles.label,
                { color },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeWrapper: {
    position: 'absolute',
    top: -4,
    right: -10,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
});
