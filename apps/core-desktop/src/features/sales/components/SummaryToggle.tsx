import * as React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { IconButton } from '@40labs/ui-components';

export interface SummaryToggleProps {
  isCompact: boolean;
  onToggle: () => void;
}

export const SummaryToggle: React.FC<SummaryToggleProps> = ({ isCompact, onToggle }) => {
  return (
    <IconButton
      icon={isCompact ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      label={isCompact ? 'Details' : 'Compact'}
      intent="ghost"
      size="sm"
      onClick={onToggle}
      aria-expanded={!isCompact}
      title={isCompact ? 'Details' : 'Compact'}
      className="text-text-muted hover:text-text"
    />
  );
};
