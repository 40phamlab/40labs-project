import * as React from 'react';

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  error?: boolean;
  success?: boolean;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, error, success, className = '', ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => internalRef.current!);

    const stateClasses = error
      ? 'border-danger focus:ring-danger/20'
      : success
      ? 'border-primary focus:ring-primary/20'
      : 'border-border focus:ring-primary/45';

    return (
      <div className={`relative flex items-center w-full ${className}`}>
        <span className="absolute left-3 text-text-muted select-none">🔍</span>
        <input
          {...props}
          ref={internalRef}
          type="search"
          className={`
            w-full bg-field/10 border rounded-input px-10 py-2 text-sm text-text font-ui
            placeholder:text-text-muted/50 transition-all focus:outline-none focus:ring-2
            disabled:opacity-50 disabled:cursor-not-allowed elevation-inset
            ${stateClasses}
          `}
        />
        {onClear && (props.value || internalRef.current?.value) && (
          <button
            type="button"
            onClick={() => {
              if (internalRef.current) internalRef.current.value = '';
              onClear();
            }}
            className="absolute right-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-panel transition-colors text-text-muted"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = 'SearchInput';
