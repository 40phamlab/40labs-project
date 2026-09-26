import * as React from 'react';
import { Search, X } from 'lucide-react';

export type SearchInputSize = 'sm' | 'md' | 'lg';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: SearchInputSize;
  onClear?: () => void;
  error?: boolean | string;
  success?: boolean;
}

const sizeClasses: Record<SearchInputSize, string> = {
  sm: 'h-7 text-xs pl-7 pr-7',
  md: 'h-8 text-xs pl-8 pr-8',
  lg: 'h-10 text-sm pl-9 pr-9',
};

const iconSizes: Record<SearchInputSize, number> = {
  sm: 12,
  md: 14,
  lg: 16,
};

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      size = 'md',
      onClear,
      error,
      success,
      disabled,
      readOnly,
      className = '',
      value,
      defaultValue,
      onChange,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const internalRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => internalRef.current!);

    const [val, setVal] = React.useState<string>(
      value !== undefined ? String(value) : defaultValue !== undefined ? String(defaultValue) : '',
    );

    React.useEffect(() => {
      if (value !== undefined) {
        setVal(String(value));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) {
        setVal(e.target.value);
      }
      onChange?.(e);
    };

    const handleClear = () => {
      if (internalRef.current) {
        internalRef.current.value = '';
      }
      setVal('');
      onClear?.();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape' && val && onClear) {
        e.preventDefault();
        handleClear();
      }
      onKeyDown?.(e);
    };

    const hasError = !!error;
    const stateClasses = hasError
      ? 'border-danger focus:border-danger focus:ring-1 focus:ring-danger'
      : success
      ? 'border-success focus:border-success focus:ring-1 focus:ring-success'
      : 'border-border-default hover:border-border-strong focus:border-border-focus focus:ring-1 focus:ring-focus-ring';

    const sizeClass = sizeClasses[size] || sizeClasses.md;
    const iconSize = iconSizes[size] || 14;
    const isNonEmpty = Boolean(val);

    return (
      <div className={`relative flex items-center w-full ${className}`}>
        <span className="absolute left-2.5 text-text-muted select-none pointer-events-none flex items-center justify-center shrink-0">
          <Search size={iconSize} />
        </span>
        <input
          {...props}
          ref={internalRef}
          type="search"
          value={value !== undefined ? value : val}
          disabled={disabled}
          readOnly={readOnly}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={[
            'w-full bg-surface-primary text-text-primary placeholder:text-text-muted/60',
            'border rounded-input font-ui transition-all duration-150 ease-out',
            'focus:outline-none',
            'disabled:bg-surface-disabled disabled:text-text-disabled disabled:border-border-subtle disabled:cursor-not-allowed disabled:opacity-50',
            'read-only:bg-surface-disabled read-only:text-text-secondary read-only:border-border-subtle',
            sizeClass,
            stateClasses,
          ]
            .filter(Boolean)
            .join(' ')}
        />
        {onClear && isNonEmpty && !disabled && !readOnly && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 shrink-0 p-1 flex items-center justify-center rounded-full hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            aria-label="Clear search"
          >
            <X size={iconSize} />
          </button>
        )}
      </div>
    );
  },
);

SearchInput.displayName = 'SearchInput';
