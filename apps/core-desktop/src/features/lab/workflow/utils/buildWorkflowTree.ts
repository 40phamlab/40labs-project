import type { Node, Edge } from '@xyflow/react';
import type { ValidationError } from '../validateGraph';

export interface WorkflowTreeNode {
  id: string;
  nodeId: string;
  label: string;
  stepType: string;
  handleLabel?: string; // "Yes" / "No" for conditional branches
  hasError: boolean;
  isLoop: boolean;
  children: WorkflowTreeNode[];
}

export function buildWorkflowTree(
  nodes: Node[],
  edges: Edge[],
  validationErrors: ValidationError[] = []
): { roots: WorkflowTreeNode[]; unconnected: WorkflowTreeNode[] } {
  if (!nodes || nodes.length === 0) {
    return { roots: [], unconnected: [] };
  }

  const errorNodeIds = new Set(validationErrors.map((err) => err.nodeId).filter(Boolean));

  // Build adjacency map: node -> outgoing edges
  const outgoingMap = new Map<string, { target: string; sourceHandle?: string | null }[]>();
  nodes.forEach((n) => outgoingMap.set(n.id, []));
  edges.forEach((e) => {
    if (outgoingMap.has(e.source)) {
      outgoingMap.get(e.source)!.push({ target: e.target, sourceHandle: e.sourceHandle });
    }
  });

  // Calculate incoming and outgoing degrees
  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();
  nodes.forEach((n) => {
    inDegree.set(n.id, 0);
    outDegree.set(n.id, 0);
  });
  edges.forEach((e) => {
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    outDegree.set(e.source, (outDegree.get(e.source) || 0) + 1);
  });

  const visitedGlobal = new Set<string>();
  const roots: WorkflowTreeNode[] = [];
  const unconnected: WorkflowTreeNode[] = [];

  // Start nodes: inDegree === 0 and outDegree > 0 (or fallback if all nodes have inDegree > 0 due to cycles)
  const zeroInNodes = nodes.filter((n) => (inDegree.get(n.id) || 0) === 0);
  const startNodes = zeroInNodes.filter((n) => (outDegree.get(n.id) || 0) > 0);
  const actualStarts = startNodes.length > 0 ? startNodes : (zeroInNodes.length > 0 ? zeroInNodes : [nodes[0]]);

  function buildSubtree(nodeId: string, path: Set<string>): WorkflowTreeNode | null {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    const label = (node.data?.label as string) || node.id;
    const stepType = (node.data?.stepType as string) || 'unknown';
    const hasError = errorNodeIds.has(nodeId);

    // Cycle / loop detection
    if (path.has(nodeId)) {
      return {
        id: `${nodeId}_loop_${Math.random()}`,
        nodeId,
        label: `↺ back to ${label}`,
        stepType,
        hasError,
        isLoop: true,
        children: [],
      };
    }

    visitedGlobal.add(nodeId);
    const nextPath = new Set(path);
    nextPath.add(nodeId);

    const outEdges = outgoingMap.get(nodeId) || [];
    const children: WorkflowTreeNode[] = [];

    for (const edge of outEdges) {
      const childSub = buildSubtree(edge.target, nextPath);
      if (childSub) {
        if (edge.sourceHandle === 'yes') {
          childSub.handleLabel = 'Yes';
        } else if (edge.sourceHandle === 'no') {
          childSub.handleLabel = 'No';
        }
        children.push(childSub);
      }
    }

    return {
      id: `${nodeId}_${Math.random()}`,
      nodeId,
      label,
      stepType,
      hasError,
      isLoop: false,
      children,
    };
  }

  // Build from actual start nodes
  for (const start of actualStarts) {
    if (!visitedGlobal.has(start.id)) {
      const tree = buildSubtree(start.id, new Set());
      if (tree) roots.push(tree);
    }
  }

  // Isolated or unvisited nodes go to unconnected
  for (const node of nodes) {
    if (!visitedGlobal.has(node.id)) {
      const tree = buildSubtree(node.id, new Set());
      if (tree) unconnected.push(tree);
    }
  }

  return { roots, unconnected };
}
