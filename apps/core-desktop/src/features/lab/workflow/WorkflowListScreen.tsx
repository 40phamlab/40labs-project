import React, { useState, useEffect } from 'react';
import {
  Workflow,
  Plus,
  Copy,
  Trash2,
  FolderOpen,
  Upload,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Button, Badge } from '@40labs/ui-components';
import { workflowFileService, WorkflowMetadata } from './services/workflowFileService';
import { STARTER_TEMPLATES } from './utils/workflowTemplates';

interface WorkflowListScreenProps {
  onOpenWorkflow: (filename: string) => void;
  onBack?: () => void;
}

export const WorkflowListScreen: React.FC<WorkflowListScreenProps> = ({ onOpenWorkflow }) => {
  const [workflows, setWorkflows] = useState<WorkflowMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadWorkflows = async () => {
    setIsLoading(true);
    try {
      const list = await workflowFileService.listWorkflows();
      setWorkflows(list);
    } catch (err: any) {
      setToastMessage(err?.message || 'Failed to load workflows list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  const handleDuplicate = async (filename: string) => {
    try {
      await workflowFileService.duplicateWorkflow(filename);
      setToastMessage('Workflow duplicated successfully.');
      loadWorkflows();
    } catch (err: any) {
      setToastMessage(err?.message || 'Failed to duplicate workflow.');
    }
  };

  const handleDelete = async (filename: string) => {
    if (confirm('Are you sure you want to move this workflow to trash?')) {
      try {
        await workflowFileService.deleteWorkflow(filename);
        setToastMessage('Workflow moved to trash.');
        loadWorkflows();
      } catch (err: any) {
        setToastMessage(err?.message || 'Failed to delete workflow.');
      }
    }
  };

  const handleReveal = async (filename: string) => {
    try {
      await workflowFileService.revealInExplorer(filename);
    } catch (err: any) {
      setToastMessage(err?.message || 'Failed to reveal file in folder.');
    }
  };

  const handleImport = async () => {
    try {
      const dialog = await import('@tauri-apps/plugin-dialog');
      const selected = await dialog.open({
        filters: [{ name: 'Workflow JSON', extensions: ['json'] }],
        multiple: false,
      });
      if (selected && typeof selected === 'string') {
        await workflowFileService.importWorkflow(selected);
        setToastMessage('Workflow imported successfully.');
        loadWorkflows();
      }
    } catch (err: any) {
      setToastMessage(err?.message || 'Failed to import workflow file.');
    }
  };

  const handleCreateFromTemplate = async (template: typeof STARTER_TEMPLATES[0]) => {
    try {
      const newWorkflow = {
        ...template,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const meta = await workflowFileService.saveWorkflow(newWorkflow as any);
      setShowTemplateModal(false);
      onOpenWorkflow(meta.filename);
    } catch (err: any) {
      setToastMessage(err?.message || 'Failed to create workflow from template.');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Workflow className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Laboratory Workflow Manager
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              File-based local JSON workflows &bull; Tauri Filesystem Storage
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleImport}
            className="flex items-center space-x-1.5"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Import JSON</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-4 h-4" />
            <span>New Workflow</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            Available Workflows ({workflows.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Loading workflows from local storage...</div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
            <Workflow className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">No workflows found</h3>
            <p className="text-xs text-slate-400 mb-4">Get started by creating a new workflow from our built-in starter templates.</p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowTemplateModal(true)}
              className="bg-indigo-600 text-white"
            >
              Choose a Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant={wf.status === 'published' ? 'success' : 'warning'} className="text-[10px]">
                      {wf.status === 'published' ? 'Published' : 'Draft'}
                    </Badge>
                    <span className="text-[11px] font-mono text-slate-400">
                      {wf.labCategory || 'General'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 group-hover:text-indigo-600 transition-colors">
                    {wf.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mb-4 truncate">
                    {wf.filename}
                  </p>

                  <div className="flex items-center text-[11px] text-slate-400 space-x-3 mb-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(wf.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onOpenWorkflow(wf.filename)}
                    className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-1 px-3"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Open Designer</span>
                  </Button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleDuplicate(wf.filename)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReveal(wf.filename)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Reveal in Folder"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(wf.filename)}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Delete (Move to Trash)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Choose Starter Template</h3>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Select one of our pre-configured laboratory starter workflows to begin building immediately.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {STARTER_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.name}
                  onClick={() => handleCreateFromTemplate(tmpl)}
                  className="border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl p-4 cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold mb-1 block">
                      {tmpl.labCategory}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 mb-2 group-hover:text-indigo-600">
                      {tmpl.name}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {tmpl.nodes.length} step nodes &bull; {tmpl.edges.length} edges
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-right">
                    <span className="text-[11px] font-semibold text-indigo-600 group-hover:underline">Use Template &rarr;</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-right">
              <Button variant="outline" size="sm" onClick={() => setShowTemplateModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-slate-800 animate-in fade-in slide-in-from-bottom-4">
          <span className="text-xs font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white font-bold">&times;</button>
        </div>
      )}
    </div>
  );
};
