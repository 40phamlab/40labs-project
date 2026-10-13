import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { businessApi } from '../businessApi';
import { integrationsApi } from '../integrationsApi';
import { notificationsApi } from '../notificationsApi';
import { labApi } from '../labApi';
import { purchasesApi } from '../purchasesApi';
import * as client from '../client';

vi.mock('../client', () => ({
  isUsingTauriIpc: vi.fn(),
  invokeCommand: vi.fn(),
}));

describe('Frontend APIs Persistence and IPC Alignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('businessApi', () => {
    it('calls Tauri IPC when isUsingTauriIpc is true', async () => {
      vi.mocked(client.isUsingTauriIpc).mockReturnValue(true);
      vi.mocked(client.invokeCommand).mockResolvedValue({ id: 'bus_1', name: 'IPC Pharmacy' });

      const res = await businessApi.get();
      expect(client.invokeCommand).toHaveBeenCalledWith('get_business');
      expect(res.name).toBe('IPC Pharmacy');

      await businessApi.update({ name: 'Updated IPC Pharmacy' });
      expect(client.invokeCommand).toHaveBeenCalledWith('update_business', {
        payload: { name: 'Updated IPC Pharmacy' },
      });
    });

    it('falls back to local store when isUsingTauriIpc is false', async () => {
      vi.mocked(client.isUsingTauriIpc).mockReturnValue(false);

      const initial = await businessApi.get();
      expect(initial).toBeDefined();
      expect(client.invokeCommand).not.toHaveBeenCalled();

      const updated = await businessApi.update({ name: 'Mock Pharmacy' });
      expect(updated.name).toBe('Mock Pharmacy');
    });
  });

  describe('integrationsApi', () => {
    it('calls Tauri IPC when isUsingTauriIpc is true', async () => {
      vi.mocked(client.isUsingTauriIpc).mockReturnValue(true);
      vi.mocked(client.invokeCommand).mockResolvedValue({ id: 'int_1', email_connected: true });

      const res = await integrationsApi.get();
      expect(client.invokeCommand).toHaveBeenCalledWith('get_integrations_config');
      expect(res.email_connected).toBe(true);

      await integrationsApi.update({ email_connected: false });
      expect(client.invokeCommand).toHaveBeenCalledWith('update_integrations_config', {
        payload: { email_connected: false },
      });
    });

    it('falls back to local store when isUsingTauriIpc is false', async () => {
      vi.mocked(client.isUsingTauriIpc).mockReturnValue(false);

      const res = await integrationsApi.get();
      expect(client.invokeCommand).not.toHaveBeenCalled();
      expect(res).toBeDefined();
    });
  });

  describe('notificationsApi', () => {
    it('routes create and list commands to Tauri IPC when active', async () => {
      vi.mocked(client.isUsingTauriIpc).mockReturnValue(true);
      vi.mocked(client.invokeCommand).mockImplementation(async (cmd, args) => {
        if (cmd === 'create_notification') {
          return { id: 'notif_ipc_1', category: (args as any).payload.category, body: (args as any).payload.body };
        }
        if (cmd === 'get_notifications') {
          return [{ id: 'notif_ipc_1', category: 'gov', body: 'IPC Gov Notice' }];
        }
        return null;
      });

      const created = await notificationsApi.create({
        category: 'gov',
        sender_name: 'Ministry of Health',
        body: 'IPC Gov Notice',
      });

      expect(client.invokeCommand).toHaveBeenCalledWith('create_notification', {
        payload: {
          category: 'gov',
          sender_name: 'Ministry of Health',
          body: 'IPC Gov Notice',
        },
      });
      expect(created.id).toBe('notif_ipc_1');

      const list = await notificationsApi.list();
      expect(client.invokeCommand).toHaveBeenCalledWith('get_notifications');
      expect(list.length).toBe(1);
      expect(list[0].body).toBe('IPC Gov Notice');
    });

    it('handles sendMessage, markAsRead, archive via Tauri IPC', async () => {
      vi.mocked(client.isUsingTauriIpc).mockReturnValue(true);
      vi.mocked(client.invokeCommand).mockResolvedValue({ id: 'msg_1' });

      await notificationsApi.sendMessage({ notificationId: 'notif_1', body: 'Reply text' });
      expect(client.invokeCommand).toHaveBeenCalledWith('send_notification_message', {
        payload: {
          notification_id: 'notif_1',
          body: 'Reply text',
          content_type: 'text',
          html_content: null,
          attachment_ids: null,
        },
      });

      await notificationsApi.markAsRead('notif_1');
      expect(client.invokeCommand).toHaveBeenCalledWith('mark_notification_read', { id: 'notif_1' });

      await notificationsApi.archive('notif_1');
      expect(client.invokeCommand).toHaveBeenCalledWith('archive_notification', { id: 'notif_1' });
    });
  });

  describe('labApi', () => {
    it('routes all lab reads and writes to Tauri IPC when active', async () => {
      vi.mocked(client.isUsingTauriIpc).mockReturnValue(true);
      vi.mocked(client.invokeCommand).mockImplementation(async (cmd, args) => {
        if (cmd === 'get_lab_orders') return [{ id: 'ord_1', status: 'pending' }];
        if (cmd === 'create_lab_order') return { id: 'ord_new', status: 'pending' };
        if (cmd === 'get_lab_samples') return [{ id: 'sample_1', sample_label: 'BLOOD-01' }];
        if (cmd === 'collect_lab_sample') return { id: 'sample_new', sample_label: (args as any).payload.sampleLabel };
        if (cmd === 'get_lab_results') return [{ id: 'res_1', value: 'Hb 14' }];
        if (cmd === 'enter_lab_result') return { id: 'res_new', value: (args as any).payload.value };
        if (cmd === 'get_test_catalog') return [{ id: 'cat_1', name: 'FBP' }];
        return null;
      });

      const orders = await labApi.listOrders();
      expect(client.invokeCommand).toHaveBeenCalledWith('get_lab_orders');
      expect(orders.length).toBe(1);

      const newOrder = await labApi.createOrder('cust_1', 'cat_1');
      expect(client.invokeCommand).toHaveBeenCalledWith('create_lab_order', {
        payload: { customerId: 'cust_1', testCatalogId: 'cat_1' },
      });
      expect(newOrder.id).toBe('ord_new');

      const samples = await labApi.listSamples();
      expect(client.invokeCommand).toHaveBeenCalledWith('get_lab_samples');
      expect(samples.length).toBe(1);

      const collected = await labApi.collectSample('ord_1', 'SAMPLE-X');
      expect(client.invokeCommand).toHaveBeenCalledWith('collect_lab_sample', {
        payload: { labOrderId: 'ord_1', sampleLabel: 'SAMPLE-X' },
      });
      expect(collected.id).toBe('sample_new');

      const results = await labApi.listResults();
      expect(client.invokeCommand).toHaveBeenCalledWith('get_lab_results');
      expect(results.length).toBe(1);

      const enteredResult = await labApi.enterResult('ord_1', 'Hb 13.0', '12-16', false);
      expect(client.invokeCommand).toHaveBeenCalledWith('enter_lab_result', {
        payload: {
          labOrderId: 'ord_1',
          value: 'Hb 13.0',
          referenceRange: '12-16',
          isOutOfRange: false,
        },
      });
      expect(enteredResult.value).toBe('Hb 13.0');

      const catalog = await labApi.listCatalog();
      expect(client.invokeCommand).toHaveBeenCalledWith('get_test_catalog');
      expect(catalog.length).toBe(1);
    });
  });

  describe('purchasesApi', () => {
    it('routes purchase list, create, and approve operations to Tauri IPC when active', async () => {
      vi.mocked(client.isUsingTauriIpc).mockReturnValue(true);
      vi.mocked(client.invokeCommand).mockImplementation(async (cmd, args) => {
        if (cmd === 'get_purchase_orders') return [{ id: 'po_1', status: 'draft' }];
        if (cmd === 'get_suppliers') return [{ id: 'supp_1' }];
        if (cmd === 'create_purchase_order') return { id: 'po_new', status: 'draft' };
        if (cmd === 'approve_purchase_order') return { id: (args as any).id, status: 'completed' };
        return null;
      });

      const pos = await purchasesApi.list();
      expect(client.invokeCommand).toHaveBeenCalledWith('get_purchase_orders');
      expect(pos.length).toBe(1);

      const suppliers = await purchasesApi.listSuppliers();
      expect(client.invokeCommand).toHaveBeenCalledWith('get_suppliers');
      expect(suppliers.length).toBe(1);

      const newPO = await purchasesApi.create('supp_1', [{ medicine_id: 'med_1', quantity: 10, unit_cost: 100 }]);
      expect(client.invokeCommand).toHaveBeenCalledWith('create_purchase_order', {
        payload: {
          supplierId: 'supp_1',
          lines: [{ medicineId: 'med_1', quantity: 10, unitCost: 100 }],
        },
      });
      expect(newPO.id).toBe('po_new');

      const approvedPO = await purchasesApi.approve('po_1');
      expect(client.invokeCommand).toHaveBeenCalledWith('approve_purchase_order', { id: 'po_1' });
      expect(approvedPO?.status).toBe('completed');
    });
  });
});
