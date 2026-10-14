import * as React from 'react';
import type { InputSize } from '../forms/Input';

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix' | 'type' | 'value' | 'onChange'> {
  size?: InputSize;
  error?: boolean | string;
  success?: boolean;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  countryCode?: string;
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'h-7 text-xs px-2.5',
  md: 'h-8 text-xs px-3',
  lg: 'h-10 text-sm px-3.5',
};

export function normalizeNationalDigits(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('255')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 9);
}

export function formatNationalDisplay(national: string): string {
  const d = national.replace(/\D/g, '').slice(0, 9);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

export function isValidTZMobile(nat: string): boolean {
  if (!nat) return true;
  return nat.length === 9 && (nat[0] === '6' || nat[0] === '7');
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      size = 'md',
      error,
      success,
      value = '',
      onChange,
      disabled,
      readOnly,
      className = '',
      placeholder = '7XX XXX XXX',
      onBlur,
      ...rest
    },
    ref,
  ) => {
    const [touched, setTouched] = React.useState(false);

    const nationalDigits = normalizeNationalDigits(value);
    const displayVal = formatNationalDisplay(nationalDigits);

    const hasError = !!error || (touched && nationalDigits.length > 0 && !isValidTZMobile(nationalDigits));

    const stateClasses = hasError
      ? 'border-danger focus-within:border-danger ring-1 ring-danger'
      : success
      ? 'border-success focus-within:border-success ring-1 ring-success'
      : 'border-border-default hover:border-border-strong focus-within:border-border-focus focus-within:ring-1 focus-within:ring-focus-ring';

    const sizeClass = sizeClasses[size] || sizeClasses.md;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const nat = normalizeNationalDigits(e.target.value);
      const e164 = nat.length > 0 ? `+255${nat}` : '';

      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: e164,
            name: e.target.name,
          },
          currentTarget: {
            ...e.currentTarget,
            value: e164,
            name: e.currentTarget.name,
          },
        };
        onChange(syntheticEvent as unknown as React.ChangeEvent<HTMLInputElement>);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true);
      onBlur?.(e);
    };

    return (
      <div
        className={[
          'relative flex items-center w-full bg-surface-primary text-text-primary shadow-elevation-inset',
          'border rounded-input font-mono transition-all duration-150 ease-out',
          disabled ? 'bg-surface-disabled text-text-disabled border-border-subtle cursor-not-allowed opacity-50' : '',
          readOnly ? 'bg-surface-disabled text-text-secondary border-border-subtle' : '',
          sizeClass,
          stateClasses,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="flex items-center gap-1.5 pr-2 mr-2 border-r border-border-default/50 select-none shrink-0 text-text-primary">
          <span className="text-sm">🇹🇿</span>
          <span className="font-bold text-xs">+255</span>
        </div>

        <input
          ref={ref}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          maxLength={13}
          disabled={disabled}
          readOnly={readOnly}
          value={displayVal}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-text-primary placeholder:text-text-muted/60 font-mono text-xs sm:text-sm"
          {...rest}
        />
      </div>
    );
  },
);

PhoneInput.displayName = 'PhoneInput';
