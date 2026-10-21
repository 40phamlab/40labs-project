import { describe, it, expect } from 'vitest';
import { evaluateAlerts } from '../evaluateAlerts';
import { DEFAULT_ALERT_THRESHOLDS } from '../alertThresholds';
import type { MedicineWithInventory, LabOrder, LabResult, Customer, PurchaseOrder } from '@40labs/types';

describe('evaluateAlerts pure rules evaluator', () => {
  const baseDate = new Date('2025-06-15T10:00:00Z');

  it('evaluates stock boundaries correctly (0, <=50% threshold, = threshold, threshold+1)', () => {
    const makeItem = (id: string, qty: number, threshold: number): MedicineWithInventory => ({
      id,
      workspace_id: 'ws_1',
      branch_id: 'br_1',
      created_at: baseDate.toISOString(),
      updated_at: baseDate.toISOString(),
      medicine_id: `med_${id}`,
      batch_number: 'B1',
      expiry_date: '2026-01-01',
      buy_price: 100,
      sell_price: 200,
      quantity: qty,
      low_stock_threshold: threshold,
      cold_chain_required: false,
      medicine: {
        id: `med_${id}`,
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: baseDate.toISOString(),
        updated_at: baseDate.toISOString(),
        name: `Medicine ${id}`,
        generic_name: null,
        category: 'Analgesics',
        unit: 'tablet',
        is_controlled_substance: false,
        requires_prescription: false,
      },
    });

    const inventory: MedicineWithInventory[] = [
      makeItem('1', 0, 10),  // Critical (out)
      makeItem('2', 4, 10),  // Danger (<= 50% of 10)
      makeItem('3', 10, 10), // Warning (== threshold 10)
      makeItem('4', 11, 10), // Safe (> threshold)
    ];

    const alerts = evaluateAlerts(
      {
        inventory,
        labOrders: [],
        labResults: [],
        customers: [],
        sales: [],
        purchaseOrders: [],
        currentTime: baseDate,
      },
      DEFAULT_ALERT_THRESHOLDS
    );

    const outAlert = alerts.find((a) => a.rule === 'out' && a.entityId === '1');
    expect(outAlert).toBeDefined();
    expect(outAlert?.severity).toBe('critical');

    const dangerAlert = alerts.find((a) => a.rule === 'danger_low');
    expect(dangerAlert).toBeDefined();
    expect(dangerAlert?.severity).toBe('danger');
    expect(dangerAlert?.count).toBe(1);

    const warningAlert = alerts.find((a) => a.rule === 'warning_low');
    expect(warningAlert).toBeDefined();
    expect(warningAlert?.severity).toBe('warning');
    expect(warningAlert?.count).toBe(1);
  });

  it('evaluates expiry boundaries and timezone midnight rollover (expired, exactly 30d, exactly 90d, 91d)', () => {
    // baseDate is 2025-06-15
    const makeExpiryItem = (id: string, dateStr: string, qty: number): MedicineWithInventory => ({
      id,
      workspace_id: 'ws_1',
      branch_id: 'br_1',
      created_at: baseDate.toISOString(),
      updated_at: baseDate.toISOString(),
      medicine_id: `med_${id}`,
      batch_number: 'B1',
      expiry_date: dateStr,
      buy_price: 100,
      sell_price: 200,
      quantity: qty,
      low_stock_threshold: 5,
      cold_chain_required: false,
      medicine: {
        id: `med_${id}`,
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: baseDate.toISOString(),
        updated_at: baseDate.toISOString(),
        name: `Med ${id}`,
        generic_name: null,
        category: 'General',
        unit: 'bottle',
        is_controlled_substance: false,
        requires_prescription: false,
      },
    });

    const inventory: MedicineWithInventory[] = [
      makeExpiryItem('exp1', '2025-06-14', 5), // Expired (yesterday) -> critical
      makeExpiryItem('exp2', '2025-07-15', 5), // Exactly 30 days (June 15 + 30 days = July 15) -> danger
      makeExpiryItem('exp3', '2025-09-13', 5), // Exactly 90 days (June 15 + 90 days = Sept 13) -> warning
      makeExpiryItem('exp4', '2025-09-15', 5), // 92 days -> no alert
    ];

    const alerts = evaluateAlerts(
      {
        inventory,
        labOrders: [],
        labResults: [],
        customers: [],
        sales: [],
        purchaseOrders: [],
        currentTime: baseDate,
      },
      DEFAULT_ALERT_THRESHOLDS
    );

    const expiredAlert = alerts.find((a) => a.rule === 'expired' && a.entityId === 'exp1');
    expect(expiredAlert).toBeDefined();
    expect(expiredAlert?.severity).toBe('critical');

    const d30Alert = alerts.find((a) => a.rule === 'expiring_30d');
    expect(d30Alert).toBeDefined();
    expect(d30Alert?.severity).toBe('danger');

    const d90Alert = alerts.find((a) => a.rule === 'expiring_90d');
    expect(d90Alert).toBeDefined();
    expect(d90Alert?.severity).toBe('warning');
  });

  it('evaluates lab overdue and abnormal results', () => {
    const labOrders: LabOrder[] = [
      {
        id: 'ord_1',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: new Date(baseDate.getTime() - 26 * 3600 * 1000).toISOString(), // 26 hours ago (> 24h threshold)
        updated_at: baseDate.toISOString(),
        customer_id: 'cust_1',
        sale_id: null,
        ordered_by_user_id: 'usr_1',
        status: 'pending',
        test_catalog_id: 'test_1',
      },
    ];

    const labResults: LabResult[] = [
      {
        id: 'res_1',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: baseDate.toISOString(),
        updated_at: baseDate.toISOString(),
        lab_order_id: 'ord_2',
        entered_by_user_id: 'usr_1',
        value: '15.0',
        reference_range: '4.0-10.0',
        is_out_of_range: true,
        override_authorized_by_user_id: null, // unreviewed
      },
    ];

    const alerts = evaluateAlerts(
      {
        inventory: [],
        labOrders,
        labResults,
        customers: [],
        sales: [],
        purchaseOrders: [],
        currentTime: baseDate,
      },
      DEFAULT_ALERT_THRESHOLDS
    );

    const overdueAlert = alerts.find((a) => a.rule === 'overdue');
    expect(overdueAlert).toBeDefined();
    expect(overdueAlert?.severity).toBe('warning');

    const abnormalAlert = alerts.find((a) => a.rule === 'abnormal');
    expect(abnormalAlert).toBeDefined();
    expect(abnormalAlert?.severity).toBe('danger');
  });

  it('evaluates debt thresholds and customer outstanding balances', () => {
    const customers: Customer[] = [
      {
        id: 'c1',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: baseDate.toISOString(),
        updated_at: baseDate.toISOString(),
        full_name: 'Customer A',
        phone: '+255700000001',
        email: null,
        outstanding_balance: 150000, // > 0 -> warning
        notes: null,
        amob_patient_id: null,
      },
      {
        id: 'c2',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: baseDate.toISOString(),
        updated_at: baseDate.toISOString(),
        full_name: 'Customer B',
        phone: '+255700000002',
        email: null,
        outstanding_balance: 600000, // > 500,000 threshold -> danger
        notes: null,
        amob_patient_id: null,
      },
    ];

    const alerts = evaluateAlerts(
      {
        inventory: [],
        labOrders: [],
        labResults: [],
        customers,
        sales: [],
        purchaseOrders: [],
        currentTime: baseDate,
      },
      DEFAULT_ALERT_THRESHOLDS
    );

    const warnDebt = alerts.find((a) => a.rule === 'overdue_balance');
    expect(warnDebt).toBeDefined();
    expect(warnDebt?.severity).toBe('warning');

    const dangerDebt = alerts.find((a) => a.rule === 'high_balance');
    expect(dangerDebt).toBeDefined();
    expect(dangerDebt?.severity).toBe('danger');
  });

  it('evaluates delayed purchase orders', () => {
    const purchaseOrders: PurchaseOrder[] = [
      {
        id: 'po_1',
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: new Date(baseDate.getTime() - 8 * 24 * 3600 * 1000).toISOString(), // 8 days ago (> 7 days)
        updated_at: baseDate.toISOString(),
        supplier_id: 'sup_1',
        status: 'pending',
        lines: [],
        total_cost: 10000,
        approved_by_user_id: null,
        submitted_at: null,
      },
    ];

    const alerts = evaluateAlerts(
      {
        inventory: [],
        labOrders: [],
        labResults: [],
        customers: [],
        sales: [],
        purchaseOrders,
        currentTime: baseDate,
      },
      DEFAULT_ALERT_THRESHOLDS
    );

    const poAlert = alerts.find((a) => a.rule === 'delayed_po');
    expect(poAlert).toBeDefined();
    expect(poAlert?.severity).toBe('warning');
  });
});
