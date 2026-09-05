import * as React from 'react';
import { Input } from './Input';
import { Card } from '../primitives/Card';
import { IconButton } from '../primitives/IconButton';

export interface ComboboxOption {
  label: string;
  value: string | number;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean | string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  disabled,
  error
}: ComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);
  const displayValue = selectedOption ? selectedOption.label : '';

  const filteredOptions = options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative group">
        <Input
          placeholder={placeholder}
          value={isOpen ? query : displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setQuery('');
            setIsOpen(true);
          }}
          disabled={disabled}
          error={error}
          autoComplete="off"
          suffix={
            <div className="flex items-center">
               <IconButton
                type="button"
                intent="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(!isOpen);
                }}
                icon={<span>{isOpen ? '▲' : '▼'}</span>}
                label="Toggle dropdown"
                className="!w-6 !h-6"
                disabled={disabled}
              />
            </div>
          }
        />
      </div>
      {isOpen && (
        <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-auto elevation-hover border border-border/20 bg-panel-strong shadow-2xl">
          {filteredOptions.length > 0 ? (
            <ul className="py-1">
              {filteredOptions.map((option) => (
                <li
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={[
                    'px-3 py-2 text-sm cursor-pointer transition-colors',
                    option.value === value ? 'bg-primary text-surface font-medium' : 'text-text hover:bg-panel'
                  ].join(' ')}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-4 text-xs text-text-muted text-center italic">No results found</div>
          )}
        </Card>
      )}
    </div>
  );
}
