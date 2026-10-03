// [PHASE: MVP]
// [SPEC: Development-only Component Gallery]
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../src/theme/ThemeProvider';
import { useI18n } from '../src/i18n/I18nProvider';
import {
  ScreenHeader,
  StatusDot,
  CountBadge,
  Card,
  Tile,
  Chip,
  Fab,
  FabMenu,
  BottomTabBar,
  EmptyState,
  InlineError,
  ScanFrame,
} from '../src/components';

export default function GalleryScreen() {
  const { theme, setTheme, colors } = useTheme();
  const { language, setLanguage, t } = useI18n();
  const [fabMenuVisible, setFabMenuVisible] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceStrong }]}>
      <ScreenHeader
        title="Orbit Component Gallery"
        subtitle={`Theme: ${theme} | Lang: ${language}`}
        rightAction={
          <Chip
            label={theme === 'dark' ? 'Light' : 'Dark'}
            selected
            onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          />
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>1. StatusDots</Text>
        <View style={styles.row}>
          <StatusDot state="connected" label="Connected" />
          <StatusDot state="connecting" label="Connecting" />
          <StatusDot state="offline" label="Offline" />
          <StatusDot state="revoked" label="Revoked" />
        </View>

        <Text style={[styles.heading, { color: colors.textPrimary }]}>2. CountBadges</Text>
        <View style={styles.row}>
          <CountBadge count={3} />
          <CountBadge count={15} />
        </View>

        <Text style={[styles.heading, { color: colors.textPrimary }]}>3. Cards & Tiles</Text>
        <Card style={styles.mb}>
          <Text style={{ color: colors.textPrimary }}>Card Content</Text>
        </Card>
        <View style={styles.row}>
          <Tile title="Enabled Tile" value="123" state="enabled" />
          <Tile title="Locked Tile" value="456" state="locked" />
        </View>

        <Text style={[styles.heading, { color: colors.textPrimary }]}>4. Chips & FAB</Text>
        <View style={styles.row}>
          <Chip label="Unselected" />
          <Chip label="Selected" selected />
        </View>
        <View style={styles.row}>
          <Fab label="New Action" onPress={() => setFabMenuVisible(true)} />
        </View>

        <Text style={[styles.heading, { color: colors.textPrimary }]}>5. Empty State & Error</Text>
        <EmptyState title="No Records" description="Nothing found here" />
        <InlineError message="Failed to sync with hub" onRetry={() => {}} />

        <Text style={[styles.heading, { color: colors.textPrimary }]}>6. Scan Frame</Text>
        <View style={styles.center}>
          <ScanFrame />
        </View>
      </ScrollView>

      <FabMenu
        visible={fabMenuVisible}
        onClose={() => setFabMenuVisible(false)}
        items={[
          { id: '1', label: 'Action 1', onPress: () => {} },
          { id: '2', label: 'Action 2', onPress: () => {} },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  heading: {
    fontSize: 16,
    fontFamily: 'Sora_600SemiBold',
    marginTop: 20,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 10,
  },
  mb: {
    marginBottom: 12,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
});
