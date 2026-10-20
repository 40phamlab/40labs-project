// [PHASE: Developer Inspector]
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../src/theme/ThemeProvider';
import { Screen, AppHeader, Text } from '../src/ui';
import { Card, Fab } from '../src/components';
import { getDatabase } from '../src/db/outbox';
import { flush, enqueue } from '../src/lib/outbox-sync';

export default function OutboxInspectorScreen() {
  const { colors } = useTheme();
  const [items, setItems] = useState<any[]>([]);

  const loadItems = () => {
    try {
      const db = getDatabase();
      const rows = db.getAllSync(`SELECT * FROM outbox ORDER BY created_at DESC;`);
      setItems(rows || []);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <Screen scrollable={false}>
      <AppHeader title="Outbox Inspector" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.actions}>
          <Fab label="Enqueue Test Item" onPress={async () => {
            await enqueue('customer_create', { fullName: 'Test Customer', phone: '0700000000' });
            loadItems();
          }} />
          <Fab label="Flush Outbox" onPress={async () => {
            await flush();
            loadItems();
          }} />
        </View>

        {items.map((item) => (
          <Card key={item.id} style={styles.itemCard}>
            <Text variant="mono" style={{ fontSize: 12 }}>ID: {item.id}</Text>
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>Kind: {item.kind} | Status: {item.status}</Text>
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>Attempts: {item.attempts} | Error: {item.last_error || 'None'}</Text>
            <Text variant="mono" style={{ fontSize: 11, color: colors.textMuted, marginTop: 8 }}>{item.payload_json}</Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  itemCard: {
    marginBottom: 12,
  },
  metaText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginTop: 4,
  },
});
