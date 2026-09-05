import * as React from 'react';

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export function Field({ children, className = '', ...props }: FieldProps) {
  return (
    <div className={['w-full space-y-1.5', className].join(' ')} {...props}>
      {children}
    </div>
  );
}

export interface FieldLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function FieldLabel({ required, className = '', children, ...props }: FieldLabelProps) {
  return (
    <label
      className={['block text-xs font-medium text-text-muted', className].join(' ')}
      {...props}
    >
      {children}
      {required && <span className="text-danger ml-1">*</span>}
    </label>
  );
}

export interface FieldHintProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
  className?: string;
}

export function FieldHint({ className = '', children, ...props }: FieldHintProps) {
  return (
    <p
      className={['text-[10px] text-text-muted leading-none', className].join(' ')}
      {...props}
    >
      {children}
    </p>
  );
}

export interface FieldErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
  className?: string;
}

export function FieldError({ className = '', children, ...props }: FieldErrorProps) {
  return (
    <p
      className={['text-danger text-[10px] font-medium leading-none', className].join(' ')}
      {...props}
    >
      {children}
    </p>
  );
}
