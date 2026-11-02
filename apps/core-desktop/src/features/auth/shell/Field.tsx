import * as React from 'react';

export interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, error, required, children }) => {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-foreground tracking-tight">
        {label} {required && <span className="text-orange-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};
