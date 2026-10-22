import { describe, it, expect } from 'vitest';
import { completeStepAndAdvance, DEFAULT_WORKFLOW_GRAPH, getValidatedGraphOrFallback } from '../advance';

describe('Workflow Engine - advance', () => {
  it('advances workflow steps idempotently and executes auto-actions', () => {
    const graph = DEFAULT_WORKFLOW_GRAPH;
    const firstNodeId = graph.nodes[0].id; // s_reg

    const result1 = completeStepAndAdvance(
      {
        runId: 'run_1',
        graph,
        steps: [],
        actorUserId: 'user_1',
      },
      firstNodeId
    );

    expect(result1.runState).toBe('running');
    const regStep = result1.updatedSteps.find((s) => s.node_id === 's_reg');
    const collStep = result1.updatedSteps.find((s) => s.node_id === 's_coll');
    expect(regStep?.status).toBe('done');
    expect(collStep?.status).toBe('active');

    // Idempotency test: re-run advance on s_reg
    const result2 = completeStepAndAdvance(
      {
        runId: 'run_1',
        graph,
        steps: result1.updatedSteps,
        actorUserId: 'user_1',
      },
      firstNodeId
    );

    expect(result2.updatedSteps).toEqual(result1.updatedSteps);
    expect(result2.executedActions.length).toBe(0);
  });

  it('blocks step advancement if sample has expired', () => {
    const graph = DEFAULT_WORKFLOW_GRAPH;
    const collNodeId = graph.nodes[1].id; // s_coll

    const expiredSample = {
      id: 'samp_exp',
      expires_at: '2020-01-01T00:00:00Z', // in the past
      status: 'collected',
    };

    const result = completeStepAndAdvance(
      {
        runId: 'run_2',
        graph,
        steps: [
          {
            id: 'step_run_2_s_reg',
            workspace_id: 'ws_1',
            branch_id: 'br_1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            run_id: 'run_2',
            node_id: 's_reg',
            status: 'done',
            completed_by: 'user_1',
            completed_at: new Date().toISOString(),
            block_reason: null,
          },
          {
            id: 'step_run_2_s_coll',
            workspace_id: 'ws_1',
            branch_id: 'br_1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            run_id: 'run_2',
            node_id: collNodeId,
            status: 'active',
            completed_by: null,
            completed_at: null,
            block_reason: null,
          },
        ],
        actorUserId: 'user_1',
        sample: expiredSample,
      },
      collNodeId
    );

    expect(result.runState).toBe('blocked');
    expect(result.blockReason).toContain('expired');
    const collStep = result.updatedSteps.find((s) => s.node_id === collNodeId);
    expect(collStep?.status).toBe('blocked');
  });

  it('falls back to default workflow if loaded graph is invalid', () => {
    const invalidGraphJson = JSON.stringify({
      nodes: [{ id: 'n1', type: 'step', position: { x: 0, y: 0 }, data: { label: 'Invalid', stepType: 'process' } }],
      edges: [], // no result_entry, missing valid start/terminal
    });

    const { graph, fallbackUsed } = getValidatedGraphOrFallback(invalidGraphJson);
    expect(fallbackUsed).toBe(true);
    expect(graph).toEqual(DEFAULT_WORKFLOW_GRAPH);
  });
});
