import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuItem } from '@40labs/ui-components';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterChipTriggerProps {
  label: string;
  selectedValue: string;
  defaultValue?: string;
  options: FilterOption[];
  onSelect: (value: string) => void;
  disabled?: boolean;
}

export const FilterChipTrigger: React.FC<FilterChipTriggerProps> = ({
  label,
  selectedValue,
  defaultValue = 'all',
  options,
  onSelect,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const isNonDefault = selectedValue !== defaultValue;
  const currentOption = options.find((opt) => opt.value === selectedValue);
  const displayLabel = isNonDefault && currentOption
    ? `${label}: ${currentOption.label}`
    : label;

  return (
    <DropdownMenu
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      trigger={
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`
            inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider
            text-text-muted hover:text-text transition-colors focus:outline-none select-none
            ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span>{displayLabel}</span>
          <ChevronDown size={12} className="opacity-60" />
        </button>
      }
    >
      {options.map((opt) => (
        <DropdownMenuItem
          key={opt.value}
          label={opt.label}
          onClick={() => {
            onSelect(opt.value);
            setIsOpen(false);
          }}
        />
      ))}
    </DropdownMenu>
  );
};
