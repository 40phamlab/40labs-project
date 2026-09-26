import * as React from 'react';
import { Delete } from 'lucide-react';

export interface NumpadProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm?: () => void;
  className?: string;
}

export const Numpad: React.FC<NumpadProps> = ({ value, onChange, onConfirm, className = '' }) => {
  const handleKeyClick = (key: string) => {
    if (key === 'C') {
      onChange('');
    } else if (key === 'backspace') {
      onChange(value.slice(0, -1));
    } else if (key === 'Enter') {
      onConfirm?.();
    } else {
      if (key === '.' && value.includes('.')) return;
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
    <div className={`grid grid-cols-3 gap-1.5 p-2 bg-panel-strong rounded-card border border-border/30 ${className}`}>
      {keys.map((key) => {
        const isAction = ['C', 'backspace', 'Enter'].includes(key);
        const isEnter = key === 'Enter';

        return (
          <button
            key={key}
            type="button"
            onClick={() => handleKeyClick(key)}
            className={`
              h-10 flex items-center justify-center rounded-input font-mono text-sm font-bold transition-all
              ${isEnter ? 'bg-primary text-surface font-black' : isAction ? 'bg-panel text-text hover:bg-surface' : 'bg-surface text-text hover:bg-panel'}
              border border-border/20 elevation-flat active:scale-95
            `}
          >
            {key === 'backspace' ? <Delete size={16} /> : key}
          </button>
        );
      })}
    </div>
  );
};
