import React from 'react';
import { Settings2, X, Check } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';
import type { LabWorkflowAutoAction } from '@40labs/types';

const AUTO_ACTIONS: { id: LabWorkflowAutoAction; label: string }[] = [
  { id: 'set_expiry_from_catalog', label: 'Set Expiry from Catalog' },
  { id: 'create_notification', label: 'Create Notification' },
  { id: 'create_report_draft', label: 'Create Report Draft' },
  { id: 'assign_to_role', label: 'Assign to Role' },
  { id: 'advance_on_complete', label: 'Advance on Complete' },
];

export const NodeInspector: React.FC = () => {
  const { nodes, selectedNodeId, setSelectedNodeId, updateSelectedNodeData, toggleAutoAction } = useWorkflowStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <aside className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shrink-0 p-6 text-center justify-center text-slate-400 text-xs shadow-xs">
        <Settings2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p>Select a node on the canvas to configure its properties, role assignment, and automated actions.</p>
      </aside>
    );
  }

  const data = selectedNode.data || {};
  const currentActions = (data.autoActions as LabWorkflowAutoAction[]) || [];

  return (
    <aside className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shrink-0 shadow-xs">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings2 className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-sm text-slate-900 tracking-tight">Step Inspector</h3>
        </div>
        <button
          onClick={() => setSelectedNodeId(null)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Step Title / Label</label>
          <input
            type="text"
            value={(data.label as string) || ''}
            onChange={(e) => updateSelectedNodeData('label', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assigned Role</label>
          <input
            type="text"
            placeholder="e.g. lab_technician, pathologist"
            value={(data.assignedRole as string) || ''}
            onChange={(e) => updateSelectedNodeData('assignedRole', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Automated Actions</label>
          <div className="space-y-2">
            {AUTO_ACTIONS.map((action) => {
              const active = currentActions.includes(action.id);
              return (
                <div
                  key={action.id}
                  onClick={() => toggleAutoAction(action.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                    active ? 'bg-indigo-50/50 border-indigo-300 text-indigo-900' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xs font-medium">{action.label}</span>
                  <div className={`w-4 h-4 rounded flex items-center justify-center border ${active ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                    {active && <Check className="w-3 h-3" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <div className="text-[10px] font-mono text-slate-400">Node ID: {selectedNode.id}</div>
          <div className="text-[10px] font-mono text-slate-400">Step Type: {String(data.stepType)}</div>
        </div>
      </div>
    </aside>
  );
};
