// [PHASE: marketplace-preview — Order flow]
import * as React from 'react';
import { PurchaseOrderStatus } from '@40labs/types';
import { CheckCircle2, Clock } from 'lucide-react';

export interface OrderTimelineProps {
  status: PurchaseOrderStatus;
  createdAt: string;
  sentAt?: string;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ status, createdAt, sentAt }) => {
  const steps = [
    { id: 'draft', label: 'Draft Created', time: createdAt, done: true },
    { id: 'sent', label: 'Sent to Supplier', time: sentAt || createdAt, done: status === 'sent' || status === 'confirmed' || status === 'completed' },
    { id: 'confirmed', label: 'Supplier Confirmed', time: '-', done: status === 'confirmed' || status === 'completed' },
    { id: 'completed', label: 'Completed (GRN Received)', time: '-', done: status === 'completed' },
  ];

  return (
    <div className="flex items-center justify-between p-3 bg-panel-strong border border-border/30 rounded-card my-2">
      {steps.map((step, idx) => (
        <div key={step.id} className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${step.done ? 'bg-primary text-primary-foreground' : 'bg-panel text-text-muted border border-border'}`}>
              {step.done ? <CheckCircle2 size={16} /> : <Clock size={14} />}
            </div>
            <span className="text-[10px] font-bold text-text mt-1">{step.label}</span>
          </div>
          {idx < steps.length - 1 && (
            <div className={`h-0.5 w-8 sm:w-12 mx-1 ${step.done ? 'bg-primary' : 'bg-border/40'}`} />
          )}
        </div>
      ))}
    </div>
  );
};
