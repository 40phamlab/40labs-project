import type { Node, Edge } from '@xyflow/react';
import type { LabSample, LabOrder, LabResult, LabReport, LabReportForward, TestCatalogEntry, LabQcEquipment, LabQcRecord, SampleEvent, Customer } from '@40labs/types';

export interface TraceGraphInput {
  sampleId: string; // can be sample ID, order ID, result ID, or customer ID
  samples: LabSample[];
  orders: LabOrder[];
  customers: Customer[];
  results: LabResult[];
  reports: LabReport[];
  reportForwards: LabReportForward[];
  catalog: TestCatalogEntry[];
  qcData?: { equipment: LabQcEquipment[]; records: LabQcRecord[] };
  sampleEvents?: SampleEvent[];
}

export function buildTraceGraph({
  sampleId,
  samples,
  orders,
  customers,
  results,
  reports,
  reportForwards,
  catalog,
  qcData,
  sampleEvents: _sampleEvents = [],
}: TraceGraphInput): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Robustly resolve sample, order, result, or customer from sampleId
  let sample = samples.find((s) => s.id === sampleId || s.lab_order_id === sampleId);
  let order: LabOrder | undefined;
  let result: LabResult | undefined;
  let customer: Customer | undefined;

  if (sample) {
    order = orders.find((o) => o.id === sample.lab_order_id);
  } else {
    // Check if sampleId is an order ID
    order = orders.find((o) => o.id === sampleId);
    if (order) {
      sample = samples.find((s) => s.lab_order_id === order.id);
    } else {
      // Check if sampleId is a result ID
      result = results.find((r) => r.id === sampleId || r.lab_order_id === sampleId);
      if (result) {
        order = orders.find((o) => o.id === result!.lab_order_id);
        sample = samples.find((s) => s.lab_order_id === order?.id);
      } else {
        // Check if sampleId is a customer / patient ID
        customer = customers.find((c) => c.id === sampleId);
        if (customer) {
          order = orders.find((o) => o.customer_id === customer!.id);
          sample = samples.find((s) => s.lab_order_id === order?.id);
        }
      }
    }
  }

  if (order && !customer) {
    customer = customers.find((c) => c.id === order!.customer_id);
  }

  if (!sample && !order && !customer) {
    return { nodes, edges };
  }

  const testEntry = order ? catalog.find((t) => t.id === order.test_catalog_id) : undefined;
  if (!result && order) {
    result = results.find((r) => r.lab_order_id === order.id);
  }
  const sampleReports = order ? reports.filter((r) => r.order_id === order.id) : (sample ? reports.filter((r) => r.order_id === sample.lab_order_id) : []);

  let currentX = 50;
  const colWidth = 280;
  const rowHeight = 120;

  // 1. Patient Node
  const patientNodeId = customer?.id || order?.customer_id || 'patient_unknown';
  nodes.push({
    id: patientNodeId,
    type: 'patient',
    position: { x: currentX, y: 100 },
    data: { label: customer?.full_name || 'Patient', customer, type: 'patient' },
  });
  currentX += colWidth;

  // 2. Order Node
  const orderNodeId = order?.id || 'order_unknown';
  if (order) {
    nodes.push({
      id: orderNodeId,
      type: 'order',
      position: { x: currentX, y: 100 },
      data: { label: `Order #${order.id}`, order, type: 'order' },
    });
    edges.push({ id: `e-${patientNodeId}-${orderNodeId}`, source: patientNodeId, target: orderNodeId, label: order.created_at ? new Date(order.created_at).toLocaleTimeString() : undefined });
    currentX += colWidth;
  }

  // 3. Sample Node (or placeholder if not collected yet)
  const sampleNodeId = sample?.id || `sample_pending_${orderNodeId}`;
  nodes.push({
    id: sampleNodeId,
    type: 'sample',
    position: { x: currentX, y: 100 },
    data: { label: sample?.sample_label || 'Pending Sample', sample: sample || { status: 'pending' }, type: 'sample' },
  });
  if (order) {
    edges.push({ id: `e-${orderNodeId}-${sampleNodeId}`, source: orderNodeId, target: sampleNodeId, label: sample?.collected_at ? new Date(sample.collected_at).toLocaleTimeString() : 'Pending' });
  }
  currentX += colWidth;

  // 4. Test Node
  const testNodeId = testEntry?.id || 'test_unknown';
  nodes.push({
    id: testNodeId,
    type: 'test',
    position: { x: currentX, y: 100 },
    data: { label: testEntry?.name || 'Test', test: testEntry, type: 'test' },
  });
  edges.push({ id: `e-${sampleNodeId}-${testNodeId}`, source: sampleNodeId, target: testNodeId });
  currentX += colWidth;

  // 5. Result Node
  if (result) {
    const resultNodeId = result.id;
    nodes.push({
      id: resultNodeId,
      type: 'result',
      position: { x: currentX, y: 100 },
      data: { label: `Result: ${result.value}`, result, type: 'result' },
    });
    edges.push({ id: `e-${testNodeId}-${resultNodeId}`, source: testNodeId, target: resultNodeId });
    currentX += colWidth;
  }

  // 6. Report Nodes (versions)
  if (sampleReports.length > 0) {
    sampleReports.sort((a, b) => a.version - b.version).forEach((rep, idx) => {
      const repNodeId = rep.id;
      nodes.push({
        id: repNodeId,
        type: 'report',
        position: { x: currentX, y: 100 + idx * rowHeight },
        data: { label: `Report v${rep.version} (${rep.status})`, report: rep, type: 'report' },
      });
      const prevTarget = idx === 0 ? (result?.id || testNodeId) : sampleReports[idx - 1].id;
      edges.push({ id: `e-${prevTarget}-${repNodeId}`, source: prevTarget, target: repNodeId });

      // 7. Forward Nodes for this report
      const forwards = reportForwards.filter((f) => f.report_id === rep.id);
      let staffX = currentX + colWidth;
      forwards.forEach((f, fIdx) => {
        const staffNodeId = `forward_${f.id}`;
        nodes.push({
          id: staffNodeId,
          type: 'staff',
          position: { x: staffX, y: 100 + idx * rowHeight + fIdx * 80 },
          data: { label: `Staff: ${f.to_user_id}`, forward: f, type: 'staff' },
        });
        edges.push({ id: `e-${repNodeId}-${staffNodeId}`, source: repNodeId, target: staffNodeId, label: f.forwarded_at ? new Date(f.forwarded_at).toLocaleTimeString() : undefined });
        staffX += colWidth;
      });
    });
  }

  // Optional: QC Equipment node if qcData is present and linked
  if (qcData && qcData.equipment.length > 0) {
    const eq = qcData.equipment[0];
    const qcNodeId = eq.id;
    nodes.push({
      id: qcNodeId,
      type: 'qc',
      position: { x: 50, y: 300 },
      data: { label: `QC: ${eq.name}`, equipment: eq, type: 'qc' },
    });
    edges.push({ id: `e-${qcNodeId}-${sampleNodeId}`, source: qcNodeId, target: sampleNodeId, label: 'QC Linked' });
  }

  return { nodes, edges };
}
