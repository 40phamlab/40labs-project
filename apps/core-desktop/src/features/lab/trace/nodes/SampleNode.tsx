import * as React from 'react';
import { Handle, Position } from '@xyflow/react';
import { TestTube } from 'lucide-react';
import { ExpiryChip } from '../../../laboratory/components/ExpiryChip';
import { Badge } from '@40labs/ui-components';

export const SampleNode: React.FC<{ data: { label: string; sample?: any } }> = ({ data }) => {
  return (
    <div className="bg-panel border border-border rounded-xl p-3 shadow-md w-60 text-text">
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-primary" />
      <div className="flex items-center gap-2 mb-1">
        <TestTube size={16} className="text-primary" />
        <span className="text-xs font-mono uppercase tracking-wider text-text-muted">Sample</span>
      </div>
      <p className="font-bold text-sm font-mono">{data.label}</p>
      <div className="flex items-center justify-between mt-2 gap-2">
        <Badge variant={data.sample?.status === 'collected' ? 'primary' : 'neutral'}>{data.sample?.status || 'collected'}</Badge>
        {data.sample && <ExpiryChip sample={data.sample} />}
      </div>
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-primary" />
    </div>
  );
};
