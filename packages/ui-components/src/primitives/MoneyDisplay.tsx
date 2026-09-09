import * as React from 'react';

export interface MoneyDisplayProps {
  amount: number;
  currency?: 'TZS';
  showCurrency?: boolean;
  compact?: boolean;
  colorize?: boolean;
  sign?: 'auto' | 'positive' | 'negative';
  emphasis?: 'normal' | 'strong';
  className?: string;
}

export const MoneyDisplay: React.FC<MoneyDisplayProps> = ({
  amount,
  currency = 'TZS',
  showCurrency = true,
  compact = false,
  colorize = false,
  sign = 'auto',
  emphasis = 'normal',
  className = '',
}) => {
  const isNegative = amount < 0;

  let signChar = '';
  if (sign === 'positive') signChar = '+ ';
  else if (sign === 'negative') signChar = '- ';
  else if (isNegative) signChar = '- ';

  const formattedAmount = new Intl.NumberFormat('en-US', {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0,
  }).format(Math.abs(amount));

  const colorClass = colorize
    ? (isNegative ? 'text-danger' : 'text-text')
    : 'text-text';

  const weightClass = emphasis === 'strong' ? 'font-bold' : 'font-medium';

  return (
    <span
      className={[
        'font-mono inline-flex items-center gap-1',
        colorClass,
        weightClass,
        className
      ].filter(Boolean).join(' ')}
    >
      {signChar && <span>{signChar}</span>}
      {showCurrency && <span className="text-[0.8em] opacity-70">{currency}</span>}
      <span>{formattedAmount}</span>
    </span>
  );
};
