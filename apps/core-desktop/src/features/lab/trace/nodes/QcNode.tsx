import * as React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Sliders } from 'lucide-react';
import { Badge } from '@40labs/ui-components';

export const QcNode: React.FC<{ data: { label: string; equipment?: any } }> = ({ data }) => {
  return (
    <div className="bg-panel border border-border rounded-xl p-3 shadow-md w-60 text-text">
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-primary" />
      <div className="flex items-center gap-2 mb-1">
        <Sliders size={16} className="text-primary" />
        <span className="text-xs font-mono uppercase tracking-wider text-text-muted">QC Equipment</span>
      </div>
      <p className="font-bold text-sm">{data.label}</p>
      <div className="mt-2">
        <Badge variant={data.equipment?.status === 'operational' ? 'success' : 'danger'}>{data.equipment?.status || 'operational'}</Badge>
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-primary" />
    </div>
  );
};
