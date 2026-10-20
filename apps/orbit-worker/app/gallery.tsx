// [PHASE: MVP]
// [SPEC: Development-only Component Gallery]
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../src/theme/ThemeProvider';
import { Screen, AppHeader, Text } from '../src/ui';
import { useI18n } from '../src/i18n/I18nProvider';
import {
  StatusDot,
  CountBadge,
  Card,
  Tile,
  Chip,
  Fab,
  FabMenu,
  EmptyState,
  InlineError,
  ScanFrame,
} from '../src/components';

export default function GalleryScreen() {
  const { theme, setTheme, colors } = useTheme();
  const { language, t } = useI18n();
  const [fabMenuVisible, setFabMenuVisible] = useState(false);

  return (
    <Screen scrollable={false}>
      <AppHeader
        title="Orbit Component Gallery"
        rightAction={
          <Chip
            label={theme === 'dark' ? 'Light' : 'Dark'}
            selected
            onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          />
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="heading" style={styles.heading}>1. StatusDots</Text>
        <View style={styles.row}>
          <StatusDot state="connected" label="Connected" />
          <StatusDot state="connecting" label="Connecting" />
          <StatusDot state="offline" label="Offline" />
          <StatusDot state="revoked" label="Revoked" />
        </View>

        <Text variant="heading" style={styles.heading}>2. CountBadges</Text>
        <View style={styles.row}>
          <CountBadge count={3} />
          <CountBadge count={15} />
        </View>

        <Text variant="heading" style={styles.heading}>3. Cards & Tiles</Text>
        <Card style={styles.mb}>
          <Text>Card Content</Text>
        </Card>
        <View style={styles.row}>
          <Tile title="Enabled Tile" value="123" state="enabled" />
          <Tile title="Locked Tile" value="456" state="locked" />
        </View>

        <Text variant="heading" style={styles.heading}>4. Chips & FAB</Text>
        <View style={styles.row}>
          <Chip label="Unselected" />
          <Chip label="Selected" selected />
        </View>
        <View style={styles.row}>
          <Fab label="New Action" onPress={() => setFabMenuVisible(true)} />
        </View>

        <Text variant="heading" style={styles.heading}>5. Empty State & Error</Text>
        <EmptyState title="No Records" icon="folder-open-outline" />
        <InlineError message="Failed to sync with hub" onRetry={() => {}} />

        <Text variant="heading" style={styles.heading}>6. Scan Frame</Text>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  heading: {
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
