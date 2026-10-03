// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#notifications]
import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { colors, radius } from '@40labs/design-tokens';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NotificationAudience, StaffRosterMember } from './types';
import { StaffRosterPickerModal } from './StaffRosterPickerModal';

interface NotificationComposeModalProps {
  visible: boolean;
  initialAudience: NotificationAudience;
  businessId: string | null;
  onClose: () => void;
  onSend: (payload: {
    audience: string;
    targetRole?: string | null;
    targetUserId?: string | null;
    severity?: string;
    subject: string;
    body: string;
  }) => Promise<void>;
}

export function NotificationComposeModal({ visible, initialAudience, businessId, onClose, onSend }: NotificationComposeModalProps) {
  const [audience, setAudience] = useState<NotificationAudience>(initialAudience);
  const [targetRole, setTargetRole] = useState('');
  const [targetUser, setTargetUser] = useState<StaffRosterMember | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [rosterPickerVisible, setRosterPickerVisible] = useState(false);

  React.useEffect(() => {
    setAudience(initialAudience);
    setTargetRole('');
    setTargetUser(null);
    setSubject('');
    setBody('');
  }, [visible, initialAudience]);

  if (!visible) return null;

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      Alert.alert('Error', 'Please enter both subject and body.');
      return;
    }

    if (audience === 'role' && !targetRole.trim()) {
      Alert.alert('Error', 'Please specify a target role.');
      return;
    }

    if (audience === 'direct' && !targetUser) {
      Alert.alert('Error', 'Please select a recipient for direct message.');
      return;
    }

    setSending(true);
    try {
      await onSend({
        audience,
        targetRole: audience === 'role' ? targetRole.trim() : null,
        targetUserId: audience === 'direct' ? targetUser?.id : null,
        severity: audience === 'alert' ? 'alert' : 'info',
        subject: subject.trim(),
        body: body.trim(),
      });
      onClose();
    } catch (err: any) {
      Alert.alert('Send Failed', err.message || 'Could not send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderSubtle }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              New {audience.toUpperCase()} Notification
            </Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {audience === 'role' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Target Role</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                  placeholder="e.g. pharmacist, cashier"
                  placeholderTextColor={colors.textMuted}
                  value={targetRole}
                  onChangeText={setTargetRole}
                />
              </View>
            )}

            {audience === 'direct' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Recipient</Text>
                <TouchableOpacity
                  style={[styles.pickerButton, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSubtle }]}
                  onPress={() => setRosterPickerVisible(true)}
                >
                  <Text style={[styles.pickerButtonText, { color: targetUser ? colors.textPrimary : colors.textMuted }]}>
                    {targetUser ? `${targetUser.displayName} (${targetUser.jobRole})` : 'Select staff member...'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Subject</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                placeholder="Notification subject"
                placeholderTextColor={colors.textMuted}
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Body</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle }]}
                placeholder="Type message body..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                value={body}
                onChangeText={setBody}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.actionPrimary, opacity: sending ? 0.7 : 1 }]}
              onPress={handleSend}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Send Notification</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <StaffRosterPickerModal
        visible={rosterPickerVisible}
        businessId={businessId}
        onSelect={(member) => setTargetUser(member)}
        onClose={() => setRosterPickerVisible(false)}
      />
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
    maxHeight: '80%',
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
    textTransform: 'capitalize',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  input: {
    height: 48,
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  textArea: {
    height: 100,
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlignVertical: 'top',
  },
  pickerButton: {
    height: 48,
    borderRadius: radius.card,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
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
