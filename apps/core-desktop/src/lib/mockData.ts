// apps/core-desktop/src/lib/mockData.ts
//
// MOCK-API SEAM — every React Query hook reads from here today.
// All shapes are imported from @40labs/types, never redefined inline,
// so swapping mock -> real sqlx-backed Tauri commands later is a
// one-line change per hook, not a UI rewrite.
//
// Money convention matches infra/db/sqlite-schema: all amounts are
// INTEGER TZS (no subunit), never floats.
//
// Fixed workspace/branch for MVP single-branch dev — every record below
// shares these two IDs, matching the "workspace_id + branch_id on every
// table, no exceptions" rule even in mock data.

import type {
  Business,
  Branch,
  User,
  PairedDevice,
  Customer,
  Medicine,
  InventoryItem,
  StockAdjustment,
  Sale,
  SaleLine,
  FiscalReceipt,
  LabOrder,
  LabSample,
  LabResult,
  LabReport,
  TestCatalogEntry,
  Supplier,
  PurchaseOrder,
  AuditLogEntry,
} from '@40labs/types';

const WORKSPACE_ID = 'ws_dev_001';
const BRANCH_ID = 'br_dev_001';

const now = new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

// ============================================================
// BUSINESS / BRANCH
// ============================================================

export const mockBusiness: Business = {
  id: 'biz_001',
  workspace_id: WORKSPACE_ID,
  branch_id: BRANCH_ID,
  created_at: daysAgo(90),
  updated_at: daysAgo(2),
  business_id: 'AFYA-2847',
  name: 'Amani Pharmacy',
  tin: '109-482-773',
  tmda_number: 'TMDA-PH-00219',
  role_scopes: ['pharmacy', 'lab'],
  tier: 'class_1',
  contacts: {
    mobile: '+255 754 123 456',
    email: 'amani.pharmacy@example.co.tz',
    whatsapp: '+255 754 123 456',
  },
  address: {
    region: 'Mbeya',
    district: 'Mbeya City',
    place: 'Soweto',
  },
  logo_url: null,
  appearance_mode: 'light',
};

export const mockBranches: Branch[] = [
  {
    id: 'branch_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(90),
    updated_at: daysAgo(90),
    business_id: 'AFYA-2847',
    name: 'Amani Pharmacy — Main',
    location: 'Soweto, Mbeya',
    branch_code: 'MAIN',
    status: 'active',
    contacts: '+255 754 123 456',
  },
];

// ============================================================
// USERS / DEVICES
// ============================================================

export const mockUsers: User[] = [
  {
    id: 'user_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(90),
    updated_at: daysAgo(90),
    full_name: 'Sairiamu Mwakalinga',
    role: 'sudo',
    pin_hash: 'mock_hash_sudo',
    permissions: null,
    active: true,
  },
  {
    id: 'user_002',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(60),
    updated_at: daysAgo(10),
    full_name: 'Grace Mushi',
    role: 'staff',
    pin_hash: 'mock_hash_staff_1',
    permissions: {
      can_update_stock: true,
      can_adjust_stock: false,
      can_issue_refund: false,
      can_approve_po: false,
      can_add_lab_sample: true,
      can_override_lab_result: false,
      can_view_reports: true,
    },
    active: true,
  },
  {
    id: 'user_003',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(45),
    updated_at: daysAgo(45),
    full_name: 'Emmanuel Kileo',
    role: 'staff',
    pin_hash: 'mock_hash_staff_2',
    permissions: {
      can_update_stock: true,
      can_adjust_stock: true,
      can_issue_refund: false,
      can_approve_po: false,
      can_add_lab_sample: false,
      can_override_lab_result: false,
      can_view_reports: false,
    },
    active: true,
  },
];

export const mockPairedDevices: PairedDevice[] = [
  {
    id: 'device_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(30),
    updated_at: daysAgo(1),
    user_id: 'user_002',
    device_label: "Grace's Phone (Orbit Worker)",
    paired_at: daysAgo(30),
    last_connected_at: daysAgo(0),
    status: 'active',
  },
];

// ============================================================
// CUSTOMERS
// ============================================================

export const mockCustomers: Customer[] = [
  {
    id: 'cust_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(120),
    updated_at: daysAgo(3),
    full_name: 'Juma Hamisi',
    phone: '0606113565',
    email: null,
    outstanding_balance: 15000,
    notes: 'Regular customer, prefers generics.',
    amob_patient_id: null,
  },
  {
    id: 'cust_002',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(80),
    updated_at: daysAgo(12),
    full_name: 'Anna Yajilo',
    phone: '0606113566',
    email: 'anna.yajilo@example.com',
    outstanding_balance: 0,
    notes: null,
    amob_patient_id: null,
  },
  {
    id: 'cust_003',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(5),
    updated_at: daysAgo(5),
    full_name: 'Jane Kimario',
    phone: '0696571221',
    email: null,
    outstanding_balance: 50000,
    notes: 'Debtor — reminded 2026-08-20',
    amob_patient_id: null,
  },
];

// ============================================================
// MEDICINE / INVENTORY
// ============================================================

export const mockMedicines: Medicine[] = [
  {
    id: 'med_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(200),
    updated_at: daysAgo(200),
    name: 'Paracetamol 500mg',
    generic_name: 'Paracetamol',
    category: 'Analgesic',
    unit: 'pack',
    is_controlled_substance: false,
    requires_prescription: false,
  },
  {
    id: 'med_002',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(200),
    updated_at: daysAgo(200),
    name: 'Amoxicillin 250mg',
    generic_name: 'Amoxicillin',
    category: 'Antibiotic',
    unit: 'pack',
    is_controlled_substance: false,
    requires_prescription: true,
  },
  {
    id: 'med_003',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(150),
    updated_at: daysAgo(150),
    name: 'Diazepam 5mg',
    generic_name: 'Diazepam',
    category: 'Sedative',
    unit: 'pack',
    is_controlled_substance: true,
    requires_prescription: true,
  },
  {
    id: 'med_004',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(100),
    updated_at: daysAgo(100),
    name: 'ORS Sachets',
    generic_name: 'Oral Rehydration Salts',
    category: 'Rehydration',
    unit: 'sachet',
    is_controlled_substance: false,
    requires_prescription: false,
  },
];

export const mockInventoryItems: InventoryItem[] = [
  {
    id: 'inv_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(60),
    updated_at: daysAgo(2),
    medicine_id: 'med_001',
    batch_number: 'PCM-2026-014',
    expiry_date: daysFromNow(400),
    buy_price: 2000,
    sell_price: 3000,
    quantity: 240,
    low_stock_threshold: 50,
    cold_chain_required: false,
  },
  {
    id: 'inv_002',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(40),
    updated_at: daysAgo(5),
    medicine_id: 'med_002',
    batch_number: 'AMX-2026-009',
    expiry_date: daysFromNow(30),
    buy_price: 3500,
    sell_price: 5000,
    quantity: 18,
    low_stock_threshold: 20,
    cold_chain_required: false,
  },
  {
    id: 'inv_003',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(20),
    updated_at: daysAgo(20),
    medicine_id: 'med_003',
    batch_number: 'DZP-2026-002',
    expiry_date: daysFromNow(200),
    buy_price: 8000,
    sell_price: 12000,
    quantity: 15,
    low_stock_threshold: 5,
    cold_chain_required: false,
  },
  {
    id: 'inv_004',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(15),
    updated_at: daysAgo(15),
    medicine_id: 'med_004',
    batch_number: 'ORS-2025-088',
    expiry_date: daysAgo(3), // already expired — for testing expiry UI states
    buy_price: 300,
    sell_price: 500,
    quantity: 60,
    low_stock_threshold: 30,
    cold_chain_required: false,
  },
];

export const mockStockAdjustments: StockAdjustment[] = [
  {
    id: 'adj_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(2),
    updated_at: daysAgo(2),
    inventory_item_id: 'inv_001',
    adjusted_by_user_id: 'user_003',
    delta: -5,
    reason: 'Damaged in storage',
    audit_log_id: 'audit_001',
  },
];

// ============================================================
// SALES
// ============================================================

const mockSaleLines1: SaleLine[] = [
  {
    id: 'saleline_001',
    inventory_item_id: 'inv_001',
    medicine_id: 'med_001',
    quantity: 2,
    unit_price: 3000,
    subtotal: 6000,
    dispensed_by_user_id: 'user_002',
    is_prescription_dispense: false,
  },
];

const mockSaleLines2: SaleLine[] = [
  {
    id: 'saleline_002',
    inventory_item_id: 'inv_002',
    medicine_id: 'med_002',
    quantity: 1,
    unit_price: 5000,
    subtotal: 5000,
    dispensed_by_user_id: 'user_003',
    is_prescription_dispense: true,
  },
];

export const mockSales: Sale[] = [
  {
    id: 'sale_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(1),
    updated_at: daysAgo(1),
    customer_id: 'cust_001',
    lines: mockSaleLines1,
    payment_method: 'cash',
    discount_amount: 0,
    discount_authorized_by_user_id: null,
    tax_amount: 0,
    grand_total: 6000,
    currency: 'TZS',
    synced_at: daysAgo(1),
  },
  {
    id: 'sale_002',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: now,
    updated_at: now,
    customer_id: null, // walk-in
    lines: mockSaleLines2,
    payment_method: 'mobile_money',
    discount_amount: 0,
    discount_authorized_by_user_id: null,
    tax_amount: 0,
    grand_total: 5000,
    currency: 'TZS',
    synced_at: null, // still queued — demonstrates offline sync-pending state
  },
];

// ============================================================
// FISCAL
// ============================================================

export const mockFiscalReceipts: FiscalReceipt[] = [
  {
    id: 'fiscal_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(1),
    updated_at: daysAgo(1),
    sale_id: 'sale_001',
    fiscal_device_id: 'INCOTEX-0192',
    status: 'confirmed',
    local_signature: 'sig_a1b2c3',
    tra_receipt_number: 'TRA-0009821',
    queued_at: daysAgo(1),
    submitted_at: daysAgo(1),
    retry_count: 0,
    buffering_window_hours: null,
  },
  {
    id: 'fiscal_002',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: now,
    updated_at: now,
    sale_id: 'sale_002',
    fiscal_device_id: null,
    status: 'queued', // demonstrates offline fiscal outbox state
    local_signature: 'sig_d4e5f6',
    tra_receipt_number: null,
    queued_at: now,
    submitted_at: null,
    retry_count: 0,
    buffering_window_hours: null,
  },
];

// ============================================================
// LAB MODULE
// ============================================================

export const mockTestCatalog: TestCatalogEntry[] = [
  {
    id: 'test_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(100),
    updated_at: daysAgo(100),
    name: 'Malaria Rapid Test',
    category: 'Parasitology',
    reference_range: 'Negative',
    price: 5000,
  },
  {
    id: 'test_002',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(100),
    updated_at: daysAgo(100),
    name: 'Fasting Blood Glucose',
    category: 'Chemistry',
    reference_range: '70-100 mg/dL',
    price: 4000,
  },
  {
    id: 'test_003',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(100),
    updated_at: daysAgo(100),
    name: 'Full Blood Count',
    category: 'Hematology',
    reference_range: 'See panel',
    price: 12000,
  },
];

export const mockLabOrders: LabOrder[] = [
  {
    id: 'labord_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(2),
    updated_at: daysAgo(1),
    customer_id: 'cust_001',
    sale_id: null,
    ordered_by_user_id: 'user_001',
    status: 'report_ready',
    test_catalog_id: 'test_001',
  },
  {
    id: 'labord_002',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(1),
    updated_at: daysAgo(1),
    customer_id: 'cust_002',
    sale_id: 'sale_002',
    ordered_by_user_id: 'user_002',
    status: 'sample_collected',
    test_catalog_id: 'test_002',
  },
  {
    id: 'labord_003',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: now,
    updated_at: now,
    customer_id: 'cust_003',
    sale_id: null,
    ordered_by_user_id: 'user_001',
    status: 'pending',
    test_catalog_id: 'test_003',
  },
];

export const mockLabSamples: LabSample[] = [
  {
    id: 'labsample_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(2),
    updated_at: daysAgo(2),
    lab_order_id: 'labord_001',
    collected_by_user_id: 'user_002',
    collected_at: daysAgo(2),
    sample_label: 'SMP-0001',
  },
  {
    id: 'labsample_002',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(1),
    updated_at: daysAgo(1),
    lab_order_id: 'labord_002',
    collected_by_user_id: 'user_002',
    collected_at: daysAgo(1),
    sample_label: 'SMP-0002',
  },
];

export const mockLabResults: LabResult[] = [
  {
    id: 'labresult_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(1),
    updated_at: daysAgo(1),
    lab_order_id: 'labord_001',
    entered_by_user_id: 'user_001',
    value: 'Negative',
    reference_range: 'Negative',
    is_out_of_range: false,
    override_authorized_by_user_id: null,
  },
];

export const mockLabReports: LabReport[] = [
  {
    id: 'labreport_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(1),
    updated_at: daysAgo(1),
    lab_order_id: 'labord_001',
    generated_at: daysAgo(1),
    pdf_path: '/local/reports/labord_001.pdf',
  },
];

// ============================================================
// PURCHASES / SUPPLIERS
// ============================================================

export const mockSuppliers: Supplier[] = [
  {
    id: 'supplier_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(150),
    updated_at: daysAgo(30),
    business_id: 'AFYA-1102',
    tmda_verified: true,
    tra_verified: true,
  },
  {
    id: 'supplier_002',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(90),
    updated_at: daysAgo(90),
    business_id: 'AFYA-1587',
    tmda_verified: false,
    tra_verified: false,
  },
];

export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(10),
    updated_at: daysAgo(8),
    supplier_id: 'supplier_001',
    status: 'completed',
    lines: [
      { medicine_id: 'med_001', quantity: 200, unit_cost: 2000 },
      { medicine_id: 'med_002', quantity: 50, unit_cost: 3500 },
    ],
    total_cost: 575000,
    approved_by_user_id: 'user_001',
    submitted_at: daysAgo(9),
  },
  {
    id: 'po_002',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: daysAgo(1),
    updated_at: daysAgo(1),
    supplier_id: 'supplier_002',
    status: 'draft', // demonstrates offline-drafted PO not yet submitted
    lines: [{ medicine_id: 'med_003', quantity: 20, unit_cost: 8000 }],
    total_cost: 160000,
    approved_by_user_id: null,
    submitted_at: null,
  },
];

// ============================================================
// AUDIT LOG
// ============================================================

export const mockAuditLog: AuditLogEntry[] = [
  {
    id: 'audit_001',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    action: 'stock_adjustment',
    performed_by_user_id: 'user_003',
    target_entity_type: 'InventoryItem',
    target_entity_id: 'inv_001',
    metadata: { delta: -5, reason: 'Damaged in storage' },
    created_at: daysAgo(2),
  },
  {
    id: 'audit_002',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    action: 'discount_authorization',
    performed_by_user_id: 'user_001',
    target_entity_type: 'Sale',
    target_entity_id: 'sale_001',
    metadata: { amount: 0 },
    created_at: daysAgo(1),
  },
];

// ============================================================
// AGGREGATE — Dashboard-shaped read, computed from the above.
// Mirrors what GET /dashboard/summary will eventually return.
// Dashboard variant B, confirmed in CONTEXT/SPEC/dashboard.md.
// ============================================================

export interface DashboardSummary {
  monthlyProfit: number;
  profit: number;
  todaysSales: number;
  transactions: number;
  supplierDebt: number;
  customerDebt: number;
  customerBalance: number;
  inventoryValue: number;
  totalStock: number;
  categories: number;
  emptyItems: number;
  expiredItems: number;
}

export function getMockDashboardSummary(): DashboardSummary {
  const inventoryValue = mockInventoryItems.reduce(
    (sum, item) => sum + item.sell_price * item.quantity,
    0,
  );
  const todaysSalesTotal = mockSales
    .filter((s) => s.created_at.slice(0, 10) === now.slice(0, 10))
    .reduce((sum, s) => sum + s.grand_total, 0);
  const customerDebt = mockCustomers.reduce((sum, c) => sum + c.outstanding_balance, 0);
  const expiredItems = mockInventoryItems.filter(
    (i) => new Date(i.expiry_date) < new Date(),
  ).length;
  const emptyItems = mockInventoryItems.filter((i) => i.quantity === 0).length;
  const categories = new Set(mockMedicines.map((m) => m.category)).size;

  return {
    monthlyProfit: 1500000,
    profit: 1500000,
    todaysSales: todaysSalesTotal,
    transactions: mockSales.length,
    supplierDebt: 50000,
    customerDebt,
    customerBalance: customerDebt,
    inventoryValue,
    totalStock: mockInventoryItems.reduce((sum, i) => sum + i.quantity, 0),
    categories,
    emptyItems,
    expiredItems,
  };
}