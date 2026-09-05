import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export type ToastIntent = 'info' | 'success' | 'warning' | 'danger';

export interface ToastProps {
  id: string;
  message: string;
  intent?: ToastIntent;
  duration?: number;
  onClose: (id: string) => void;
}

const intentClasses = {
  info: 'bg-field/10 border-field/30 text-text',
  success: 'bg-primary/10 border-primary/30 text-text',
  warning: 'bg-accent/10 border-accent/30 text-text',
  danger: 'bg-danger/10 border-danger/30 text-text',
};

export const Toast = ({ id, message, intent = 'info', duration = 3000, onClose }: ToastProps) => {
  React.useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div
      role="alert"
      className={`relative p-4 rounded-card border flex gap-3 shadow-elevation-raised pointer-events-auto min-w-[300px] ${intentClasses[intent]}`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-xs opacity-90">{message}</div>
      </div>
      <button
        onClick={() => onClose(id)}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface/20 transition-colors text-text-muted"
        aria-label="Close toast"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const ToastContainer = ({ toasts, onClose }: { toasts: any[]; onClose: (id: string) => void }) => {
  return createPortal(
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>,
    document.body,
  );
};
