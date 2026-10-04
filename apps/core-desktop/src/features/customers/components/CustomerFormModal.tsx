// [PHASE: MVP]
import * as React from 'react';
import {
  Modal,
  Button,
  Field,
  FieldLabel,
  Input,
  PhoneInput,
  Textarea,
  Select,
} from '@40labs/ui-components';
import type { Customer, AllergyItem, EmergencyContact } from '@40labs/types';
import { normalizePhoneTZ } from '@40labs/i18n';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

export interface CustomerFormPayload {
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
  dob?: string;
  sex?: 'male' | 'female' | 'other';
  bloodGroup?: string;
  allergies?: AllergyItem[];
  chronicConditions?: string[];
  currentMedications?: string[];
  emergencyContact?: EmergencyContact;
  wardDistrict?: string;
  pharmacyNotes?: string;
}

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CustomerFormPayload) => Promise<void> | void;
  editCustomer?: Customer | null;
  isLoading?: boolean;
  allCustomers?: Customer[];
  onOpenCustomerProfile?: (id: string) => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editCustomer,
  isLoading = false,
  allCustomers = [],
  onOpenCustomerProfile,
}) => {
  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [notes, setNotes] = React.useState('');

  // Medical profile states
  const [isMedicalOpen, setIsMedicalOpen] = React.useState(false);
  const [dob, setDob] = React.useState('');
  const [sex, setSex] = React.useState<'male' | 'female' | 'other' | ''>('');
  const [bloodGroup, setBloodGroup] = React.useState('');
  const [allergies, setAllergies] = React.useState<AllergyItem[]>([]);
  const [newSubstance, setNewSubstance] = React.useState('');
  const [newReaction, setNewReaction] = React.useState('');
  const [newSeverity, setNewSeverity] = React.useState<'mild' | 'moderate' | 'severe'>('moderate');

  const [chronicConditions, setChronicConditions] = React.useState<string[]>([]);
  const [newCondition, setNewCondition] = React.useState('');

  const [currentMedications, setCurrentMedications] = React.useState<string[]>([]);
  const [newMedication, setNewMedication] = React.useState('');

  const [emergencyName, setEmergencyName] = React.useState('');
  const [emergencyPhone, setEmergencyPhone] = React.useState('');
  const [wardDistrict, setWardDistrict] = React.useState('');
  const [pharmacyNotes, setPharmacyNotes] = React.useState('');

  const [duplicateError, setDuplicateError] = React.useState<{ name: string; id: string } | null>(null);
  const [phoneError, setPhoneError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (editCustomer) {
      setFullName(editCustomer.full_name || '');
      setPhone(editCustomer.phone || '');
      setEmail(editCustomer.email || '');
      setNotes(editCustomer.notes || '');
      setDob(editCustomer.dob || '');
      setSex(editCustomer.sex || '');
      setBloodGroup(editCustomer.blood_group || '');

      try {
        const algs = editCustomer.allergies;
        setAllergies(
          typeof algs === 'string'
            ? JSON.parse(algs)
            : Array.isArray(algs)
            ? algs
            : []
        );
      } catch {
        setAllergies([]);
      }

      try {
        const cc = editCustomer.chronic_conditions;
        setChronicConditions(
          typeof cc === 'string'
            ? JSON.parse(cc)
            : Array.isArray(cc)
            ? cc
            : []
        );
      } catch {
        setChronicConditions([]);
      }

      try {
        const cm = editCustomer.current_medications;
        setCurrentMedications(
          typeof cm === 'string'
            ? JSON.parse(cm)
            : Array.isArray(cm)
            ? cm
            : []
        );
      } catch {
        setCurrentMedications([]);
      }

      try {
        const ec = editCustomer.emergency_contact;
        const parsedEc =
          typeof ec === 'string'
            ? JSON.parse(ec)
            : ec;
        setEmergencyName(parsedEc?.name || '');
        setEmergencyPhone(parsedEc?.phone || '');
      } catch {
        setEmergencyName('');
        setEmergencyPhone('');
      }

      setWardDistrict(editCustomer.ward_district || '');
      setPharmacyNotes(editCustomer.pharmacy_notes || '');
    } else {
      setFullName('');
      setPhone('');
      setEmail('');
      setNotes('');
      setDob('');
      setSex('');
      setBloodGroup('');
      setAllergies([]);
      setChronicConditions([]);
      setCurrentMedications([]);
      setEmergencyName('');
      setEmergencyPhone('');
      setWardDistrict('');
      setPharmacyNotes('');
    }
    setDuplicateError(null);
    setPhoneError(null);
  }, [editCustomer, isOpen]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    setPhoneError(null);
    setDuplicateError(null);

    const norm = normalizePhoneTZ(val);
    if (val.trim() && !norm) {
      setPhoneError('Invalid phone format. Use 0XXXXXXXXX, 255XXXXXXXXX, or +255XXXXXXXXX');
      return;
    }

    if (norm) {
      const existing = allCustomers.find(
        (c) => normalizePhoneTZ(c.phone) === norm && (!editCustomer || c.id !== editCustomer.id)
      );
      if (existing) {
        setDuplicateError({ name: existing.full_name, id: existing.id });
      }
    }
  };

  const isFormValid = fullName.trim() !== '' && phone.trim() !== '' && !phoneError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isLoading) return;

    const normPhone = normalizePhoneTZ(phone);
    if (!normPhone) {
      setPhoneError('Invalid phone format');
      return;
    }

    try {
      await onSave({
        fullName: fullName.trim(),
        phone: normPhone,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        dob: dob.trim() || undefined,
        sex: sex || undefined,
        bloodGroup: bloodGroup.trim() || undefined,
        allergies: allergies.length > 0 ? allergies : undefined,
        chronicConditions: chronicConditions.length > 0 ? chronicConditions : undefined,
        currentMedications: currentMedications.length > 0 ? currentMedications : undefined,
        emergencyContact: emergencyName.trim() || emergencyPhone.trim() ? { name: emergencyName.trim(), phone: emergencyPhone.trim() } : undefined,
        wardDistrict: wardDistrict.trim() || undefined,
        pharmacyNotes: pharmacyNotes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('DUPLICATE_PHONE')) {
        const parts = msg.split(':');
        const custId = parts[1];
        const match = allCustomers.find((c) => c.id === custId);
        setDuplicateError({ name: match?.full_name || 'Customer', id: custId });
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editCustomer ? 'Edit Customer Profile' : 'Add Customer Profile'}
      size="lg"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button
            type="button"
            intent="neutral"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            intent="primary"
            onClick={handleSubmit}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? 'Saving...' : editCustomer ? 'Update Profile' : 'Save Customer'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
        {duplicateError && (
          <div className="p-3 bg-warning/10 border border-warning/30 rounded-card text-xs text-warning flex items-center justify-between">
            <span>Already registered as <strong>{duplicateError.name}</strong> — open profile</span>
            {onOpenCustomerProfile && (
              <Button
                type="button"
                intent="neutral"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenCustomerProfile(duplicateError.id);
                }}
              >
                Open profile
              </Button>
            )}
          </div>
        )}

        {/* Basic Section */}
        <div className="space-y-3 bg-panel-strong/20 p-4 rounded-card border border-border/40">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Basic Information</h3>
          <Field>
            <FieldLabel required>Full Name</FieldLabel>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Juma Hamisi"
              autoFocus
            />
          </Field>

          <Field>
            <FieldLabel required>Phone Number (TZ)</FieldLabel>
            <PhoneInput
              value={phone}
              onChange={handlePhoneChange}
              countryCode="+255"
              placeholder="0712 345 678"
            />
            {phoneError && <span className="text-[11px] text-danger mt-1">{phoneError}</span>}
          </Field>

          <Field>
            <FieldLabel>Email Address</FieldLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="optional@example.com"
            />
          </Field>
        </div>

        {/* Medical Profile Section (Collapsible) */}
        <div className="bg-panel-strong/20 rounded-card border border-border/40 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsMedicalOpen(!isMedicalOpen)}
            className="w-full flex items-center justify-between p-4 text-xs font-bold uppercase tracking-wider text-text-muted hover:bg-surface-strong transition-colors cursor-pointer"
          >
            <span>Medical Profile (Structured)</span>
            {isMedicalOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {isMedicalOpen && (
            <div className="p-4 pt-0 space-y-4 border-t border-border/30">
              <div className="grid grid-cols-3 gap-3 pt-3">
                <Field>
                  <FieldLabel>DOB / Approx Age</FieldLabel>
                  <Input
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    placeholder="YYYY-MM-DD or 34 yrs"
                  />
                </Field>
                <Field>
                  <FieldLabel>Sex</FieldLabel>
                  <Select
                    value={sex}
                    onChange={(e) => setSex(e.target.value as any)}
                  >
                    <option value="">Select Sex</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Blood Group</FieldLabel>
                  <Input
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    placeholder="e.g. O+, A-"
                  />
                </Field>
              </div>

              {/* Allergies Tag List */}
              <div className="space-y-2">
                <FieldLabel>Allergies (Substance + Reaction + Severity)</FieldLabel>
                <div className="flex gap-2 items-center">
                  <Input
                    value={newSubstance}
                    onChange={(e) => setNewSubstance(e.target.value)}
                    placeholder="Substance (e.g. Penicillin)"
                  />
                  <Input
                    value={newReaction}
                    onChange={(e) => setNewReaction(e.target.value)}
                    placeholder="Reaction (e.g. Hives)"
                  />
                  <Select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                  >
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </Select>
                  <Button
                    type="button"
                    intent="neutral"
                    size="sm"
                    onClick={() => {
                      if (newSubstance.trim()) {
                        setAllergies([...allergies, { substance: newSubstance.trim(), reaction: newReaction.trim(), severity: newSeverity }]);
                        setNewSubstance('');
                        setNewReaction('');
                      }
                    }}
                  >
                    <Plus size={14} />
                  </Button>
                </div>
                {allergies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {allergies.map((alg, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-panel border border-border text-xs">
                        <strong>{alg.substance}</strong> ({alg.reaction} — {alg.severity})
                        <button
                          type="button"
                          onClick={() => setAllergies(allergies.filter((_, i) => i !== idx))}
                          className="text-text-muted hover:text-danger ml-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Chronic Conditions */}
              <div className="space-y-2">
                <FieldLabel>Chronic Conditions</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    placeholder="e.g. Hypertension, Diabetes"
                  />
                  <Button
                    type="button"
                    intent="neutral"
                    size="sm"
                    onClick={() => {
                      if (newCondition.trim()) {
                        setChronicConditions([...chronicConditions, newCondition.trim()]);
                        setNewCondition('');
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                {chronicConditions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {chronicConditions.map((cond, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-panel border border-border text-xs">
                        {cond}
                        <button
                          type="button"
                          onClick={() => setChronicConditions(chronicConditions.filter((_, i) => i !== idx))}
                          className="text-text-muted hover:text-danger ml-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Medications */}
              <div className="space-y-2">
                <FieldLabel>Current Medications</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    value={newMedication}
                    onChange={(e) => setNewMedication(e.target.value)}
                    placeholder="e.g. Metformin 500mg"
                  />
                  <Button
                    type="button"
                    intent="neutral"
                    size="sm"
                    onClick={() => {
                      if (newMedication.trim()) {
                        setCurrentMedications([...currentMedications, newMedication.trim()]);
                        setNewMedication('');
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                {currentMedications.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {currentMedications.map((med, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-panel border border-border text-xs">
                        {med}
                        <button
                          type="button"
                          onClick={() => setCurrentMedications(currentMedications.filter((_, i) => i !== idx))}
                          className="text-text-muted hover:text-danger ml-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>Emergency Contact Name</FieldLabel>
                  <Input
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="Contact Name"
                  />
                </Field>
                <Field>
                  <FieldLabel>Emergency Contact Phone</FieldLabel>
                  <PhoneInput
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    countryCode="+255"
                    placeholder="0XXXXXXXXX"
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel>Ward / District</FieldLabel>
                <Input
                  value={wardDistrict}
                  onChange={(e) => setWardDistrict(e.target.value)}
                  placeholder="e.g. Ilala, Dar es Salaam"
                />
              </Field>
            </div>
          )}
        </div>

        <Field>
          <FieldLabel>Pharmacy notes (non-clinical)</FieldLabel>
          <Textarea
            value={pharmacyNotes}
            onChange={(e) => setPharmacyNotes(e.target.value)}
            placeholder="Customer preferences, pickup schedules, or non-clinical notes..."
          />
        </Field>
      </form>
    </Modal>
  );
};
