import type { LabWorkflowTemplate, LabWorkflowRun, LabWorkflowRunStep } from '@40labs/types';
import { DEFAULT_WORKFLOW_GRAPH } from '../features/lab/workflow/engine/advance';
import { WORKSPACE_ID, BRANCH_ID } from '../devData';

let workflowsStore: LabWorkflowTemplate[] = [
  {
    id: 'wf_default',
    workspace_id: WORKSPACE_ID,
    branch_id: BRANCH_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    test_id: null,
    version: 1,
    graph_json: JSON.stringify(DEFAULT_WORKFLOW_GRAPH),
    is_default: true,
    status: 'published',
  },
];

let runsStore: LabWorkflowRun[] = [];
let stepsStore: LabWorkflowRunStep[] = [];

export const labWorkflowApi = {
  listWorkflows: async (): Promise<LabWorkflowTemplate[]> => {
    return [...workflowsStore];
  },

  getWorkflowForTest: async (testId: string): Promise<LabWorkflowTemplate | null> => {
    const found = workflowsStore.find((w) => w.test_id === testId && w.status === 'published');
    if (found) return found;
    return workflowsStore.find((w) => w.is_default) || null;
  },

  saveWorkflowDraft: async (testId: string | null, graphJson: string): Promise<LabWorkflowTemplate> => {
    const existingIndex = workflowsStore.findIndex((w) => w.test_id === testId && w.status === 'draft');
    const now = new Date().toISOString();
    if (existingIndex !== -1) {
      const updated: LabWorkflowTemplate = {
        ...workflowsStore[existingIndex],
        graph_json: graphJson,
        updated_at: now,
      };
      workflowsStore[existingIndex] = updated;
      return updated;
    }

    const latest = workflowsStore.filter((w) => w.test_id === testId).sort((a, b) => b.version - a.version)[0];
    const newVersion = latest ? latest.version + 1 : 1;

    const newTemplate: LabWorkflowTemplate = {
      id: `wf_${Date.now()}`,
      workspace_id: WORKSPACE_ID,
      branch_id: BRANCH_ID,
      created_at: now,
      updated_at: now,
      test_id: testId,
      version: newVersion,
      graph_json: graphJson,
      is_default: false,
      status: 'draft',
    };

    workflowsStore = [newTemplate, ...workflowsStore];
    return newTemplate;
  },

  publishWorkflow: async (templateId: string): Promise<LabWorkflowTemplate> => {
    const idx = workflowsStore.findIndex((w) => w.id === templateId);
    if (idx === -1) throw new Error('Workflow template not found');
    const now = new Date().toISOString();

    // Archive or supersede previous published for this test
    const target = workflowsStore[idx];
    workflowsStore = workflowsStore.map((w) => {
      if (w.test_id === target.test_id && w.status === 'published' && w.id !== templateId) {
        return { ...w, status: 'draft' as const };
      }
      return w;
    });

    const published: LabWorkflowTemplate = {
      ...target,
      status: 'published',
      updated_at: now,
    };
    workflowsStore[idx] = published;
    return published;
  },

  getOrderWorkflowRun: async (orderId: string): Promise<{ run: LabWorkflowRun; steps: LabWorkflowRunStep[] } | null> => {
    const run = runsStore.find((r) => r.order_id === orderId);
    if (!run) return null;
    const steps = stepsStore.filter((s) => s.run_id === run.id);
    return { run, steps };
  },

  completeRunStep: async (runId: string, nodeId: string, actorUserId: string): Promise<{ run: LabWorkflowRun; steps: LabWorkflowRunStep[] }> => {
    let run = runsStore.find((r) => r.id === runId);
    if (!run) {
      throw new Error('Workflow run not found');
    }
    let steps = stepsStore.filter((s) => s.run_id === runId);
    const stepIdx = steps.findIndex((s) => s.node_id === nodeId);
    if (stepIdx === -1) throw new Error('Run step not found');

    const now = new Date().toISOString();
    steps[stepIdx] = {
      ...steps[stepIdx],
      status: 'done',
      completed_by: actorUserId,
      completed_at: now,
      updated_at: now,
    };

    stepsStore = stepsStore.map((s) => (s.run_id === runId ? steps.find((st) => st.id === s.id) || s : s));

    return { run, steps };
  },
};
