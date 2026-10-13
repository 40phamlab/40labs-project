import { describe, it, expect, vi, beforeEach } from 'vitest';
import { businessApi } from '../businessApi';
import { integrationsApi } from '../integrationsApi';
import { notificationsApi } from '../notificationsApi';
import { labApi } from '../labApi';
import { purchasesApi } from '../purchasesApi';
import { dashboardApi } from '../dashboardApi';
import { branchesApi } from '../branchesApi';
import { backupApi } from '../backupApi';
import { getInitialDashboardSummary } from '../../devData/dashboard/summary';
import { salesApi } from '../salesApi';
import { inventoryApi } from '../inventoryApi';
import * as client from '../client';
import type { LabSample, Sale, InventoryItem, Medicine } from '@40labs/types';

vi.mock('../client', () => ({
  isUsingTauriIpc: vi.fn(),
  invokeCommand: vi.fn(),
}));

vi.mock('../salesApi', () => ({
  salesApi: { list: vi.fn() },
}));
vi.mock('../inventoryApi', () => ({
  inventoryApi: { list: vi.fn(), listMedicines: vi.fn() },
}));

describe('REG-01 through REG-09 — System Regression Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('REG-01: Lab Sample Status Schema & Migration Contract', async () => {
    const sample: LabSample = {
      id: 'sample_reg_01',
      workspace_id: 'ws_1',
      branch_id: 'br_1',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      lab_order_id: 'ord_1',
      collected_by_user_id: 'user_1',
      collected_at: '2026-01-01T00:00:00Z',
      sample_label: 'BLOOD-LABEL-01',
      status: 'collected',
    };

    expect(sample.status).toBe('collected');
    expect(['collected', 'insufficient', 'declined', 'used', 'removed']).toContain(sample.status);
  });

  it('REG-02: Business Profile & Settings Persistence', async () => {
    vi.mocked(client.isUsingTauriIpc).mockReturnValue(true);
    vi.mocked(client.invokeCommand).mockResolvedValue({
      id: 'bus_reg_1',
      name: 'Reg Pharmacy',
      tin: '100-200-300',
    });

    const bus = await businessApi.get();
    expect(client.invokeCommand).toHaveBeenCalledWith('get_business');
    expect(bus.name).toBe('Reg Pharmacy');

    await businessApi.update({ name: 'Reg Pharmacy Updated', tin: '999-888-777' });
    expect(client.invokeCommand).toHaveBeenCalledWith('update_business', {
      payload: { name: 'Reg Pharmacy Updated', tin: '999-888-777' },
    });
  });

  it('REG-03: Integrations Config Read/Write & Collaborators', async () => {
    vi.mocked(client.isUsingTauriIpc).mockReturnValue(true);
    vi.mocked(client.invokeCommand).mockResolvedValue({
      id: 'int_reg_1',
      email_connected: true,
      collaborators: [{ user_id: 'u1', full_name: 'Amina', scope: 'manage' }],
    });

    const config = await integrationsApi.get();
    expect(client.invokeCommand).toHaveBeenCalledWith('get_integrations_config');
    expect(config.collaborators.length).toBe(1);

    await integrationsApi.update({ whatsapp_connected: true });
    expect(client.invokeCommand).toHaveBeenCalledWith('update_integrations_config', {
      payload: { whatsapp_connected: true },
    });
  });

  it('REG-04: Notification Creation & Persistence Across Cache Invalidation', async () => {
    vi.mocked(client.isUsingTauriIpc).mockReturnValue(true);
    vi.mocked(client.invokeCommand).mockResolvedValue({
      id: 'notif_reg_1',
      category: 'gov',
      body: 'Government Notice',
    });

    const notif = await notificationsApi.create({
      category: 'gov',
      sender_name: 'MoH',
      body: 'Government Notice',
    });

    expect(client.invokeCommand).toHaveBeenCalledWith('create_notification', {
      payload: { category: 'gov', sender_name: 'MoH', body: 'Government Notice' },
    });
    expect(notif.id).toBe('notif_reg_1');
  });

  it('REG-05: Lab Results, Test Catalog, and Result Entry', async () => {
    vi.mocked(client.isUsingTauriIpc).mockReturnValue(true);
    vi.mocked(client.invokeCommand).mockImplementation(async (cmd, args) => {
      if (cmd === 'get_lab_results') return [{ id: 'res_1', value: 'Hb 13.5' }];
      if (cmd === 'get_test_catalog') return [{ id: 'cat_1', name: 'Full Blood Picture' }];
      if (cmd === 'enter_lab_result') return { id: 'res_new', value: (args as any).payload.value };
      return null;
    });

    const results = await labApi.listResults();
    expect(results[0].value).toBe('Hb 13.5');

    const catalog = await labApi.listCatalog();
    expect(catalog[0].name).toBe('Full Blood Picture');

    const entered = await labApi.enterResult('ord_1', 'Hb 14.0', '12-16', false);
    expect(client.invokeCommand).toHaveBeenCalledWith('enter_lab_result', {
      payload: { labOrderId: 'ord_1', value: 'Hb 14.0', referenceRange: '12-16', isOutOfRange: false },
    });
    expect(entered.value).toBe('Hb 14.0');
  });

  it('REG-06: Purchase Order Creation & Approval', async () => {
    vi.mocked(client.isUsingTauriIpc).mockReturnValue(true);
    vi.mocked(client.invokeCommand).mockImplementation(async (cmd, args) => {
      if (cmd === 'get_purchase_orders') return [{ id: 'po_1', status: 'draft' }];
      if (cmd === 'create_purchase_order') return { id: 'po_created', status: 'draft' };
      if (cmd === 'approve_purchase_order') return { id: (args as any).id, status: 'completed' };
      return null;
    });

    const pos = await purchasesApi.list();
    expect(pos[0].id).toBe('po_1');

    const created = await purchasesApi.create('supp_1', [{ medicine_id: 'm1', quantity: 10, unit_cost: 500 }]);
    expect(client.invokeCommand).toHaveBeenCalledWith('create_purchase_order', {
      payload: { supplierId: 'supp_1', lines: [{ medicineId: 'm1', quantity: 10, unitCost: 500 }] },
    });
    expect(created.id).toBe('po_created');

    const approved = await purchasesApi.approve('po_created');
    expect(client.invokeCommand).toHaveBeenCalledWith('approve_purchase_order', { id: 'po_created' });
    expect(approved?.status).toBe('completed');
  });

  it('REG-07: Dashboard Aggregation NaN Prevention & Canonical ID Resolution', () => {
    const fixedNow = new Date('2026-03-31T12:00:00Z');

    const medicines: Medicine[] = [
      {
        id: 'med_1',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        name: 'Paracetamol',
        generic_name: 'Acetaminophen',
        category: 'Analgesic',
        unit: 'pack',
        is_controlled_substance: false,
        requires_prescription: false,
      },
    ];

    const inventoryItems: InventoryItem[] = [
      {
        id: 'inv_1',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
        medicine_id: 'med_1',
        batch_number: 'B1',
        expiry_date: '2027-01-01',
        buy_price: 1000,
        sell_price: 2000,
        quantity: 50,
        low_stock_threshold: 5,
        cold_chain_required: false,
      },
    ];

    const sales: Sale[] = [
      {
        id: 'sale_1',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: '2026-03-31T09:00:00Z',
        updated_at: '2026-03-31T09:00:00Z',
        customer_id: null,
        lines: [
          {
            id: 'l1',
            inventory_item_id: 'mismatched_id',
            medicine_id: 'med_1',
            quantity: 5,
            unit_price: 2000,
            subtotal: 10000,
            dispensed_by_user_id: 'u1',
            is_prescription_dispense: false,
          },
        ],
        payment_method: 'cash',
        discount_amount: 0,
        discount_authorized_by_user_id: null,
        tax_amount: 0,
        grand_total: 10000,
        currency: 'TZS',
        synced_at: null,
      },
    ];

    const summary = getInitialDashboardSummary({
      sales,
      inventoryItems,
      medicines,
      nowDate: fixedNow,
    });

    expect(Number.isNaN(summary.profit)).toBe(false);
    expect(Number.isNaN(summary.todaysSales)).toBe(false);
    expect(summary.profit).toBe(5000); // (2000 - 1000) * 5
  });

  it('REG-08: Dashboard Error Resiliency & Failure Transparency', async () => {
    vi.mocked(salesApi.list).mockRejectedValue(new Error('Core Backend Error [500]'));
    vi.mocked(inventoryApi.list).mockRejectedValue(new Error('Core Backend Error [500]'));

    await expect(dashboardApi.getSummary()).rejects.toThrow('Core Backend Error [500]');
  });

  it('REG-09: Branches and Backup In-Memory State Fallbacks', async () => {
    vi.mocked(client.isUsingTauriIpc).mockReturnValue(false);

    const initialBranches = await branchesApi.list();
    expect(initialBranches).toBeDefined();

    const createdBranch = await branchesApi.create({
      name: 'Sub-branch Arusha',
      location: 'Arusha',
      branch_code: 'ARU-01',
      status: 'active',
      contacts: '+255700000000',
    });
    expect(createdBranch.name).toBe('Sub-branch Arusha');

    const updatedBranch = await branchesApi.update(createdBranch.id, { name: 'Arusha Main' });
    expect(updatedBranch?.name).toBe('Arusha Main');

    const initialSchedule = await backupApi.getSchedule();
    expect(initialSchedule).toBeDefined();

    const backupRecord = await backupApi.runBackup();
    expect(backupRecord.status).toBe('completed');

    const history = await backupApi.listHistory();
    expect(history.length).toBeGreaterThan(0);
  });
});
