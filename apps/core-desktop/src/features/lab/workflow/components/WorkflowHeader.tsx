import React from 'react';
import { Button, Badge } from '@40labs/ui-components';
import { Workflow, AlertCircle, CheckCircle, Undo2, Redo2 } from 'lucide-react';
import { useWorkflowStore } from '../store/workflowStore';

interface WorkflowHeaderProps {
  workflowName?: string;
  isPublished?: boolean;
}

export const WorkflowHeader: React.FC<WorkflowHeaderProps> = ({
  workflowName = 'Laboratory Diagnostic Workflow',
  isPublished = false,
}) => {
  const { validationErrors, undo, redo, historyIndex, history } = useWorkflowStore();

  return (
    <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
      <div className="flex items-center space-x-4 min-w-0 flex-1 mr-4">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
          <Workflow className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 truncate tracking-tight">
              {workflowName}
            </h1>
            <Badge variant={isPublished ? 'success' : 'warning'} className="shrink-0 text-xs">
              {isPublished ? 'Published' : 'Draft'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 truncate">
            XYFlow visual canvas &bull; Local JSON Filesystem Storage
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3 shrink-0">
        {/* Undo / Redo */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded text-slate-600 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-slate-300" />
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded text-slate-600 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Validation Status Badge */}
        {validationErrors.length > 0 ? (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span className="hidden sm:inline">{validationErrors.length} error(s)</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs font-medium">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="hidden sm:inline">Graph Valid</span>
          </div>
        )}
      </div>
    </header>
  );
};
