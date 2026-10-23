import * as React from 'react';
import { ReactFlow, Controls, MiniMap, Background, useNodesState, useEdgesState, Connection, addEdge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button, Input, Select, Checkbox, Badge, ToastContainer } from '@40labs/ui-components';
import { validateGraph, ValidationError } from './validateGraph';
import { DEFAULT_WORKFLOW_GRAPH } from './engine/advance';
import type { LabWorkflowStepType, LabWorkflowAutoAction, LabWorkflowGraphJson } from '@40labs/types';
import { requirePin } from '../../customers/components/CustomerList';
import { Save, Play, CheckCircle, AlertTriangle, Plus, Trash2, Download, Upload, Copy } from 'lucide-react';
import { labWorkflowApi } from '../../../api/labWorkflowApi';

const STEP_TYPES: LabWorkflowStepType[] = [
  'sample_reception',
  'specimen_identification',
  'preparation_processing',
  'test_execution',
  'observation_entry',
  'qc_check',
  'review_approval',
  'notes_attachments',
  'conditional_decision',
  'repeat_rework',
  'report_finalization',
  'registration',
  'collection',
  'receive',
  'process',
  'result_entry',
  'review',
  'report_draft',
  'notify',
  'forward_report',
];

const AUTO_ACTIONS: { id: LabWorkflowAutoAction; label: string }[] = [
  { id: 'set_expiry_from_catalog', label: 'Set Expiry from Catalog' },
  { id: 'create_notification', label: 'Create Notification' },
  { id: 'create_report_draft', label: 'Create Report Draft' },
  { id: 'assign_to_role', label: 'Assign to Role' },
  { id: 'advance_on_complete', label: 'Advance on Complete' },
];

interface WorkflowBuilderProps {
  testId?: string;
  initialGraphJson?: string;
  onPublish: (graphJson: string) => Promise<void>;
  onSaveDraft: (graphJson: string) => Promise<void>;
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  initialGraphJson,
  onPublish,
  onSaveDraft,
}) => {
  const initialGraph = React.useMemo<LabWorkflowGraphJson>(() => {
    if (initialGraphJson) {
      try {
        return JSON.parse(initialGraphJson);
      } catch {
        return DEFAULT_WORKFLOW_GRAPH;
      }
    }
    return DEFAULT_WORKFLOW_GRAPH;
  }, [initialGraphJson]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialGraph.nodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialGraph.edges);
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
  const [validationErrors, setValidationErrors] = React.useState<ValidationError[]>([]);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  const onConnect = React.useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleAddStep = (stepType: LabWorkflowStepType) => {
    const newId = `node_${Date.now()}`;
    const newNode: Node = {
      id: newId,
      type: 'default',
      position: { x: 100 + nodes.length * 50, y: 150 },
      data: {
        label: stepType.replace(/_/g, ' ').toUpperCase(),
        stepType,
        autoActions: ['advance_on_complete'],
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newId);
  };

  const handleDeleteSelected = () => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  };

  const handleUpdateSelectedNode = (key: string, value: any) => {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              [key]: value,
            },
          };
        }
        return n;
      })
    );
  };

  const handleToggleAutoAction = (actionId: LabWorkflowAutoAction) => {
    if (!selectedNode) return;
    const currentActions = (selectedNode.data.autoActions as LabWorkflowAutoAction[]) || [];
    const updated = currentActions.includes(actionId)
      ? currentActions.filter((a) => a !== actionId)
      : [...currentActions, actionId];
    handleUpdateSelectedNode('autoActions', updated);
  };

  const getGraphJson = (): LabWorkflowGraphJson => ({
    nodes: nodes as any,
    edges: edges as any,
  });

  const handleValidate = () => {
    const res = validateGraph(getGraphJson());
    setValidationErrors(res.errors);
    if (res.valid) {
      setToastMessage('Workflow graph validation passed successfully!');
    } else {
      setToastMessage(`Validation failed with ${res.errors.length} error(s).`);
    }
    return res.valid;
  };

  const handlePublishClick = async () => {
    if (!handleValidate()) return;
    const authorized = await requirePin('workflow.publish');
    if (!authorized) return;

    setIsPublishing(true);
    try {
      await onPublish(JSON.stringify(getGraphJson()));
      setToastMessage('Workflow published successfully (immutable version incremented).');
    } catch (err: any) {
      setToastMessage(err?.message || 'Failed to publish workflow.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveDraftClick = async () => {
    try {
      await onSaveDraft(JSON.stringify(getGraphJson()));
      setToastMessage('Workflow draft saved to local filesystem.');
    } catch (err: any) {
      setToastMessage(err?.message || 'Failed to save draft.');
    }
  };

  const handleExportWorkflow = async () => {
    try {
      const dialog = await import('@tauri-apps/plugin-dialog');
      const selected = await dialog.save({
        filters: [{ name: 'Workflow JSON', extensions: ['json'] }],
        defaultPath: 'workflow_export.json',
      });
      if (selected && typeof selected === 'string') {
        const saved = await onSaveDraft(JSON.stringify(getGraphJson()));
        await labWorkflowApi.exportWorkflow((saved as any).id, selected);
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
        const { isUsingTauriIpc, invokeCommand } = await import('../../../api/client');
        let content = '';
        if (isUsingTauriIpc()) {
          content = await invokeCommand<string>('explorer_read_file_text', { path: selected });
        }
        const imported = await labWorkflowApi.importWorkflow(content);
        const parsed = JSON.parse(imported.graph_json);
        setNodes(parsed.nodes);
        setEdges(parsed.edges);
        setToastMessage('Workflow imported successfully.');
      }
    } catch (err: any) {
      setToastMessage(err?.message || 'Failed to import workflow.');
    }
  };

  const handleDuplicateWorkflow = () => {
    const duplicatedNodes = nodes.map((n) => ({
      ...n,
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      position: { x: n.position.x + 30, y: n.position.y + 30 },
    }));
    setNodes(duplicatedNodes);
    setToastMessage('Workflow graph duplicated on canvas.');
  };

  return (
    <div className="flex h-full w-full bg-panel overflow-hidden">
      {/* Left Sidebar: Palette & Properties */}
      <div className="w-80 border-r border-border bg-panel p-4 flex flex-col gap-4 overflow-y-auto shrink-0 z-10">
        <h3 className="font-bold text-sm text-text">Step Palette (11 Node Types)</h3>
        <div className="grid grid-cols-1 gap-2">
          {STEP_TYPES.map((type) => (
            <Button
              key={type}
              intent="neutral"
              size="sm"
              leftIcon={<Plus size={12} />}
              onClick={() => handleAddStep(type)}
              className="justify-start text-xs truncate"
            >
              {type.replace(/_/g, ' ')}
            </Button>
          ))}
        </div>

        <div className="border-t border-border pt-4 mt-2 flex flex-col gap-3">
          <h3 className="font-bold text-sm text-text">Node Properties</h3>
          {selectedNode ? (
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <span className="text-text-muted font-mono mb-1 block">NODE ID: {selectedNode.id}</span>
                <Input
                  label="Step Label"
                  value={(selectedNode.data.label as string) || ''}
                  onChange={(e) => handleUpdateSelectedNode('label', e.target.value)}
                />
              </div>

              <div>
                <span className="text-text-muted font-mono mb-1 block">STEP TYPE</span>
                <span className="font-bold text-text uppercase">{selectedNode.data.stepType as string}</span>
              </div>

              <Input
                label="Assigned Role"
                value={(selectedNode.data.assignedRole as string) || ''}
                onChange={(e) => handleUpdateSelectedNode('assignedRole', e.target.value)}
                placeholder="e.g. lab_technician, pathologist"
              />

              <div className="flex flex-col gap-1.5">
                <span className="font-semibold text-text">Auto-Actions (Whitelist)</span>
                {AUTO_ACTIONS.map((action) => {
                  const currentActions = (selectedNode.data.autoActions as LabWorkflowAutoAction[]) || [];
                  const isChecked = currentActions.includes(action.id);
                  return (
                    <label key={action.id} className="flex items-center gap-2 cursor-pointer text-text">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleAutoAction(action.id)}
                      />
                      <span>{action.label}</span>
                    </label>
                  );
                })}
              </div>

              <Button
                intent="danger"
                size="sm"
                leftIcon={<Trash2 size={14} />}
                onClick={handleDeleteSelected}
                className="mt-2"
              >
                Delete Node
              </Button>
            </div>
          ) : (
            <p className="text-xs text-text-muted italic">Select a node on the canvas to configure its properties.</p>
          )}
        </div>
      </div>

      {/* Main Canvas & Toolbar */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        <div className="flex items-center justify-between p-4 border-b border-border bg-panel-strong/30 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-heading font-bold text-base text-text">Workflow Designer (XYFlow)</h2>
            <Button intent="neutral" size="sm" onClick={handleValidate} leftIcon={<CheckCircle size={14} />}>
              Validate Graph
            </Button>
            <Button intent="neutral" size="sm" onClick={handleDuplicateWorkflow} leftIcon={<Copy size={14} />}>
              Duplicate
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button intent="neutral" size="sm" onClick={handleImportWorkflow} leftIcon={<Upload size={14} />}>
              Import
            </Button>
            <Button intent="neutral" size="sm" onClick={handleExportWorkflow} leftIcon={<Download size={14} />}>
              Export
            </Button>
            <Button intent="neutral" size="sm" onClick={handleSaveDraftClick} leftIcon={<Save size={14} />}>
              Save Draft
            </Button>
            <Button intent="primary" size="sm" onClick={handlePublishClick} disabled={isPublishing} leftIcon={<Play size={14} />}>
              Publish (PIN Gated)
            </Button>
          </div>
        </div>

        {/* Validation Errors banner if any */}
        {validationErrors.length > 0 && (
          <div className="bg-danger/10 border-b border-danger/30 p-3 flex flex-col gap-1 text-xs text-danger shrink-0">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle size={14} />
              <span>Workflow Validation Errors ({validationErrors.length}):</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 font-mono">
              {validationErrors.map((err, idx) => (
                <li key={idx}>
                  {err.nodeId ? `[Node: ${err.nodeId}] ` : ''}{err.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex-1 h-full min-h-0 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background gap={16} size={1} />
          </ReactFlow>
        </div>
      </div>

      {toastMessage && <ToastContainer toasts={[{ id: 't1', message: toastMessage, intent: 'info' }]} onClose={() => setToastMessage(null)} />}
    </div>
  );
};
