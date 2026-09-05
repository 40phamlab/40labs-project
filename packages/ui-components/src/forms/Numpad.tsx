import * as React from 'react';
import { Delete } from 'lucide-react';

export interface NumpadProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm?: () => void;
  className?: string;
}

export const Numpad = ({ value, onChange, onConfirm, className = '' }: NumpadProps) => {
  const handleKeyClick = (key: string) => {
    if (key === 'C') {
      onChange('');
    } else if (key === 'backspace') {
      onChange(value.slice(0, -1));
    } else if (key === 'Enter') {
      onConfirm?.();
    } else {
      // Prevent multiple decimals
      if (key === '.' && value.includes('.')) return;
      // Prevent multiple leading zeros
      if (key === '00' && value === '') return;
      onChange(value + key);
    }
  };

  const keys = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    'C', '0', 'backspace',
    '00', '.', 'Enter'
  ];

  return (
    <div className={`grid grid-cols-3 gap-2 p-3 bg-panel-strong rounded-card shadow-inner-soft ${className}`}>
      {keys.map((key) => {
        const isAction = ['C', 'backspace', 'Enter'].includes(key);
        const isEnter = key === 'Enter';

        return (
          <button
            key={key}
            onClick={() => handleKeyClick(key)}
            className={`
              h-14 flex items-center justify-center rounded-input font-mono text-lg font-bold transition-all
              ${isEnter ? 'bg-primary text-surface' : isAction ? 'bg-panel text-text' : 'bg-surface text-text'}
              shadow-surface-pop active:shadow-inner-soft active:translate-y-0.5
              hover:opacity-90
            `}
          >
            {key === 'backspace' ? <Delete size={20} /> : key}
          </button>
        );
      })}
    </div>
  );
};
