import { create } from 'zustand';
import { Connection, Edge, Node, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react';
import type { LabWorkflowGraphJson, LabWorkflowStepType, LabWorkflowAutoAction } from '@40labs/types';
import { migrateGraph } from '../utils/migrateGraph';
import { validateGraph, ValidationError } from '../validateGraph';
import { getLayoutedElements } from '../utils/autoLayout';
import { workflowFileService, WorkflowFile, SUPPORTED_SCHEMA_VERSION } from '../services/workflowFileService';
import { DEFAULT_WORKFLOW_GRAPH } from '../engine/advance';

interface WorkflowState {
  workflowId: string;
  workflowName: string;
  workflowStatus: 'draft' | 'published';
  workflowVersion: number;
  filename: string | null;
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  validationErrors: ValidationError[];
  isSaving: boolean;
  isDirty: boolean;
  lastSavedAt: string | null;
  toastMessage: string | null;
  history: { nodes: Node[]; edges: Edge[] }[];
  historyIndex: number;

  // Actions
  initGraph: (workflowFile?: WorkflowFile) => void;
  loadWorkflowFromFile: (filename: string) => Promise<void>;
  saveCurrentWorkflow: (statusOverride?: 'draft' | 'published') => Promise<void>;
  publishWorkflow: () => Promise<boolean>;
  setWorkflowName: (name: string) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setSelectedNodeId: (id: string | null) => void;
  addStep: (stepType: LabWorkflowStepType, position?: { x: number; y: number }) => void;
  deleteSelected: () => void;
  updateSelectedNodeData: (key: string, value: any) => void;
  updateNodeLabel: (id: string, label: string) => void;
  toggleAutoAction: (actionId: LabWorkflowAutoAction) => void;
  applyAutoLayout: () => void;
  validateWorkflow: () => boolean;
  getGraphJson: () => LabWorkflowGraphJson;
  setToastMessage: (msg: string | null) => void;
  undo: () => void;
  redo: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflowId: 'wf_' + Math.random().toString(36).substring(2, 9),
  workflowName: 'Laboratory Diagnostic Workflow',
  workflowStatus: 'draft',
  workflowVersion: 1,
  filename: null,
  nodes: DEFAULT_WORKFLOW_GRAPH.nodes as Node[],
  edges: DEFAULT_WORKFLOW_GRAPH.edges as Edge[],
  selectedNodeId: null,
  validationErrors: [],
  isSaving: false,
  isDirty: false,
  lastSavedAt: null,
  toastMessage: null,
  history: [{ nodes: DEFAULT_WORKFLOW_GRAPH.nodes as Node[], edges: DEFAULT_WORKFLOW_GRAPH.edges as Edge[] }],
  historyIndex: 0,

  initGraph: (workflowFile?: WorkflowFile) => {
    let graph: LabWorkflowGraphJson = DEFAULT_WORKFLOW_GRAPH;
    let name = 'Laboratory Diagnostic Workflow';
    let status: 'draft' | 'published' = 'draft';
    let version = 1;
    let id = 'wf_' + Math.random().toString(36).substring(2, 9);
    let filename: string | null = null;

    if (workflowFile) {
      id = workflowFile.id;
      name = workflowFile.name;
      status = workflowFile.status as any;
      version = (workflowFile as any).version || 1;
      filename = workflowFile.filename || null;
      graph = migrateGraph({ nodes: workflowFile.nodes, edges: workflowFile.edges });
    }

    const layouted = getLayoutedElements(graph.nodes as Node[], graph.edges as Edge[]);

    set({
      workflowId: id,
      workflowName: name,
      workflowStatus: status,
      workflowVersion: version,
      filename,
      nodes: layouted.nodes,
      edges: layouted.edges,
      history: [{ nodes: layouted.nodes, edges: layouted.edges }],
      historyIndex: 0,
      validationErrors: [],
      isDirty: false,
      lastSavedAt: null,
    });
  },

  loadWorkflowFromFile: async (filename: string) => {
    try {
      const file = await workflowFileService.readWorkflow(filename);
      const graph = migrateGraph({ nodes: file.nodes, edges: file.edges });
      set({
        workflowId: file.id,
        workflowName: file.name,
        workflowStatus: file.status as any,
        workflowVersion: (file as any).version || 1,
        filename: file.filename || filename,
        nodes: graph.nodes as Node[],
        edges: graph.edges as Edge[],
        history: [{ nodes: graph.nodes as Node[], edges: graph.edges as Edge[] }],
        historyIndex: 0,
        isDirty: false,
        toastMessage: `Loaded workflow: ${file.name}`,
      });
    } catch (err: any) {
      set({ toastMessage: err?.message || 'Failed to load workflow file' });
    }
  },

  saveCurrentWorkflow: async (statusOverride?: 'draft' | 'published') => {
    const state = get();
    if (state.workflowStatus === 'published' && !statusOverride) {
      set({ toastMessage: 'Published workflows are read-only. Create a new draft version to edit.' });
      return;
    }

    set({ isSaving: true });
    try {
      const status = statusOverride || state.workflowStatus;
      const workflowData: WorkflowFile & { version?: number } = {
        schemaVersion: SUPPORTED_SCHEMA_VERSION,
        id: state.workflowId,
        name: state.workflowName,
        labCategory: 'General Lab',
        status,
        version: state.workflowVersion,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: state.nodes,
        edges: state.edges,
      };

      const meta = await workflowFileService.saveWorkflow(workflowData as any);
      set({
        workflowStatus: status,
        filename: meta.filename,
        isDirty: false,
        lastSavedAt: new Date().toISOString(),
        toastMessage: `Workflow saved successfully as ${meta.filename}`,
      });
    } catch (err: any) {
      set({ isDirty: true, toastMessage: err?.message || 'Failed to save workflow' });
    } finally {
      set({ isSaving: false });
    }
  },

  publishWorkflow: async (): Promise<boolean> => {
    const isValid = get().validateWorkflow();
    if (!isValid) {
      set({ toastMessage: 'Publish blocked: Fix validation errors before publishing.' });
      return false;
    }

    const newVersion = get().workflowVersion + 1;
    set({ workflowStatus: 'published', workflowVersion: newVersion });
    await get().saveCurrentWorkflow('published');
    set({ toastMessage: `Workflow published successfully (v${newVersion})!` });
    return true;
  },

  setWorkflowName: (name: string) => {
    if (get().workflowStatus === 'published') return;
    set({ workflowName: name, isDirty: true });
  },

  onNodesChange: (changes: NodeChange[]) => {
    if (get().workflowStatus === 'published') return;
    const updatedNodes = applyNodeChanges(changes, get().nodes);
    set({ nodes: updatedNodes, isDirty: true });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    if (get().workflowStatus === 'published') return;
    const updatedEdges = applyEdgeChanges(changes, get().edges);
    set({ edges: updatedEdges, isDirty: true });
  },

  onConnect: (connection: Connection) => {
    if (get().workflowStatus === 'published') return;
    const { source, target } = connection;
    if (!source || !target) return;

    if (source === target) {
      set({ toastMessage: 'Validation Error: Self-loops are not allowed.' });
      return;
    }

    const { edges, nodes } = get();
    const exists = edges.some((e) => e.source === source && e.target === target && e.sourceHandle === connection.sourceHandle);
    if (exists) {
      set({ toastMessage: 'Validation Error: Duplicate edge already exists.' });
      return;
    }

    const sourceNode = nodes.find((n) => n.id === source);
    const isRepeatRework = sourceNode?.data?.stepType === 'repeat_rework';
    if (!isRepeatRework) {
      const hasCycle = checkCycle(target, source, edges);
      if (hasCycle) {
        set({ toastMessage: 'Validation Error: Cycles are only permitted from Repeat & Rework nodes.' });
        return;
      }
    }

    const newEdge = { ...connection, type: 'smoothstep', animated: false };
    const updatedEdges = addEdge(newEdge, edges);
    const history = get().history.slice(0, get().historyIndex + 1);

    set({
      edges: updatedEdges,
      isDirty: true,
      history: [...history, { nodes, edges: updatedEdges }],
      historyIndex: history.length,
    });
  },

  setSelectedNodeId: (id: string | null) => {
    set({ selectedNodeId: id });
  },

  addStep: (stepType: LabWorkflowStepType, position?: { x: number; y: number }) => {
    if (get().workflowStatus === 'published') return;
    const { nodes, edges } = get();
    const newId = `node_${Date.now()}`;
    const pos = position || { x: 100 + (nodes.length % 4) * 260, y: 100 + Math.floor(nodes.length / 4) * 140 };

    const newNode: Node = {
      id: newId,
      type: 'labNode',
      position: pos,
      data: {
        label: stepType.replace(/_/g, ' ').toUpperCase(),
        stepType,
        autoActions: ['advance_on_complete'],
      },
    };

    const updatedNodes = [...nodes, newNode];
    const history = get().history.slice(0, get().historyIndex + 1);

    set({
      nodes: updatedNodes,
      isDirty: true,
      selectedNodeId: newId,
      history: [...history, { nodes: updatedNodes, edges }],
      historyIndex: history.length,
    });
  },

  deleteSelected: () => {
    if (get().workflowStatus === 'published') return;
    const { selectedNodeId, nodes, edges } = get();
    if (!selectedNodeId) return;
    const updatedNodes = nodes.filter((n) => n.id !== selectedNodeId);
    const updatedEdges = edges.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId);
    const history = get().history.slice(0, get().historyIndex + 1);

    set({
      nodes: updatedNodes,
      edges: updatedEdges,
      isDirty: true,
      selectedNodeId: null,
      history: [...history, { nodes: updatedNodes, edges: updatedEdges }],
      historyIndex: history.length,
    });
  },

  updateSelectedNodeData: (key: string, value: any) => {
    if (get().workflowStatus === 'published') return;
    const { selectedNodeId, nodes } = get();
    if (!selectedNodeId) return;
    const updatedNodes = nodes.map((n) => {
      if (n.id === selectedNodeId) {
        return {
          ...n,
          data: { ...n.data, [key]: value },
        };
      }
      return n;
    });
    set({ nodes: updatedNodes, isDirty: true });
  },

  updateNodeLabel: (id: string, label: string) => {
    if (get().workflowStatus === 'published') return;
    const { nodes, edges } = get();
    const updatedNodes = nodes.map((n) => {
      if (n.id === id) {
        return {
          ...n,
          data: { ...n.data, label },
        };
      }
      return n;
    });
    const history = get().history.slice(0, get().historyIndex + 1);
    set({
      nodes: updatedNodes,
      isDirty: true,
      history: [...history, { nodes: updatedNodes, edges }],
      historyIndex: history.length,
    });
  },

  toggleAutoAction: (actionId: LabWorkflowAutoAction) => {
    if (get().workflowStatus === 'published') return;
    const { selectedNodeId, nodes } = get();
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (!node) return;
    const currentActions = (node.data.autoActions as LabWorkflowAutoAction[]) || [];
    const updated = currentActions.includes(actionId)
      ? currentActions.filter((a) => a !== actionId)
      : [...currentActions, actionId];
    get().updateSelectedNodeData('autoActions', updated);
  },

  applyAutoLayout: () => {
    if (get().workflowStatus === 'published') return;
    const { nodes, edges } = get();
    const layouted = getLayoutedElements(nodes, edges);
    set({
      nodes: layouted.nodes,
      isDirty: true,
      toastMessage: 'Auto-layout applied successfully.',
    });
  },

  validateWorkflow: () => {
    const res = validateGraph(get().getGraphJson());
    set({ validationErrors: res.errors });
    if (res.valid) {
      set({ toastMessage: 'Workflow graph validation passed successfully!' });
    } else {
      set({ toastMessage: `Validation failed with ${res.errors.length} error(s).` });
    }
    return res.valid;
  },

  getGraphJson: (): LabWorkflowGraphJson => ({
    version: SUPPORTED_SCHEMA_VERSION,
    nodes: get().nodes as any,
    edges: get().edges as any,
  }),

  setToastMessage: (msg: string | null) => set({ toastMessage: msg }),

  undo: () => {
    if (get().workflowStatus === 'published') return;
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      set({ nodes: prev.nodes, edges: prev.edges, historyIndex: historyIndex - 1, isDirty: true });
    }
  },

  redo: () => {
    if (get().workflowStatus === 'published') return;
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      set({ nodes: next.nodes, edges: next.edges, historyIndex: historyIndex + 1, isDirty: true });
    }
  },
}));

function checkCycle(startNode: string, targetNode: string, edges: Edge[]): boolean {
  let visited = new Set<string>();
  let queue = [startNode];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr === targetNode) return true;
    if (!visited.has(curr)) {
      visited.add(curr);
      const outgoing = edges.filter((e) => e.source === curr).map((e) => e.target);
      queue.push(...outgoing);
    }
  }
  return false;
}
