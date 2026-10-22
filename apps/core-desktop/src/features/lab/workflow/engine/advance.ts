import type { LabWorkflowGraphJson, LabWorkflowRunStep, LabWorkflowAutoAction } from '@40labs/types';
import { validateGraph } from '../validateGraph';

export interface AdvanceContext {
  runId: string;
  graph: LabWorkflowGraphJson;
  steps: LabWorkflowRunStep[];
  actorUserId: string;
  sample?: { id: string; expires_at: string | null; status: string };
  testCatalogEntry?: { stability_hours: number | null };
}

export interface AdvanceResult {
  updatedSteps: LabWorkflowRunStep[];
  runState: 'running' | 'completed' | 'blocked' | 'cancelled';
  executedActions: string[];
  blockReason?: string;
}

export const DEFAULT_WORKFLOW_GRAPH: LabWorkflowGraphJson = {
  nodes: [
    { id: 's_reg', type: 'step', position: { x: 0, y: 0 }, data: { label: 'Registration', stepType: 'registration', autoActions: ['advance_on_complete'] } },
    { id: 's_coll', type: 'step', position: { x: 100, y: 0 }, data: { label: 'Collection', stepType: 'collection', autoActions: ['set_expiry_from_catalog', 'advance_on_complete'] } },
    { id: 's_recv', type: 'step', position: { x: 200, y: 0 }, data: { label: 'Receive', stepType: 'receive', autoActions: ['advance_on_complete'] } },
    { id: 's_proc', type: 'step', position: { x: 300, y: 0 }, data: { label: 'Process', stepType: 'process', autoActions: ['advance_on_complete'] } },
    { id: 's_res', type: 'step', position: { x: 400, y: 0 }, data: { label: 'Result Entry', stepType: 'result_entry', autoActions: ['advance_on_complete'] } },
    { id: 's_rev', type: 'step', position: { x: 500, y: 0 }, data: { label: 'Review', stepType: 'review', autoActions: ['advance_on_complete'] } },
    { id: 's_rep', type: 'step', position: { x: 600, y: 0 }, data: { label: 'Report Draft', stepType: 'report_draft', autoActions: ['create_report_draft', 'advance_on_complete'] } },
  ],
  edges: [
    { id: 'e1', source: 's_reg', target: 's_coll' },
    { id: 'e2', source: 's_coll', target: 's_recv' },
    { id: 'e3', source: 's_recv', target: 's_proc' },
    { id: 'e4', source: 's_proc', target: 's_res' },
    { id: 'e5', source: 's_res', target: 's_rev' },
    { id: 'e6', source: 's_rev', target: 's_rep' },
  ],
};

export function getValidatedGraphOrFallback(graphJsonString: string): { graph: LabWorkflowGraphJson; fallbackUsed: boolean } {
  try {
    const parsed = JSON.parse(graphJsonString) as LabWorkflowGraphJson;
    const validation = validateGraph(parsed);
    if (!validation.valid) {
      return { graph: DEFAULT_WORKFLOW_GRAPH, fallbackUsed: true };
    }
    return { graph: parsed, fallbackUsed: false };
  } catch {
    return { graph: DEFAULT_WORKFLOW_GRAPH, fallbackUsed: true };
  }
}

export function completeStepAndAdvance(
  context: AdvanceContext,
  targetNodeId: string
): AdvanceResult {
  const { runId, graph, actorUserId, sample, testCatalogEntry } = context;
  let steps = [...context.steps];
  const executedActions: string[] = [];

  // Find step in steps or initialize if empty
  if (steps.length === 0) {
    for (const node of graph.nodes) {
      const isStart = (graph.edges.filter((e) => e.target === node.id)).length === 0;
      steps.push({
        id: `step_${runId}_${node.id}`,
        workspace_id: 'ws_1',
        branch_id: 'br_1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        run_id: runId,
        node_id: node.id,
        status: isStart ? 'active' : 'pending',
        completed_by: null,
        completed_at: null,
        block_reason: null,
      });
    }
  }

  const targetStepIndex = steps.findIndex((s) => s.node_id === targetNodeId);
  if (targetStepIndex === -1) {
    return { updatedSteps: steps, runState: 'running', executedActions: [], blockReason: 'Node not found in run steps' };
  }

  const targetStep = steps[targetStepIndex];

  // Idempotency check: if already done, return current state
  if (targetStep.status === 'done') {
    return { updatedSteps: steps, runState: 'running', executedActions: [] };
  }

  if (targetStep.status === 'blocked') {
    return { updatedSteps: steps, runState: 'blocked', executedActions: [], blockReason: targetStep.block_reason || 'Step is blocked' };
  }

  const targetNode = graph.nodes.find((n) => n.id === targetNodeId);
  if (!targetNode) {
    return { updatedSteps: steps, runState: 'running', executedActions: [], blockReason: 'Target node definition missing' };
  }

  // Check sample expiry if applicable
  if (sample && sample.expires_at) {
    const isExpired = new Date(sample.expires_at).getTime() < Date.now();
    if (isExpired && targetNode.data.stepType !== 'registration') {
      steps[targetStepIndex] = {
        ...targetStep,
        status: 'blocked',
        block_reason: 'Sample has expired. Recalibration or recollection required.',
        updated_at: new Date().toISOString(),
      };
      return { updatedSteps: steps, runState: 'blocked', executedActions: [], blockReason: 'Sample has expired' };
    }
  }

  // Execute whitelist auto-actions
  const autoActions = targetNode.data.autoActions || [];
  for (const action of autoActions as LabWorkflowAutoAction[]) {
    switch (action) {
      case 'set_expiry_from_catalog':
        if (testCatalogEntry?.stability_hours) {
          executedActions.push('set_expiry_from_catalog');
        }
        break;
      case 'create_notification':
        executedActions.push('create_notification');
        break;
      case 'create_report_draft':
        executedActions.push('create_report_draft');
        break;
      case 'assign_to_role':
        executedActions.push(`assign_to_role:${targetNode.data.assignedRole || 'default'}`);
        break;
      case 'advance_on_complete':
        executedActions.push('advance_on_complete');
        break;
    }
  }

  // Mark target step as done
  const now = new Date().toISOString();
  steps[targetStepIndex] = {
    ...targetStep,
    status: 'done',
    completed_by: actorUserId,
    completed_at: now,
    updated_at: now,
  };

  // Advance to next connected nodes if advance_on_complete is enabled
  const outgoingEdges = graph.edges.filter((e) => e.source === targetNodeId);
  for (const edge of outgoingEdges) {
    const nextStepIdx = steps.findIndex((s) => s.node_id === edge.target);
    if (nextStepIdx !== -1 && steps[nextStepIdx].status === 'pending') {
      steps[nextStepIdx] = {
        ...steps[nextStepIdx],
        status: 'active',
        updated_at: now,
      };
    }
  }

  // Determine overall run state
  const allDone = steps.every((s) => s.status === 'done' || s.status === 'skipped');
  const anyBlocked = steps.some((s) => s.status === 'blocked');
  const runState = allDone ? 'completed' : anyBlocked ? 'blocked' : 'running';

  return {
    updatedSteps: steps,
    runState,
    executedActions,
  };
}
