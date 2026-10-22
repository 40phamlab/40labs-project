import * as React from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileCheck } from 'lucide-react';
import { Badge } from '@40labs/ui-components';

export const ResultNode: React.FC<{ data: { label: string; result?: any } }> = ({ data }) => {
  const isOut = data.result?.is_out_of_range;
  return (
    <div className={`bg-panel border rounded-xl p-3 shadow-md w-60 text-text ${isOut ? 'border-danger/50' : 'border-border'}`}>
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-primary" />
      <div className="flex items-center gap-2 mb-1">
        <FileCheck size={16} className={isOut ? 'text-danger' : 'text-primary'} />
        <span className="text-xs font-mono uppercase tracking-wider text-text-muted">Result</span>
      </div>
      <p className="font-bold text-sm font-mono">{data.label}</p>
      {data.result?.reference_range && (
        <p className="text-xs font-mono text-text-muted mt-1">Ref: {data.result.reference_range}</p>
      )}
      <div className="mt-2">
        <Badge variant={isOut ? 'danger' : 'success'}>{isOut ? 'Out of Range' : 'Normal'}</Badge>
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-primary" />
    </div>
  );
};
