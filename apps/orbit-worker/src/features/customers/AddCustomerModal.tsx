// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#customers]
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { radius } from '../../theme/rn-tokens';
import { Screen, AppHeader, Text, TextField, DateField, SelectField, FormSection, Button, Banner } from '../../ui';
import { useI18n } from '../../i18n/I18nProvider';
import { Customer } from './types';
import { enqueueCustomerCreate, fetchCustomersApi } from './api';
import { useConnectionStore } from '../../stores/connection';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface AddCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (customer: Customer) => void;
}

export function normalizePhoneTZ(phone: string): string | null {
  const cleaned = phone.replace(/[\s()-]/g, '');
  if (/^0[67]\d{8}$/.test(cleaned)) {
    return '+255' + cleaned.slice(1);
  }
  if (/^255[67]\d{8}$/.test(cleaned)) {
    return '+' + cleaned;
  }
  if (/^\+255[67]\d{8}$/.test(cleaned)) {
    return cleaned;
  }
  return null;
}

export function AddCustomerModal({ visible, onClose, onSuccess }: AddCustomerModalProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { activeBusinessId } = useConnectionStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Medical profile
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState<{ substance: string; reaction: string; severity: string }[]>([]);
  const [newSubstance, setNewSubstance] = useState('');
  const [newReaction, setNewReaction] = useState('');
  const [newSeverity, setNewSeverity] = useState('moderate');
  const [chronicConditions, setChronicConditions] = useState<string[]>([]);
  const [newCondition, setNewCondition] = useState('');
  const [currentMedications, setCurrentMedications] = useState<string[]>([]);
  const [newMedication, setNewMedication] = useState('');

  // Contact & Location
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [wardDistrict, setWardDistrict] = useState('');

  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [duplicateCustomer, setDuplicateCustomer] = useState<{ name: string; id: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [existingCustomers, setExistingCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (visible && activeBusinessId) {
      fetchCustomersApi(activeBusinessId).then(setExistingCustomers).catch(() => {});
    }
  }, [visible, activeBusinessId]);

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    setPhoneError(null);
    setDuplicateCustomer(null);

    const norm = normalizePhoneTZ(val);
    if (val.trim() && !norm) {
      setPhoneError('Invalid phone format (0XXXXXXXXX)');
      return;
    }

    if (norm) {
      const match = existingCustomers.find((c) => normalizePhoneTZ(c.phone) === norm);
      if (match) {
        setDuplicateCustomer({ name: match.fullName, id: match.id });
      }
    }
  };

  const isFormValid = fullName.trim() !== '' && phone.trim() !== '' && !phoneError;

  const handleSave = async () => {
    if (!isFormValid) return;

    const normPhone = normalizePhoneTZ(phone);
    if (!normPhone) {
      setPhoneError('Invalid phone format');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        phone: normPhone,
        email: email.trim() || null,
        notes: notes.trim() || null,
        dob: dob.trim() || null,
        sex: sex || null,
        bloodGroup: bloodGroup.trim() || null,
        allergies: allergies.length > 0 ? allergies : null,
        chronicConditions: chronicConditions.length > 0 ? chronicConditions : null,
        currentMedications: currentMedications.length > 0 ? currentMedications : null,
        emergencyContact: emergencyName.trim() || emergencyPhone.trim() ? { name: emergencyName.trim(), phone: emergencyPhone.trim() } : null,
        wardDistrict: wardDistrict.trim() || null,
      };

      await enqueueCustomerCreate(payload);

      const tempCustomer: Customer = {
        id: `cust_temp_${Date.now()}`,
        workspaceId: 'ws_010101',
        branchId: 'br_010101',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fullName: fullName.trim(),
        phone: normPhone,
        email: email.trim() || null,
        notes: notes.trim() || null,
      };

      onSuccess(tempCustomer);
      onClose();
    } catch (err: any) {
      setPhoneError(err.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <Screen scrollable={false}>
      <AppHeader title="Add Patient / Customer" onBack={onClose} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
        {duplicateCustomer && (
          <Banner
            title={`Already registered as ${duplicateCustomer.name}`}
            variant="warning"
          />
        )}

        <FormSection title="Basic Information">
          <TextField
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder=""
          />
          <TextField
            label="Phone Number"
            value={phone}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            error={phoneError || undefined}
            placeholder=""
          />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder=""
          />
        </FormSection>

        <FormSection title="Medical Profile" defaultExpanded={false}>
          <DateField label="Date of Birth" value={dob} onChange={setDob} />
          <SelectField
            label="Sex"
            value={sex}
            options={[
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
              { label: 'Other', value: 'other' },
            ]}
            onSelect={setSex}
          />
          <TextField label="Blood Group" value={bloodGroup} onChangeText={setBloodGroup} placeholder="" />

          <Text variant="label" style={{ marginBottom: 6 }}>Allergies</Text>
          <View style={styles.inlineRow}>
            <View style={{ flex: 1 }}>
              <TextField label="Substance" value={newSubstance} onChangeText={setNewSubstance} placeholder="" />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label="Reaction" value={newReaction} onChangeText={setNewReaction} placeholder="" />
            </View>
          </View>
          <SelectField
            label="Severity"
            value={newSeverity}
            options={[
              { label: 'Mild', value: 'mild' },
              { label: 'Moderate', value: 'moderate' },
              { label: 'Severe', value: 'severe' },
            ]}
            onSelect={setNewSeverity}
          />
          <Button
            title="Add Allergy"
            variant="secondary"
            onPress={() => {
              if (newSubstance.trim()) {
                setAllergies([...allergies, { substance: newSubstance, reaction: newReaction, severity: newSeverity }]);
                setNewSubstance('');
                setNewReaction('');
              }
            }}
          />
          {allergies.map((a, i) => (
            <Text key={i} variant="mono" style={{ fontSize: 12, marginTop: 4 }}>• {a.substance} ({a.reaction} - {a.severity})</Text>
          ))}

          <View style={{ height: 16 }} />
          <TextField label="Chronic Conditions" value={newCondition} onChangeText={setNewCondition} placeholder="" />
          <Button
            title="Add Condition"
            variant="secondary"
            onPress={() => {
              if (newCondition.trim()) {
                setChronicConditions([...chronicConditions, newCondition.trim()]);
                setNewCondition('');
              }
            }}
          />
          {chronicConditions.map((c, i) => (
            <Text key={i} variant="mono" style={{ fontSize: 12, marginTop: 4 }}>• {c}</Text>
          ))}

          <View style={{ height: 16 }} />
          <TextField label="Current Medications" value={newMedication} onChangeText={setNewMedication} placeholder="" />
          <Button
            title="Add Medication"
            variant="secondary"
            onPress={() => {
              if (newMedication.trim()) {
                setCurrentMedications([...currentMedications, newMedication.trim()]);
                setNewMedication('');
              }
            }}
          />
          {currentMedications.map((m, i) => (
            <Text key={i} variant="mono" style={{ fontSize: 12, marginTop: 4 }}>• {m}</Text>
          ))}
        </FormSection>

        <FormSection title="Contact & Location" defaultExpanded={false}>
          <TextField label="Emergency Contact Name" value={emergencyName} onChangeText={setEmergencyName} placeholder="" />
          <TextField label="Emergency Contact Phone" value={emergencyPhone} onChangeText={setEmergencyPhone} keyboardType="phone-pad" placeholder="" />
          <TextField label="Ward / District" value={wardDistrict} onChangeText={setWardDistrict} placeholder="" />
        </FormSection>

        <FormSection title="Notes" defaultExpanded={false}>
          <TextField label="Notes" value={notes} onChangeText={setNotes} placeholder="" />
        </FormSection>
      </ScrollView>

      <View style={[styles.stickyFooter, { backgroundColor: colors.surfaceStrong, borderTopColor: colors.borderSubtle, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button
          title="Save Customer"
          onPress={handleSave}
          disabled={!isFormValid || saving}
          loading={saving}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  inlineRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
