import type { LabWorkflowGraphJson, LabWorkflowGraphNode, LabWorkflowGraphEdge } from '@40labs/types';

export interface ValidationError {
  nodeId?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validateGraph(graph: LabWorkflowGraphJson): ValidationResult {
  const errors: ValidationError[] = [];
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];

  if (nodes.length === 0) {
    return { valid: false, errors: [{ message: 'Workflow graph must contain at least one step node.' }] };
  }

  const nodeMap = new Map<string, LabWorkflowGraphNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // Build adjacency list and in-degree count
  const incomingMap = new Map<string, string[]>();
  const outgoingMap = new Map<string, string[]>();
  for (const node of nodes) {
    incomingMap.set(node.id, []);
    outgoingMap.set(node.id, []);
  }

  for (const edge of edges) {
    if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) {
      errors.push({ message: `Edge ${edge.id} connects to non-existent node.` });
      continue;
    }
    outgoingMap.get(edge.source)!.push(edge.target);
    incomingMap.get(edge.target)!.push(edge.source);
  }

  // 1. Exactly one start node (in-degree === 0)
  const startNodes = nodes.filter((n) => (incomingMap.get(n.id) || []).length === 0);
  if (startNodes.length === 0) {
    errors.push({ message: 'Workflow graph must have a starting node (no incoming edges).' });
  } else if (startNodes.length > 1) {
    for (const sn of startNodes) {
      errors.push({ nodeId: sn.id, message: 'Multiple start nodes detected; workflow must have exactly one start.' });
    }
  }

  // 2. At least one result_entry and one terminal node (out-degree === 0)
  const resultEntryNodes = nodes.filter((n) => n.data.stepType === 'result_entry');
  if (resultEntryNodes.length === 0) {
    errors.push({ message: 'Workflow must contain at least one result_entry step.' });
  }

  const terminalNodes = nodes.filter((n) => (outgoingMap.get(n.id) || []).length === 0);
  if (terminalNodes.length === 0) {
    errors.push({ message: 'Workflow must have at least one terminal node (no outgoing edges).' });
  }

  // 3. Reachability from start node(s) and branch termination
  const reachableNodes = new Set<string>();
  if (startNodes.length === 1) {
    const queue = [startNodes[0].id];
    reachableNodes.add(startNodes[0].id);
    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const next of outgoingMap.get(curr) || []) {
        if (!reachableNodes.has(next)) {
          reachableNodes.add(next);
          queue.push(next);
        }
      }
    }

    for (const node of nodes) {
      if (!reachableNodes.has(node.id)) {
        errors.push({ nodeId: node.id, message: `Node ${node.id} (${node.data.label}) is unreachable from the start node.` });
      }
    }
  }

  // 4. Cycle detection (allow explicit "rework" from review or qc_check back to process)
  // We check for cycles using DFS
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function dfs(currId: string): boolean {
    visiting.add(currId);
    const currNode = nodeMap.get(currId);

    for (const nextId of outgoingMap.get(currId) || []) {
      const nextNode = nodeMap.get(nextId);
      // Check if this is an allowed rework edge: source is review or qc_check, target is process
      const isAllowedRework =
        currNode &&
        (currNode.data.stepType === 'review' || currNode.data.stepType === 'qc_check') &&
        nextNode &&
        nextNode.data.stepType === 'process';

      if (isAllowedRework) {
        continue; // Skip cycle check for allowed rework
      }

      if (visiting.has(nextId)) {
        errors.push({ nodeId: nextId, message: `Disallowed cycle detected involving node ${nextId}.` });
        return true;
      }
      if (!visited.has(nextId)) {
        if (dfs(nextId)) return true;
      }
    }

    visiting.delete(currId);
    visited.add(currId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
