import * as React from 'react';
import { Handle, Position } from '@xyflow/react';
import { User } from 'lucide-react';

export const PatientNode: React.FC<{ data: { label: string; customer?: any } }> = ({ data }) => {
  return (
    <div className="bg-panel border border-border rounded-xl p-3 shadow-md w-60 text-text">
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-primary" />
      <div className="flex items-center gap-2 mb-1">
        <User size={16} className="text-primary" />
        <span className="text-xs font-mono uppercase tracking-wider text-text-muted">Patient</span>
      </div>
      <p className="font-bold text-sm">{data.label}</p>
      {data.customer?.phone && <p className="text-xs font-mono text-text-muted mt-1">{data.customer.phone}</p>}
      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-primary" />
    </div>
  );
};
