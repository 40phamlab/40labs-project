// COPIED FROM: apps/core-desktop/src/components/BranchControl.tsx
import * as React from 'react';
import { Layers } from 'lucide-react';

export interface BranchControlProps {
  currentBranch?: string;
  onBranchChange?: (branchId: string) => void;
}

export const BranchControl: React.FC<BranchControlProps> = ({
  currentBranch = 'Platform Admin (Global)',
}) => {
  return (
    <div className="h-8 px-2.5 flex items-center gap-1.5 rounded-md text-text-muted text-xs select-none">
      <Layers size={13} className="shrink-0 text-action-primary" />
      <span className="truncate">{currentBranch}</span>
    </div>
  );
};
