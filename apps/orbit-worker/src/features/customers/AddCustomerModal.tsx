// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { colors, radius } from '@40labs/design-tokens';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Customer } from './types';
import { enqueueCustomerCreate } from './api';

interface AddCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (customer: Customer) => void;
}

export function AddCustomerModal({ visible, onClose, onSuccess }: AddCustomerModalProps) {
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!visible) return null;

  const handleSave = async () => {
    if (!phone.trim() || !fullName.trim()) {
      Alert.alert('Error', 'Phone number and full name are required.');
      return;
    }

    setSaving(true);
    try {
      await enqueueCustomerCreate({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() ? email.trim() : null,
        notes: notes.trim() ? notes.trim() : null,
      });

      Alert.alert('Success', 'Patient/Customer created and queued in outbox for synchronization.');
      // Create temporary customer object for picker selection
      const tempCustomer: Customer = {
        id: `cust_temp_${Date.now()}`,
        workspaceId: 'ws_010101',
        branchId: 'br_010101',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        notes: notes.trim() || null,
      };
      onSuccess(tempCustomer);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderSubtle }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Add New Patient / Customer</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Phone Number * (Tanzania)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                placeholder="e.g. 0712345678 or +255712345678"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                placeholder="e.g. Juma Ally"
                placeholderTextColor={colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email (Optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                placeholder="e.g. juma@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Notes (Optional)</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                placeholder="Allergies, notes, etc."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.actionPrimary, opacity: saving ? 0.7 : 1 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Save & Queue Patient</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    borderRadius: radius.card,
    borderWidth: 1,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Sora_600SemiBold',
  },
  content: {
    padding: 20,
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  input: {
    height: 46,
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  textArea: {
    height: 90,
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlignVertical: 'top',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  button: {
    paddingVertical: 14,
    borderRadius: radius.card,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
