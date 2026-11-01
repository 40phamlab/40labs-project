import React, { useEffect, useCallback } from 'react';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { Button } from '@40labs/ui-components';
import { Lock, Unlock } from 'lucide-react';
import { WorkflowToolbar } from './components/WorkflowToolbar';
import { WorkflowSidebar } from './components/WorkflowSidebar';
import { WorkflowCanvas } from './components/WorkflowCanvas';
import { NodeInspector } from './components/NodeInspector';
import { useWorkflowStore } from './store/workflowStore';
import { workflowFileService, WorkflowFile } from './services/workflowFileService';

interface WorkflowDesignerProps {
  initialWorkflowFilename?: string;
  onBackToList: () => void;
}

const DesignerInner: React.FC<WorkflowDesignerProps> = ({
  initialWorkflowFilename,
  onBackToList,
}) => {
  const {
    initGraph,
    loadWorkflowFromFile,
    saveCurrentWorkflow,
    publishWorkflow,
    getGraphJson,
    setToastMessage,
    toastMessage,
    nodes,
    edges,
    workflowName,
    isDirty,
    workflowStatus,
    workflowVersion,
  } = useWorkflowStore();

  const { setCenter, getNode } = useReactFlow();
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial workflow if filename provided
  useEffect(() => {
    if (initialWorkflowFilename) {
      loadWorkflowFromFile(initialWorkflowFilename);
    } else {
      initGraph();
    }
  }, [initialWorkflowFilename, loadWorkflowFromFile, initGraph]);

  // Autosave debounced 2s
  useEffect(() => {
    if (!isDirty || workflowStatus === 'published') return;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      saveCurrentWorkflow();
    }, 2000);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [nodes, edges, workflowName, isDirty, workflowStatus, saveCurrentWorkflow]);

  // Ctrl+S shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveCurrentWorkflow();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveCurrentWorkflow]);

  const handleCenterNode = useCallback((nodeId: string) => {
    const node = getNode(nodeId) || nodes.find((n) => n.id === nodeId);
    if (node && node.position) {
      setCenter(node.position.x + 110, node.position.y + 50, { zoom: 1.2, duration: 400 });
    }
  }, [setCenter, getNode, nodes]);

  const handleBack = () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to go back?')) {
        return;
      }
    }
    onBackToList();
  };

  const handlePublishClick = async () => {
    await publishWorkflow();
  };

  const handleCreateNewDraftVersion = async () => {
    try {
      const graph = getGraphJson();
      const newDraft: WorkflowFile = {
        schemaVersion: 1,
        id: crypto.randomUUID(),
        name: `${workflowName} (Draft v${workflowVersion + 1})`,
        labCategory: 'General Lab',
        status: 'draft',
        version: workflowVersion + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: graph.nodes,
        edges: graph.edges,
      };
      const meta = await workflowFileService.saveWorkflow(newDraft);
      loadWorkflowFromFile(meta.filename);
      setToastMessage('New draft version created successfully.');
    } catch (err: any) {
      setToastMessage(err?.message || 'Failed to create new draft version.');
    }
  };

  const handleExportWorkflow = async () => {
    try {
      const dialog = await import('@tauri-apps/plugin-dialog');
      const selected = await dialog.save({
        filters: [{ name: 'Workflow JSON', extensions: ['json'] }],
        defaultPath: 'workflow_export.json',
      });
      if (selected && typeof selected === 'string' && useWorkflowStore.getState().filename) {
        await workflowFileService.exportWorkflow(useWorkflowStore.getState().filename!, selected);
        setToastMessage('Workflow exported successfully.');
      }
    } catch (err: any) {
      setToastMessage(err?.message || 'Failed to export workflow.');
    }
  };

  const handleImportWorkflow = async () => {
    try {
      const dialog = await import('@tauri-apps/plugin-dialog');
      const selected = await dialog.open({
        filters: [{ name: 'Workflow JSON', extensions: ['json'] }],
        multiple: false,
      });
      if (selected && typeof selected === 'string') {
        const meta = await workflowFileService.importWorkflow(selected);
        loadWorkflowFromFile(meta.filename);
        setToastMessage('Workflow imported successfully.');
      }
    } catch (err: any) {
      setToastMessage(err?.message || 'Failed to import workflow.');
    }
  };

  const isPublished = workflowStatus === 'published';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans">
      <WorkflowToolbar
        onBackToList={handleBack}
        onExportClick={handleExportWorkflow}
        onImportClick={handleImportWorkflow}
        onPublishClick={handlePublishClick}
      />

      {isPublished && (
        <div className="bg-indigo-600 text-white px-6 py-2 flex items-center justify-between text-xs shrink-0 shadow-sm">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4" />
            <span>This workflow is currently <strong>published (v{workflowVersion})</strong> and is read-only.</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCreateNewDraftVersion}
            className="bg-white/10 hover:bg-white/20 text-white text-xs py-1 px-3"
          >
            <Unlock className="w-3.5 h-3.5 mr-1.5" />
            <span>Create New Draft Version</span>
          </Button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        <WorkflowSidebar onCenterNode={handleCenterNode} />
        <WorkflowCanvas />
        <NodeInspector />
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-slate-800 animate-in fade-in slide-in-from-bottom-4">
          <span className="text-xs font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs font-bold"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
};

export const WorkflowDesigner: React.FC<WorkflowDesignerProps> = (props) => {
  return (
    <ReactFlowProvider>
      <DesignerInner {...props} />
    </ReactFlowProvider>
  );
};
