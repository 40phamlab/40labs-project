import * as React from 'react';
import { Handle, Position } from '@xyflow/react';
import { ClipboardList } from 'lucide-react';
import { Badge } from '@40labs/ui-components';

export const OrderNode: React.FC<{ data: { label: string; order?: any } }> = ({ data }) => {
  return (
    <div className="bg-panel border border-border rounded-xl p-3 shadow-md w-60 text-text">
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-primary" />
      <div className="flex items-center gap-2 mb-1">
        <ClipboardList size={16} className="text-primary" />
        <span className="text-xs font-mono uppercase tracking-wider text-text-muted">Requisition</span>
      </div>
      <p className="font-bold text-sm">{data.label}</p>
      {data.order?.status && (
        <div className="mt-2">
          <Badge variant="neutral">{data.order.status}</Badge>
        </div>
      )}
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-primary" />
    </div>
  );
};
