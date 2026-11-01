import { describe, test, expect } from 'vitest';
import { WorkflowFileSchema, SUPPORTED_SCHEMA_VERSION } from '../workflowFileService';

describe('WorkflowFileService Zod Validation', () => {
  test('validates correct workflow file structure', () => {
    const validWorkflow = {
      schemaVersion: SUPPORTED_SCHEMA_VERSION,
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Hematology Workflow',
      labCategory: 'Analytics',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [],
      edges: [],
    };

    const result = WorkflowFileSchema.safeParse(validWorkflow);
    expect(result.success).toBe(true);
  });

  test('rejects unknown schemaVersion with readable error', () => {
    const invalidWorkflow = {
      schemaVersion: 999,
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Bad Schema Workflow',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [],
      edges: [],
    };

    const result = WorkflowFileSchema.safeParse(invalidWorkflow);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Unsupported schemaVersion');
    }
  });

  test('rejects missing required fields', () => {
    const incompleteWorkflow = {
      schemaVersion: SUPPORTED_SCHEMA_VERSION,
      name: 'Incomplete',
    };

    const result = WorkflowFileSchema.safeParse(incompleteWorkflow);
    expect(result.success).toBe(false);
  });
});
