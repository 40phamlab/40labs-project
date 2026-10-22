import { describe, it, expect } from 'vitest';
import { buildTraceGraph } from '../buildTraceGraph';
import type { LabSample, LabOrder, LabResult, LabReport, LabReportForward, TestCatalogEntry, Customer } from '@40labs/types';

describe('buildTraceGraph', () => {
  const mockCustomer: Customer = {
    id: 'cust_1',
    workspace_id: 'ws_1',
    branch_id: 'br_1',
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
    full_name: 'John Doe',
    phone: '+255712345678',
    email: null,
    category: 'regular',
    risk_level: 'low',
    notes: null,
  };

  const mockOrder: LabOrder = {
    id: 'ord_1',
    workspace_id: 'ws_1',
    branch_id: 'br_1',
    created_at: '2026-03-01T10:05:00Z',
    updated_at: '2026-03-01T10:05:00Z',
    customer_id: 'cust_1',
    sale_id: null,
    ordered_by_user_id: 'user_1',
    status: 'pending',
    test_catalog_id: 'test_1',
  };

  const mockTest: TestCatalogEntry = {
    id: 'test_1',
    workspace_id: 'ws_1',
    branch_id: 'br_1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    name: 'Malaria RDT',
    category: 'Parasitology',
    reference_range: 'Negative',
    price: 5000,
    stability_hours: 24,
  };

  const mockSample: LabSample = {
    id: 'samp_1',
    workspace_id: 'ws_1',
    branch_id: 'br_1',
    created_at: '2026-03-01T10:10:00Z',
    updated_at: '2026-03-01T10:10:00Z',
    lab_order_id: 'ord_1',
    collected_by_user_id: 'user_1',
    collected_at: '2026-03-01T10:10:00Z',
    sample_label: 'WB-01',
    status: 'collected',
    expires_at: '2026-03-02T10:10:00Z',
    expiry_source: 'catalog',
  };

  it('builds trace graph for sample with no report', () => {
    const { nodes, edges } = buildTraceGraph({
      sampleId: 'samp_1',
      samples: [mockSample],
      orders: [mockOrder],
      customers: [mockCustomer],
      results: [],
      reports: [],
      reportForwards: [],
      catalog: [mockTest],
    });

    expect(nodes.some((n) => n.id === 'cust_1')).toBe(true);
    expect(nodes.some((n) => n.id === 'ord_1')).toBe(true);
    expect(nodes.some((n) => n.id === 'samp_1')).toBe(true);
    expect(nodes.some((n) => n.id === 'test_1')).toBe(true);
    expect(edges.length).toBeGreaterThan(0);
  });

  it('builds trace graph with 2 report versions and forwarding twice', () => {
    const mockResult: LabResult = {
      id: 'res_1',
      workspace_id: 'ws_1',
      branch_id: 'br_1',
      created_at: '2026-03-01T11:00:00Z',
      updated_at: '2026-03-01T11:00:00Z',
      lab_order_id: 'ord_1',
      entered_by_user_id: 'user_1',
      value: 'Positive',
      reference_range: 'Negative',
      is_out_of_range: true,
      override_authorized_by_user_id: 'user_admin',
    };

    const reportV1: LabReport = {
      id: 'rep_1',
      workspace_id: 'ws_1',
      branch_id: 'br_1',
      created_at: '2026-03-01T11:10:00Z',
      updated_at: '2026-03-01T11:10:00Z',
      patient_id: 'cust_1',
      order_id: 'ord_1',
      version: 1,
      supersedes_report_id: null,
      status: 'finalized',
      summary_note: 'Initial findings',
      prepared_by: 'user_1',
      finalized_by: 'user_admin',
      finalized_at: '2026-03-01T11:15:00Z',
    };

    const reportV2: LabReport = {
      id: 'rep_2',
      workspace_id: 'ws_1',
      branch_id: 'br_1',
      created_at: '2026-03-01T12:00:00Z',
      updated_at: '2026-03-01T12:00:00Z',
      patient_id: 'cust_1',
      order_id: 'ord_1',
      version: 2,
      supersedes_report_id: 'rep_1',
      status: 'finalized',
      summary_note: 'Amended findings',
      prepared_by: 'user_1',
      finalized_by: 'user_admin',
      finalized_at: '2026-03-01T12:05:00Z',
    };

    const forward1: LabReportForward = {
      id: 'fwd_1',
      workspace_id: 'ws_1',
      branch_id: 'br_1',
      created_at: '2026-03-01T12:10:00Z',
      updated_at: '2026-03-01T12:10:00Z',
      report_id: 'rep_2',
      from_user_id: 'user_1',
      to_user_id: 'doc_1',
      note: 'Please review urgent',
      forwarded_at: '2026-03-01T12:10:00Z',
      read_at: null,
    };

    const forward2: LabReportForward = {
      id: 'fwd_2',
      workspace_id: 'ws_1',
      branch_id: 'br_1',
      created_at: '2026-03-01T12:20:00Z',
      updated_at: '2026-03-01T12:20:00Z',
      report_id: 'rep_2',
      from_user_id: 'doc_1',
      to_user_id: 'spec_1',
      note: 'Specialist consultation',
      forwarded_at: '2026-03-01T12:20:00Z',
      read_at: null,
    };

    const expiredSample: LabSample = {
      ...mockSample,
      expires_at: '2026-02-28T10:10:00Z',
      expiry_source: 'manual',
    };

    const { nodes, edges } = buildTraceGraph({
      sampleId: 'samp_1',
      samples: [expiredSample],
      orders: [mockOrder],
      customers: [mockCustomer],
      results: [mockResult],
      reports: [reportV1, reportV2],
      reportForwards: [forward1, forward2],
      catalog: [mockTest],
    });

    expect(nodes.some((n) => n.id === 'rep_1')).toBe(true);
    expect(nodes.some((n) => n.id === 'rep_2')).toBe(true);
    expect(nodes.some((n) => n.id === 'forward_fwd_1')).toBe(true);
    expect(nodes.some((n) => n.id === 'forward_fwd_2')).toBe(true);
    expect(edges.length).toBeGreaterThan(5);
  });
});
