import React, { useState, memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  TestTube,
  Tag,
  Sliders,
  Activity,
  FileEdit,
  CheckSquare,
  FileCheck,
  Paperclip,
  GitBranch,
  RotateCcw,
  FileText,
  ClipboardList,
  AlertTriangle
} from 'lucide-react';
import { getNodeTheme } from '../../utils/nodeTheme';
import { useWorkflowStore } from '../../store/workflowStore';
import type { LabWorkflowStepType } from '@40labs/types';

function getStepIcon(type: string, isUnknown: boolean, colorClass: string) {
  if (isUnknown) return <AlertTriangle className={`w-4 h-4 ${colorClass}`} />;
  switch (type as LabWorkflowStepType) {
    case 'sample_reception':
    case 'receive':
      return <TestTube className={`w-4 h-4 ${colorClass}`} />;
    case 'specimen_identification':
    case 'registration':
      return <Tag className={`w-4 h-4 ${colorClass}`} />;
    case 'preparation_processing':
    case 'process':
      return <Sliders className={`w-4 h-4 ${colorClass}`} />;
    case 'test_execution':
      return <Activity className={`w-4 h-4 ${colorClass}`} />;
    case 'observation_entry':
    case 'result_entry':
      return <FileEdit className={`w-4 h-4 ${colorClass}`} />;
    case 'qc_check':
      return <CheckSquare className={`w-4 h-4 ${colorClass}`} />;
    case 'review_approval':
    case 'review':
      return <FileCheck className={`w-4 h-4 ${colorClass}`} />;
    case 'notes_attachments':
      return <Paperclip className={`w-4 h-4 ${colorClass}`} />;
    case 'conditional_decision':
      return <GitBranch className={`w-4 h-4 ${colorClass}`} />;
    case 'repeat_rework':
      return <RotateCcw className={`w-4 h-4 ${colorClass}`} />;
    case 'report_finalization':
    case 'report_draft':
    case 'notify':
    case 'forward_report':
      return <FileText className={`w-4 h-4 ${colorClass}`} />;
    default:
      return <ClipboardList className={`w-4 h-4 ${colorClass}`} />;
  }
}

export const LabNodeComponent: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const stepType = (data?.stepType as string) || 'sample_reception';
  const label = (data?.label as string) || stepType.replace(/_/g, ' ').toUpperCase();
  const theme = getNodeTheme(stepType);
  const updateSelectedNodeData = useWorkflowStore((state) => state.updateSelectedNodeData);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(label);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlurOrSubmit = () => {
    setIsEditing(false);
    if (editText.trim()) {
      // Update directly via store action or custom event
      useWorkflowStore.getState().updateNodeLabel(id, editText.trim());
    }
  };

  const isConditional = stepType === 'conditional_decision';

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`w-[220px] rounded-xl border bg-white dark:bg-slate-900 shadow-md transition-all duration-200 ${
        theme.border
      } ${
        selected ? 'ring-2 ring-indigo-500 shadow-xl scale-[1.02]' : 'hover:border-slate-400 dark:hover:border-slate-600'
      }`}
    >
      {/* Target Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-indigo-500 !-left-1.5 !rounded-full !border-2 !border-white dark:!border-slate-900"
      />

      {/* Header bar */}
      <div className={`px-3 py-2 rounded-t-xl border-b ${theme.border} ${theme.bg} flex items-center justify-between`}>
        <div className="flex items-center space-x-2 min-w-0">
          <div className="p-1 rounded bg-white dark:bg-slate-800 shadow-2xs shrink-0">
            {getStepIcon(stepType, theme.isUnknown, theme.iconColor)}
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wide truncate ${theme.badgeText}`}>
            {theme.isUnknown ? 'UNKNOWN STEP' : theme.category}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        {isEditing ? (
          <input
            autoFocus
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleBlurOrSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleBlurOrSubmit();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            className="w-full px-1.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded border border-indigo-500 focus:outline-none"
          />
        ) : (
          <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 tracking-tight truncate" title={label}>
            {label}
          </h4>
        )}
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate font-mono">
          {stepType}
        </p>

        {data?.assignedRole && (
          <div className="mt-2 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded truncate">
            Role: {String(data.assignedRole)}
          </div>
        )}
      </div>

      {/* Source Handles (Right) */}
      {isConditional ? (
        <>
          <div className="absolute -right-3 top-1/3 flex items-center">
            <span className="text-[9px] font-bold text-emerald-600 mr-1 bg-emerald-50 px-1 rounded">Yes</span>
            <Handle
              type="source"
              position={Position.Right}
              id="yes"
              className="!w-2.5 !h-2.5 !bg-emerald-500 !rounded-full !border-2 !border-white"
            />
          </div>
          <div className="absolute -right-3 bottom-1/3 flex items-center">
            <span className="text-[9px] font-bold text-rose-600 mr-1 bg-rose-50 px-1 rounded">No</span>
            <Handle
              type="source"
              position={Position.Right}
              id="no"
              className="!w-2.5 !h-2.5 !bg-rose-500 !rounded-full !border-2 !border-white"
            />
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-indigo-500 !-right-1.5 !rounded-full !border-2 !border-white dark:!border-slate-900"
        />
      )}
    </div>
  );
});

LabNodeComponent.displayName = 'LabNodeComponent';
