import { describe, it, expect } from 'vitest';
import { validateGraph } from '../validateGraph';
import type { LabWorkflowGraphJson } from '@40labs/types';

describe('validateGraph', () => {
  it('validates a correct linear workflow with result_entry and terminal node', () => {
    const graph: LabWorkflowGraphJson = {
      nodes: [
        { id: 'n1', type: 'step', position: { x: 0, y: 0 }, data: { label: 'Reg', stepType: 'registration' } },
        { id: 'n2', type: 'step', position: { x: 100, y: 0 }, data: { label: 'Coll', stepType: 'collection' } },
        { id: 'n3', type: 'step', position: { x: 200, y: 0 }, data: { label: 'Proc', stepType: 'process' } },
        { id: 'n4', type: 'step', position: { x: 300, y: 0 }, data: { label: 'Result', stepType: 'result_entry' } },
        { id: 'n5', type: 'step', position: { x: 400, y: 0 }, data: { label: 'Report', stepType: 'report_draft' } },
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
        { id: 'e3', source: 'n3', target: 'n4' },
        { id: 'e4', source: 'n4', target: 'n5' },
      ],
    };

    const res = validateGraph(graph);
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  it('fails if there is no result_entry step', () => {
    const graph: LabWorkflowGraphJson = {
      nodes: [
        { id: 'n1', type: 'step', position: { x: 0, y: 0 }, data: { label: 'Reg', stepType: 'registration' } },
        { id: 'n2', type: 'step', position: { x: 100, y: 0 }, data: { label: 'Report', stepType: 'report_draft' } },
      ],
      edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
    };

    const res = validateGraph(graph);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.message.includes('result_entry'))).toBe(true);
  });

  it('fails if there are unreachable orphan nodes', () => {
    const graph: LabWorkflowGraphJson = {
      nodes: [
        { id: 'n1', type: 'step', position: { x: 0, y: 0 }, data: { label: 'Reg', stepType: 'registration' } },
        { id: 'n2', type: 'step', position: { x: 100, y: 0 }, data: { label: 'Result', stepType: 'result_entry' } },
        { id: 'orphan', type: 'step', position: { x: 200, y: 0 }, data: { label: 'Orphan', stepType: 'process' } },
      ],
      edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
    };

    const res = validateGraph(graph);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.nodeId === 'orphan')).toBe(true);
  });

  it('allows explicit rework edge from review back to process', () => {
    const graph: LabWorkflowGraphJson = {
      nodes: [
        { id: 'n1', type: 'step', position: { x: 0, y: 0 }, data: { label: 'Reg', stepType: 'registration' } },
        { id: 'n2', type: 'step', position: { x: 100, y: 0 }, data: { label: 'Proc', stepType: 'process' } },
        { id: 'n3', type: 'step', position: { x: 200, y: 0 }, data: { label: 'Result', stepType: 'result_entry' } },
        { id: 'n4', type: 'step', position: { x: 300, y: 0 }, data: { label: 'Review', stepType: 'review' } },
        { id: 'n5', type: 'step', position: { x: 400, y: 0 }, data: { label: 'Report', stepType: 'report_draft' } },
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
        { id: 'e3', source: 'n3', target: 'n4' },
        { id: 'e4', source: 'n4', target: 'n5' },
        { id: 'rework', source: 'n4', target: 'n2' }, // review -> process rework edge
      ],
    };

    const res = validateGraph(graph);
    expect(res.valid).toBe(true);
  });
});
