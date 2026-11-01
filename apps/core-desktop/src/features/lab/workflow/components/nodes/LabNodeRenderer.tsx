import React from 'react';
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
  ClipboardList
} from 'lucide-react';
import { getNodeCategoryAndColor } from '../../utils/migrateGraph';
import type { LabWorkflowStepType } from '@40labs/types';

export const LabNodeRenderer: React.FC<NodeProps> = ({ data, selected }) => {
  const stepType = (data?.stepType as LabWorkflowStepType) || 'sample_reception';
  const label = (data?.label as string) || stepType.replace(/_/g, ' ').toUpperCase();
  const styling = getNodeCategoryAndColor(stepType);

  const getStepIcon = (type: LabWorkflowStepType) => {
    switch (type) {
      case 'sample_reception':
      case 'receive':
        return <TestTube className="w-4 h-4 text-blue-600" />;
      case 'specimen_identification':
      case 'registration':
        return <Tag className="w-4 h-4 text-blue-600" />;
      case 'preparation_processing':
      case 'process':
        return <Sliders className="w-4 h-4 text-purple-600" />;
      case 'test_execution':
        return <Activity className="w-4 h-4 text-purple-600" />;
      case 'observation_entry':
      case 'result_entry':
        return <FileEdit className="w-4 h-4 text-purple-600" />;
      case 'qc_check':
        return <CheckSquare className="w-4 h-4 text-amber-600" />;
      case 'review_approval':
      case 'review':
        return <FileCheck className="w-4 h-4 text-amber-600" />;
      case 'notes_attachments':
        return <Paperclip className="w-4 h-4 text-emerald-600" />;
      case 'conditional_decision':
        return <GitBranch className="w-4 h-4 text-amber-600" />;
      case 'repeat_rework':
        return <RotateCcw className="w-4 h-4 text-amber-600" />;
      case 'report_finalization':
      case 'report_draft':
      case 'notify':
      case 'forward_report':
        return <FileText className="w-4 h-4 text-emerald-600" />;
      default:
        return <ClipboardList className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div
      className={`relative min-w-[240px] rounded-xl border bg-white shadow-md transition-all duration-200 ${
        selected ? 'ring-2 ring-indigo-500 shadow-xl border-indigo-400' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Target Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-indigo-500 !-left-1.5 !rounded-full !border-2 !border-white"
      />

      {/* Header bar */}
      <div className={`px-3 py-2 rounded-t-xl border-b ${styling.bg} ${styling.border} flex items-center justify-between`}>
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-white shadow-sm">
            {getStepIcon(stepType)}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">
            {styling.category}
          </span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/80 font-mono text-slate-600 border border-slate-200">
          {stepType}
        </span>
      </div>

      {/* Body */}
      <div className="p-3">
        <h4 className="font-semibold text-sm text-slate-900 tracking-tight mb-1 line-clamp-1">
          {label}
        </h4>
        {data?.autoActions && Array.isArray(data.autoActions) && data.autoActions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {data.autoActions.slice(0, 2).map((action: string) => (
              <span key={action} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                {action.replace(/_/g, ' ')}
              </span>
            ))}
            {data.autoActions.length > 2 && (
              <span className="text-[10px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded">
                +{data.autoActions.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Source Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-indigo-500 !-right-1.5 !rounded-full !border-2 !border-white"
      />
    </div>
  );
};
