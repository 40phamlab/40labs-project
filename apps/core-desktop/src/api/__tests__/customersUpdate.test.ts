import { describe, test, expect } from 'vitest';
import { customersApi } from '../customersApi';

describe('customersApi update field clearing contract', () => {
  test('updates specified fields while preserving unsent fields', async () => {
    const cust = await customersApi.create({
      fullName: 'Amina Test One',
      phone: '0711889901',
      email: 'amina1@example.com',
      notes: 'Initial note',
      dob: '1992-04-10',
      wardDistrict: 'Kinondoni',
    });

    const updated = await customersApi.update(cust.id, {
      notes: 'Updated note only',
    });

    expect(updated).not.toBeNull();
    expect(updated?.notes).toBe('Updated note only');
    expect(updated?.email).toBe('amina1@example.com');
    expect(updated?.dob).toBe('1992-04-10');
    expect(updated?.ward_district).toBe('Kinondoni');
  });

  test('clears optional fields when explicitly set to null', async () => {
    const cust = await customersApi.create({
      fullName: 'Amina Test Two',
      phone: '0711889902',
      email: 'amina2@example.com',
      notes: 'Note to clear',
      allergies: [{ substance: 'Dust', reaction: 'Sneezing', severity: 'mild' }],
      chronicConditions: ['Hypertension'],
      currentMedications: ['Amlodipine'],
      emergencyContact: { name: 'Sister', phone: '+255711000000' },
    });

    const updated = await customersApi.update(cust.id, {
      email: null,
      notes: null,
      allergies: null,
      chronicConditions: null,
      currentMedications: null,
      emergencyContact: null,
    });

    expect(updated).not.toBeNull();
    expect(updated?.email).toBeNull();
    expect(updated?.notes).toBeNull();
    expect(updated?.allergies).toBeNull();
    expect(updated?.chronic_conditions).toBeNull();
    expect(updated?.current_medications).toBeNull();
    expect(updated?.emergency_contact).toBeNull();

    // Verify other fields were preserved
    expect(updated?.full_name).toBe('Amina Test Two');
    expect(updated?.phone).toBe('+255711889902');
  });

  test('archives and unarchives customer using archivedAt field', async () => {
    const cust = await customersApi.create({
      fullName: 'Amina Test Three',
      phone: '0711889903',
    });

    const archiveTime = new Date().toISOString();
    const archived = await customersApi.update(cust.id, {
      archivedAt: archiveTime,
    });
    expect(archived?.archived_at).toBe(archiveTime);

    const unarchived = await customersApi.update(cust.id, {
      archivedAt: null,
    });
    expect(unarchived?.archived_at).toBeNull();
  });
});
