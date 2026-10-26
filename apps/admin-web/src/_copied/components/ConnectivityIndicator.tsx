// COPIED FROM: apps/core-desktop/src/components/ConnectivityIndicator.tsx
import * as React from 'react';
import { Wifi } from 'lucide-react';

export const ConnectivityIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 select-none" role="status" aria-label="System Online">
      <Wifi size={14} className="text-action-primary shrink-0" />
      <span className="text-[10px] font-bold uppercase tracking-wider text-text-primary">Online</span>
    </div>
  );
};
