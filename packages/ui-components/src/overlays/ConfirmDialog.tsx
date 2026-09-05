import * as React from 'react';
import { createPortal } from 'react-dom';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  intent?: 'primary' | 'danger' | 'warning';
  loading?: boolean;
}

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  intent = 'primary',
  loading,
}: ConfirmDialogProps) => {
  React.useEffect(() => {
    if (isOpen) {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const intentClasses = {
    primary: 'bg-primary text-surface',
    danger: 'bg-danger text-surface',
    warning: 'bg-accent text-surface',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface-strong border border-border rounded-card elevation-raised overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-panel-strong/20">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text">{title}</h2>
        </div>
        <div className="p-6 text-xs text-text-muted">{message}</div>
        <div className="px-6 py-4 border-t border-border bg-panel-strong/20 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-text hover:bg-panel rounded-input transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-xs font-medium rounded-input transition-all disabled:opacity-50 ${intentClasses[intent]}`}
          >
            {loading ? '...' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export const AlertDialog = ({
  isOpen,
  onClose,
  title,
  message,
  actionText = 'Understood',
  intent = 'warning',
}: Omit<ConfirmDialogProps, 'onConfirm' | 'confirmText' | 'cancelText'> & { actionText?: string }) => {
  if (!isOpen) return null;

  const intentClasses = {
    primary: 'bg-primary text-surface',
    danger: 'bg-danger text-surface',
    warning: 'bg-accent text-surface',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-surface-strong border border-border rounded-card elevation-raised overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-panel-strong/20">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text">{title}</h2>
        </div>
        <div className="p-6 text-xs text-text-muted">{message}</div>
        <div className="px-6 py-4 border-t border-border bg-panel-strong/20">
          <button
            onClick={onClose}
            className={`w-full px-4 py-2 text-xs font-medium rounded-input transition-all ${intentClasses[intent as 'warning']}`}
          >
            {actionText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
