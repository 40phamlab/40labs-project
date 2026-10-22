// [PHASE: marketplace-preview — Supplier profile]
import * as React from 'react';
import { Clock, Calendar } from 'lucide-react';
import { Day } from '@40labs/types';

export interface SupplierAvailabilityProps {
  availability: {
    openTime: string;
    closeTime: string;
    days: Day[];
  };
}

export const SupplierAvailability: React.FC<SupplierAvailabilityProps> = ({ availability }) => {
  const allDays: Day[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  return (
    <div className="p-4 bg-panel-strong border border-border/30 rounded-card space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
          <Clock size={14} className="text-primary" /> Operating Hours
        </h4>
        <span className="font-mono text-xs text-text font-bold">
          {availability.openTime} — {availability.closeTime}
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <Calendar size={14} className="text-text-muted mr-1" />
        {allDays.map((d) => {
          const active = availability.days.includes(d);
          return (
            <span
              key={d}
              className={`
                px-2 py-0.5 rounded text-[10px] font-mono font-bold
                ${active ? 'bg-primary/20 text-primary' : 'bg-panel text-text-muted opacity-40'}
              `}
            >
              {d}
            </span>
          );
        })}
      </div>
      <p className="text-[10px] text-text-muted italic pt-1 border-t border-border/10">
        TODO: wire to cloud profile [V2]
      </p>
    </div>
  );
};
