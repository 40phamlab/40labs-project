import type { WorkflowFile } from '../services/workflowFileService';
import { SUPPORTED_SCHEMA_VERSION } from '../services/workflowFileService';

export const STARTER_TEMPLATES: Omit<WorkflowFile, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    schemaVersion: SUPPORTED_SCHEMA_VERSION,
    name: 'Blood / Hematology Workflow',
    labCategory: 'Hematology',
    status: 'draft',
    nodes: [
      { id: 'n_rec', type: 'labNode', position: { x: 0, y: 100 }, data: { label: 'Sample Reception', stepType: 'sample_reception' } },
      { id: 'n_id', type: 'labNode', position: { x: 260, y: 100 }, data: { label: 'Specimen ID', stepType: 'specimen_identification' } },
      { id: 'n_prep', type: 'labNode', position: { x: 520, y: 100 }, data: { label: 'Preparation', stepType: 'preparation_processing' } },
      { id: 'n_exec', type: 'labNode', position: { x: 780, y: 100 }, data: { label: 'Test Execution', stepType: 'test_execution' } },
      { id: 'n_obs', type: 'labNode', position: { x: 1040, y: 100 }, data: { label: 'Observation Entry', stepType: 'observation_entry' } },
      { id: 'n_qc', type: 'labNode', position: { x: 1300, y: 100 }, data: { label: 'QC Check', stepType: 'qc_check' } },
      { id: 'n_rev', type: 'labNode', position: { x: 1560, y: 100 }, data: { label: 'Review & Approval', stepType: 'review_approval' } },
      { id: 'n_rep', type: 'labNode', position: { x: 1820, y: 100 }, data: { label: 'Report Finalization', stepType: 'report_finalization' } },
    ],
    edges: [
      { id: 'e1', source: 'n_rec', target: 'n_id', type: 'smoothstep' },
      { id: 'e2', source: 'n_id', target: 'n_prep', type: 'smoothstep' },
      { id: 'e3', source: 'n_prep', target: 'n_exec', type: 'smoothstep' },
      { id: 'e4', source: 'n_exec', target: 'n_obs', type: 'smoothstep' },
      { id: 'e5', source: 'n_obs', target: 'n_qc', type: 'smoothstep' },
      { id: 'e6', source: 'n_qc', target: 'n_rev', type: 'smoothstep' },
      { id: 'e7', source: 'n_rev', target: 'n_rep', type: 'smoothstep' },
    ],
  },
  {
    schemaVersion: SUPPORTED_SCHEMA_VERSION,
    name: 'Urinalysis Workflow',
    labCategory: 'Urinalysis',
    status: 'draft',
    nodes: [
      { id: 'u_rec', type: 'labNode', position: { x: 0, y: 100 }, data: { label: 'Sample Reception', stepType: 'sample_reception' } },
      { id: 'u_prep', type: 'labNode', position: { x: 260, y: 100 }, data: { label: 'Preparation', stepType: 'preparation_processing' } },
      { id: 'u_exec', type: 'labNode', position: { x: 520, y: 100 }, data: { label: 'Test Execution', stepType: 'test_execution' } },
      { id: 'u_obs', type: 'labNode', position: { x: 780, y: 100 }, data: { label: 'Observation Entry', stepType: 'observation_entry' } },
      { id: 'u_qc', type: 'labNode', position: { x: 1040, y: 100 }, data: { label: 'QC Check', stepType: 'qc_check' } },
      { id: 'u_rep', type: 'labNode', position: { x: 1300, y: 100 }, data: { label: 'Report Finalization', stepType: 'report_finalization' } },
    ],
    edges: [
      { id: 'ue1', source: 'u_rec', target: 'u_prep', type: 'smoothstep' },
      { id: 'ue2', source: 'u_prep', target: 'u_exec', type: 'smoothstep' },
      { id: 'ue3', source: 'u_exec', target: 'u_obs', type: 'smoothstep' },
      { id: 'ue4', source: 'u_obs', target: 'u_qc', type: 'smoothstep' },
      { id: 'ue5', source: 'u_qc', target: 'u_rep', type: 'smoothstep' },
    ],
  },
  {
    schemaVersion: SUPPORTED_SCHEMA_VERSION,
    name: 'Microbiology Culture Workflow',
    labCategory: 'Microbiology',
    status: 'draft',
    nodes: [
      { id: 'm_rec', type: 'labNode', position: { x: 0, y: 100 }, data: { label: 'Sample Reception', stepType: 'sample_reception' } },
      { id: 'm_id', type: 'labNode', position: { x: 260, y: 100 }, data: { label: 'Specimen ID', stepType: 'specimen_identification' } },
      { id: 'm_prep', type: 'labNode', position: { x: 520, y: 100 }, data: { label: 'Culture Preparation', stepType: 'preparation_processing' } },
      { id: 'm_exec', type: 'labNode', position: { x: 780, y: 100 }, data: { label: 'Incubation & Execution', stepType: 'test_execution' } },
      { id: 'm_dec', type: 'labNode', position: { x: 1040, y: 100 }, data: { label: 'Growth Check', stepType: 'conditional_decision' } },
      { id: 'm_qc', type: 'labNode', position: { x: 1300, y: 0 }, data: { label: 'QC Check', stepType: 'qc_check' } },
      { id: 'm_rev', type: 'labNode', position: { x: 1560, y: 0 }, data: { label: 'Review & Approval', stepType: 'review_approval' } },
      { id: 'm_rep', type: 'labNode', position: { x: 1820, y: 0 }, data: { label: 'Report Finalization', stepType: 'report_finalization' } },
      { id: 'm_rew', type: 'labNode', position: { x: 1300, y: 220 }, data: { label: 'Repeat Rework', stepType: 'repeat_rework' } },
    ],
    edges: [
      { id: 'me1', source: 'm_rec', target: 'm_id', type: 'smoothstep' },
      { id: 'me2', source: 'm_id', target: 'm_prep', type: 'smoothstep' },
      { id: 'me3', source: 'm_prep', target: 'm_exec', type: 'smoothstep' },
      { id: 'me4', source: 'm_exec', target: 'm_dec', type: 'smoothstep' },
      { id: 'me5', source: 'm_dec', target: 'm_qc', type: 'smoothstep', sourceHandle: 'yes' },
      { id: 'me6', source: 'm_dec', target: 'm_rew', type: 'smoothstep', sourceHandle: 'no' },
      { id: 'me7', source: 'm_rew', target: 'm_prep', type: 'smoothstep' }, // repeat rework loop back
      { id: 'me8', source: 'm_qc', target: 'm_rev', type: 'smoothstep' },
      { id: 'me9', source: 'm_rev', target: 'm_rep', type: 'smoothstep' },
    ],
  },
];
