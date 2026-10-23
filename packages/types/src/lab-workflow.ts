import { BaseEntity } from './common';

export type LabWorkflowStepType =
  | 'registration'
  | 'collection'
  | 'receive'
  | 'process'
  | 'qc_check'
  | 'result_entry'
  | 'review'
  | 'report_draft'
  | 'notify'
  | 'forward_report'
  | 'sample_reception'
  | 'specimen_identification'
  | 'preparation_processing'
  | 'test_execution'
  | 'observation_entry'
  | 'review_approval'
  | 'notes_attachments'
  | 'conditional_decision'
  | 'repeat_rework'
  | 'report_finalization';

export type LabWorkflowAutoAction =
  | 'set_expiry_from_catalog'
  | 'create_notification'
  | 'create_report_draft'
  | 'assign_to_role'
  | 'advance_on_complete';

export interface LabWorkflowNodeData {
  label: string;
  stepType: LabWorkflowStepType;
  assignedRole?: string;
  autoActions?: LabWorkflowAutoAction[];
}

export interface LabWorkflowGraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: LabWorkflowNodeData;
}

export interface LabWorkflowGraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface LabWorkflowGraphJson {
  nodes: LabWorkflowGraphNode[];
  edges: LabWorkflowGraphEdge[];
}

export type LabWorkflowStatus = 'draft' | 'published';

export interface LabWorkflowTemplate extends BaseEntity {
  test_id: string | null; // null for default workflow
  version: number;
  graph_json: string; // JSON stringified LabWorkflowGraphJson
  is_default: boolean;
  status: LabWorkflowStatus;
}

export type LabWorkflowRunState = 'running' | 'completed' | 'blocked' | 'cancelled';

export interface LabWorkflowRun extends BaseEntity {
  order_id: string;
  template_id: string;
  template_version: number;
  state: LabWorkflowRunState;
}

export type LabWorkflowRunStepStatus = 'pending' | 'active' | 'done' | 'skipped' | 'blocked';

export interface LabWorkflowRunStep extends BaseEntity {
  run_id: string;
  node_id: string;
  status: LabWorkflowRunStepStatus;
  completed_by: string | null;
  completed_at: string | null;
  block_reason: string | null;
}
