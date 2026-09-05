import * as React from 'react';
import { Input, type InputProps } from './Input';
import { Card } from '../primitives/Card';

export interface AutocompleteProps<T> extends Omit<InputProps, 'onChange' | 'value'> {
  items: T[];
  onSelect: (item: T) => void;
  getDisplayValue: (item: T) => string;
  filterItems?: (query: string, items: T[]) => T[];
  value?: string;
  onChange?: (value: string) => void;
  renderItem?: (item: T, isHighlighted: boolean) => React.ReactNode;
}

export function Autocomplete<T>({
  items,
  onSelect,
  getDisplayValue,
  filterItems,
  value,
  onChange,
  renderItem,
  ...inputProps
}: AutocompleteProps<T>) {
  const [query, setQuery] = React.useState(value || '');
  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (value !== undefined) setQuery(value);
  }, [value]);

  const filtered = React.useMemo(() => {
    if (filterItems) return filterItems(query, items);
    return items.filter(item =>
      getDisplayValue(item).toLowerCase().includes(query.toLowerCase())
    );
  }, [items, query, getDisplayValue, filterItems]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    setQuery(nextValue);
    setIsOpen(true);
    setHighlightedIndex(0);
    onChange?.(nextValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && isOpen && highlightedIndex >= 0) {
      e.preventDefault();
      const selected = filtered[highlightIndex];
      if (selected) {
        onSelect(selected);
        setQuery(getDisplayValue(selected));
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

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
      <Input
        {...inputProps}
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        autoComplete="off"
      />
      {isOpen && filtered.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-auto elevation-hover border border-border/20 bg-panel-strong shadow-2xl">
          <ul className="py-1">
            {filtered.map((item, index) => {
              const isHighlighted = index === highlightedIndex;
              return (
                <li
                  key={index}
                  onClick={() => {
                    onSelect(item);
                    setQuery(getDisplayValue(item));
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={[
                    'px-3 py-2 text-sm cursor-pointer transition-colors',
                    isHighlighted ? 'bg-primary text-surface' : 'text-text hover:bg-panel'
                  ].join(' ')}
                >
                  {renderItem ? renderItem(item, isHighlighted) : getDisplayValue(item)}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
