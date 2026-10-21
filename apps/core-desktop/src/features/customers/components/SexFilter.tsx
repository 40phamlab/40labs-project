import * as React from 'react';

interface SexFilterProps {
  sexFilter: string;
  onSexFilterChange: (val: string) => void;
}

export const SexFilter: React.FC<SexFilterProps> = ({ sexFilter, onSexFilterChange }) => {
  return (
    <div className="flex items-center gap-1 bg-surface-primary border border-border rounded-input p-0.5 text-xs">
      {[
        { id: 'all', label: 'All Sex' },
        { id: 'male', label: 'Male' },
        { id: 'female', label: 'Female' },
        { id: 'blank', label: 'Not set' },
      ].map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSexFilterChange(tab.id)}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
            sexFilter === tab.id
              ? 'bg-action-primary text-text-inverse shadow-sm'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
