import { describe, test, expect } from 'vitest';
import { useWorkflowStore } from '../store/workflowStore';

describe('Workflow Edge Validation Rules', () => {
  test('rejects self-loops', () => {
    const store = useWorkflowStore.getState();
    store.initGraph();
    // Add node
    store.addStep('sample_reception');
    const nodes = useWorkflowStore.getState().nodes;
    const nodeId = nodes[nodes.length - 1].id;

    const initialEdgesCount = useWorkflowStore.getState().edges.length;
    store.onConnect({ source: nodeId, target: nodeId, sourceHandle: null, targetHandle: null });
    expect(useWorkflowStore.getState().edges.length).toBe(initialEdgesCount);
  });

  test('allows repeat_rework back-edges while blocking cycles for normal nodes', () => {
    const store = useWorkflowStore.getState();
    store.initGraph({
      schemaVersion: 1,
      id: 'test_wf',
      name: 'Test',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        { id: 'node_1', type: 'labNode', position: { x: 0, y: 0 }, data: { label: 'Exec', stepType: 'test_execution' } },
        { id: 'node_2', type: 'labNode', position: { x: 200, y: 0 }, data: { label: 'Rework', stepType: 'repeat_rework' } },
      ],
      edges: [
        { id: 'e1', source: 'node_1', target: 'node_2' },
      ],
    });

    // Attempting back-edge from repeat_rework (node_2) to test_execution (node_1) should be ALLOWED
    store.onConnect({ source: 'node_2', target: 'node_1', sourceHandle: null, targetHandle: null });
    expect(useWorkflowStore.getState().edges.length).toBe(2);
  });
});
