import * as React from 'react';
import { ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
  readonly title: string;
  readonly defaultOpen?: boolean;
  readonly children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultOpen = true,
  children,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-text-muted hover:text-text cursor-pointer py-1"
      >
        <span>{title}</span>
        <ChevronRight
          size={14}
          className={`transform transition-transform duration-150 ${isOpen ? 'rotate-90' : 'rotate-0'}`}
        />
      </button>
      {isOpen && <div className="space-y-3">{children}</div>}
    </div>
  );
};
