import type { Customer, AllergyItem, EmergencyContact } from '@40labs/types';
import { initialCustomers, WORKSPACE_ID, BRANCH_ID } from '../devData';
import { isUsingTauriIpc, invokeCommand } from './client';

export interface AddCustomerPayload {
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

export interface UpdateCustomerPayload {
  fullName?: string;
  phone?: string;
  email?: string | null;
  notes?: string | null;
  outstandingBalance?: number;
  dob?: string | null;
  sex?: 'male' | 'female' | 'other' | null;
  bloodGroup?: string | null;
  allergies?: AllergyItem[] | null;
  chronicConditions?: string[] | null;
  currentMedications?: string[] | null;
  emergencyContact?: EmergencyContact | null;
  wardDistrict?: string | null;
  pharmacyNotes?: string | null;
  archivedAt?: string | null;
}

let customersStore: Customer[] = [...initialCustomers];

export const customersApi = {
  list: async (): Promise<Customer[]> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<Customer[]>('get_customers_list');
    }
    return [...customersStore];
  },

  get: async (id: string): Promise<Customer | null> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<Customer | null>('get_customer', { id });
    }
    return customersStore.find((c) => c.id === id) || null;
  },

  create: async (payload: AddCustomerPayload): Promise<Customer> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<Customer>('create_customer', { payload });
    }

    const now = new Date().toISOString();
    const newCustomer: Customer = {
      id: `cust_${Date.now()}`,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: now,
      updated_at: now,
      full_name: payload.fullName,
      phone: payload.phone,
      email: payload.email || null,
      outstanding_balance: 0,
      notes: payload.notes || null,
      dob: payload.dob || null,
      sex: payload.sex || null,
      blood_group: payload.bloodGroup || null,
      allergies: payload.allergies ? JSON.stringify(payload.allergies) : null,
      chronic_conditions: payload.chronicConditions ? JSON.stringify(payload.chronicConditions) : null,
      current_medications: payload.currentMedications ? JSON.stringify(payload.currentMedications) : null,
      emergency_contact: payload.emergencyContact ? JSON.stringify(payload.emergencyContact) : null,
      ward_district: payload.wardDistrict || null,
      pharmacy_notes: payload.pharmacyNotes || null,
      archived_at: null,
      amob_patient_id: null,
    };

    customersStore = [newCustomer, ...customersStore];
    return newCustomer;
  },

  update: async (id: string, updates: UpdateCustomerPayload): Promise<Customer | null> => {
    if (isUsingTauriIpc()) {
      return invokeCommand<Customer>('update_customer', { id, payload: updates });
    }

    const index = customersStore.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const existing = customersStore[index];
    const updated: Customer = {
      ...existing,
      full_name: updates.fullName ?? existing.full_name,
      phone: updates.phone ?? existing.phone,
      email: updates.email !== undefined ? updates.email : existing.email,
      notes: updates.notes !== undefined ? updates.notes : existing.notes,
      outstanding_balance: updates.outstandingBalance ?? existing.outstanding_balance,
      dob: updates.dob !== undefined ? updates.dob : existing.dob,
      sex: updates.sex !== undefined ? updates.sex : existing.sex,
      blood_group: updates.bloodGroup !== undefined ? updates.bloodGroup : existing.blood_group,
      allergies: updates.allergies !== undefined ? (updates.allergies ? JSON.stringify(updates.allergies) : null) : existing.allergies,
      chronic_conditions: updates.chronicConditions !== undefined ? (updates.chronicConditions ? JSON.stringify(updates.chronicConditions) : null) : existing.chronic_conditions,
      current_medications: updates.currentMedications !== undefined ? (updates.currentMedications ? JSON.stringify(updates.currentMedications) : null) : existing.current_medications,
      emergency_contact: updates.emergencyContact !== undefined ? (updates.emergencyContact ? JSON.stringify(updates.emergencyContact) : null) : existing.emergency_contact,
      ward_district: updates.wardDistrict !== undefined ? updates.wardDistrict : existing.ward_district,
      pharmacy_notes: updates.pharmacyNotes !== undefined ? updates.pharmacyNotes : existing.pharmacy_notes,
      archived_at: updates.archivedAt !== undefined ? updates.archivedAt : existing.archived_at,
      updated_at: new Date().toISOString(),
    };

    customersStore[index] = updated;
    return updated;
  },

  updateCustomerNotes: (id: string, notes: string): Promise<Customer | null> => {
    return customersApi.update(id, { notes });
  },

  delete: async (id: string): Promise<boolean> => {
    const initialLen = customersStore.length;
    customersStore = customersStore.filter((c) => c.id !== id);
    return customersStore.length < initialLen;
  },

  archive: (id: string): Promise<boolean> => {
    return customersApi.update(id, { archivedAt: new Date().toISOString() }).then((res) => res !== null);
  },

  // Backwards compatibility aliases
  getCustomers: (): Promise<Customer[]> => customersApi.list(),
  addCustomer: (payload: AddCustomerPayload): Promise<Customer> => customersApi.create(payload),
};

export const customers = customersApi;
