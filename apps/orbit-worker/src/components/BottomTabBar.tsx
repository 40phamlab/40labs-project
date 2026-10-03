// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/02_DESIGN-TOKENS.md]
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeProvider';
import { useElevation } from '../theme/useElevation';

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
  const raisedStyle = useElevation('raised');

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderSubtle,
        },
        raisedStyle,
        style,
      ]}
      accessibilityRole="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const iconName = isActive ? tab.activeIcon : tab.icon;

        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, { minHeight: 48, minWidth: 48 }]}
            onPress={() => onTabPress(tab.id)}
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Ionicons
              name={iconName}
              size={22}
              color={isActive ? colors.accent : colors.textMuted}
            />
            <Text
              style={[
                styles.label,
                { color: isActive ? colors.accent : colors.textMuted },
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
    flexDirection: 'row',
    height: 64,
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
  label: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    marginTop: 4,
  },
});
