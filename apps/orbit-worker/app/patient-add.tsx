// [PHASE: MVP]
// [SPEC: apps/orbit-worker/CONTEXT/03_SCREENS.md#home]
import React, { useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { useTheme } from '../src/theme/ThemeProvider';
import { radius } from '../src/theme/rn-tokens';
import { Screen, AppHeader, Text, Button } from '../src/ui';
import { useI18n } from '../src/i18n/I18nProvider';
import { enqueue } from '../src/lib/outbox-sync';
import { useCustomerStore } from '../src/stores/customer';
import { useRouter } from 'expo-router';

export default function PatientAddScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const setSelectedCustomer = useCustomerStore((s) => s.setSelectedCustomer);

  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (!phone.trim() || !fullName.trim()) {
      setErrorMsg('Phone number and Full Name are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        phone: phone.trim(),
        fullName: fullName.trim(),
        gender: gender.trim(),
        dob: dob.trim() || undefined,
        bloodGroup: bloodGroup.trim() || undefined,
        allergies: allergies.trim() || undefined,
      };

      const outboxId = await enqueue('customer_create', payload);

      // Optimistically set customer in store
      setSelectedCustomer({
        id: outboxId,
        phone: phone.trim(),
        fullName: fullName.trim(),
        gender: gender.trim(),
        dob: dob.trim(),
        bloodGroup: bloodGroup.trim(),
        allergies: allergies.trim(),
        workspaceId: '',
      });

      router.back();
    } catch (err: any) {
      if (err.status === 409 || err.message?.includes('duplicate') || err.message?.includes('already exists')) {
        Alert.alert(
          'Customer Exists',
          'A customer with this phone number already exists in the system.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        setErrorMsg(err.message || 'Failed to register patient.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scrollable={false} hasTabBar={false}>
      <AppHeader title="Sajili Mgonjwa (Register Patient)" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.container}>
        {errorMsg && (
          <View style={[styles.errorBox, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={{ color: colors.danger, fontSize: 13 }}>{errorMsg}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Namba ya Simu / Phone Number *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
            placeholder="e.g. 0712 345 678"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Jina Kamili / Full Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
            placeholder="e.g. Juma Ally"
            placeholderTextColor={colors.textMuted}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Jinsia / Gender</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
            placeholder="Male / Female / Other"
            placeholderTextColor={colors.textMuted}
            value={gender}
            onChangeText={setGender}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Tarehe ya Kuzaliwa / DOB (YYYY-MM-DD)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            value={dob}
            onChangeText={setDob}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Kundi la Damu / Blood Group</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
            placeholder="e.g. O+"
            placeholderTextColor={colors.textMuted}
            value={bloodGroup}
            onChangeText={setBloodGroup}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Mzio / Allergies</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.textPrimary, borderColor: colors.borderSubtle, borderRadius: radius.card }]}
            placeholder="e.g. Penicillin"
            placeholderTextColor={colors.textMuted}
            value={allergies}
            onChangeText={setAllergies}
          />
        </View>

        <View style={styles.footer}>
          <Button title="Sajili Mgonjwa (Save Patient)" onPress={handleSubmit} loading={loading} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  footer: {
    marginTop: 24,
  },
});
