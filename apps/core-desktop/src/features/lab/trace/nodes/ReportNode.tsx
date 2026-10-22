import * as React from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileText } from 'lucide-react';
import { Badge } from '@40labs/ui-components';

export const ReportNode: React.FC<{ data: { label: string; report?: any } }> = ({ data }) => {
  return (
    <div className="bg-panel border border-border rounded-xl p-3 shadow-md w-60 text-text">
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-primary" />
      <div className="flex items-center gap-2 mb-1">
        <FileText size={16} className="text-primary" />
        <span className="text-xs font-mono uppercase tracking-wider text-text-muted">Report Version</span>
      </div>
      <p className="font-bold text-sm">{data.label}</p>
      {data.report?.summary_note && <p className="text-xs text-text-muted mt-1 truncate">{data.report.summary_note}</p>}
      <div className="mt-2">
        <Badge variant={data.report?.status === 'finalized' ? 'success' : 'neutral'}>{data.report?.status || 'draft'}</Badge>
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-primary" />
    </div>
  );
};
