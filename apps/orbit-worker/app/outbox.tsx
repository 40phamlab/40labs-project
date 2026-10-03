// [PHASE: Developer Inspector]
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '@40labs/design-tokens';
import { ScreenHeader, Card, Fab } from '../src/components';
import { getDatabase } from '../src/db/outbox';
import { flush, enqueue } from '../src/lib/outbox-sync';

export default function OutboxInspectorScreen() {
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
    <View style={styles.container}>
      <ScreenHeader title="Outbox Inspector" subtitle="Developer Debug Tool" />
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
            <Text style={styles.idText}>ID: {item.id}</Text>
            <Text style={styles.metaText}>Kind: {item.kind} | Status: {item.status}</Text>
            <Text style={styles.metaText}>Attempts: {item.attempts} | Error: {item.last_error || 'None'}</Text>
            <Text style={styles.payloadText}>{item.payload_json}</Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceStrong,
  },
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
  idText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: 'JetBrainsMono_500Medium',
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginTop: 4,
  },
  payloadText: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: 'JetBrainsMono_400Regular',
    marginTop: 8,
  },
});
