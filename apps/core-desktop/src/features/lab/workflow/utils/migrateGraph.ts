import type { LabWorkflowGraphJson, LabWorkflowStepType } from '@40labs/types';

export const NODE_CATEGORIES: { category: string; color: string; bg: string; border: string; types: LabWorkflowStepType[] }[] = [
  {
    category: 'Pre-Analytics',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    types: ['sample_reception', 'specimen_identification', 'registration', 'collection', 'receive'],
  },
  {
    category: 'Analytics',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    types: ['preparation_processing', 'test_execution', 'observation_entry', 'process', 'result_entry'],
  },
  {
    category: 'Quality & Governance',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    types: ['qc_check', 'review_approval', 'conditional_decision', 'repeat_rework', 'review'],
  },
  {
    category: 'Post-Analytics',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    types: ['notes_attachments', 'report_finalization', 'report_draft', 'notify', 'forward_report'],
  },
];

export function getNodeCategoryAndColor(stepType: LabWorkflowStepType) {
  for (const cat of NODE_CATEGORIES) {
    if (cat.types.includes(stepType)) {
      return { category: cat.category, color: cat.color, bg: cat.bg, border: cat.border };
    }
  }
  return { category: 'General', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' };
}

export function migrateGraph(rawJson: any): LabWorkflowGraphJson {
  if (!rawJson) {
    return { version: 2, nodes: [], edges: [] };
  }

  const version = rawJson.version || 1;
  const nodes = (rawJson.nodes || []).map((node: any, index: number) => {
    const stepType: LabWorkflowStepType = node.data?.stepType || 'sample_reception';
    const styling = getNodeCategoryAndColor(stepType);

    // Fix overlapping positions by applying proper grid spacing (dx = 280, dy = 120)
    const position = node.position && typeof node.position.x === 'number' && typeof node.position.y === 'number'
      ? node.position
      : { x: 100 + (index % 4) * 280, y: 100 + Math.floor(index / 4) * 160 };

    return {
      ...node,
      type: 'labNode',
      position,
      data: {
        ...node.data,
        stepType,
        category: node.data?.category || styling.category,
        color: node.data?.color || styling.color,
      },
    };
  });

  const edges = (rawJson.edges || []).map((edge: any) => ({
    ...edge,
    type: edge.type || 'smoothstep',
    animated: edge.animated ?? false,
  }));

  return {
    version: 2,
    nodes,
    edges,
  };
}
