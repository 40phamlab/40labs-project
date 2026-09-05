import * as React from 'react';

export interface TabProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export const Tab = ({ label, active, onClick, disabled }: TabProps) => {
  return (
    <button
      onClick={!disabled ? onClick : undefined}
      className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-text-muted hover:text-text hover:border-border'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {label}
    </button>
  );
};

export interface TabsProps {
  children: React.ReactNode;
  className?: string;
}

export const Tabs = ({ children, className = '' }: TabsProps) => {
  return <div className={`flex border-b border-border ${className}`}>{children}</div>;
};
