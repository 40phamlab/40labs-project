import { z } from 'zod';
import { invokeCommand, isUsingTauriIpc } from '../../../../api/client';

export const SUPPORTED_SCHEMA_VERSION = 1;

export const WorkflowMetadataSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  labCategory: z.string().nullable().optional(),
  status: z.enum(['draft', 'published']),
  createdAt: z.string(),
  updatedAt: z.string(),
  filename: z.string(),
});

export type WorkflowMetadata = z.infer<typeof WorkflowMetadataSchema>;

export const WorkflowFileSchema = z.object({
  schemaVersion: z.number().refine((val) => val === SUPPORTED_SCHEMA_VERSION, {
    message: `Unsupported schemaVersion. Expected version ${SUPPORTED_SCHEMA_VERSION}.`,
  }),
  id: z.string(),
  name: z.string().min(1),
  labCategory: z.string().nullable().optional(),
  status: z.enum(['draft', 'published']),
  createdAt: z.string(),
  updatedAt: z.string(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  viewport: z.any().nullable().optional(),
  meta: z.any().nullable().optional(),
});

export type WorkflowFile = z.infer<typeof WorkflowFileSchema>;

export const workflowFileService = {
  listWorkflows: async (): Promise<WorkflowMetadata[]> => {
    if (isUsingTauriIpc()) {
      const raw = await invokeCommand<any[]>('list_workflows');
      return z.array(WorkflowMetadataSchema).parse(raw);
    }
    // Mock for browser/web mode
    return [];
  },

  readWorkflow: async (filename: string): Promise<WorkflowFile> => {
    if (isUsingTauriIpc()) {
      const raw = await invokeCommand<any>('read_workflow', { filename });
      return WorkflowFileSchema.parse(raw);
    }
    throw new Error('Read workflow requires Tauri IPC');
  },

  saveWorkflow: async (workflow: WorkflowFile): Promise<WorkflowMetadata> => {
    const validated = WorkflowFileSchema.parse(workflow);
    if (isUsingTauriIpc()) {
      const raw = await invokeCommand<any>('save_workflow', { workflow: validated });
      return WorkflowMetadataSchema.parse(raw);
    }
    throw new Error('Save workflow requires Tauri IPC');
  },

  duplicateWorkflow: async (filename: string): Promise<WorkflowMetadata> => {
    if (isUsingTauriIpc()) {
      const raw = await invokeCommand<any>('duplicate_workflow', { filename });
      return WorkflowMetadataSchema.parse(raw);
    }
    throw new Error('Duplicate workflow requires Tauri IPC');
  },

  deleteWorkflow: async (filename: string): Promise<boolean> => {
    if (isUsingTauriIpc()) {
      return await invokeCommand<boolean>('delete_workflow', { filename });
    }
    throw new Error('Delete workflow requires Tauri IPC');
  },

  importWorkflow: async (sourcePath: string): Promise<WorkflowMetadata> => {
    if (isUsingTauriIpc()) {
      const raw = await invokeCommand<any>('import_workflow', { sourcePath });
      return WorkflowMetadataSchema.parse(raw);
    }
    throw new Error('Import workflow requires Tauri IPC');
  },

  exportWorkflow: async (filename: string, destinationPath: string): Promise<boolean> => {
    if (isUsingTauriIpc()) {
      return await invokeCommand<boolean>('export_workflow', { filename, destinationPath });
    }
    throw new Error('Export workflow requires Tauri IPC');
  },

  revealInExplorer: async (filename: string): Promise<boolean> => {
    if (isUsingTauriIpc()) {
      return await invokeCommand<boolean>('reveal_in_explorer', { filename });
    }
    throw new Error('Reveal in explorer requires Tauri IPC');
  },
};
