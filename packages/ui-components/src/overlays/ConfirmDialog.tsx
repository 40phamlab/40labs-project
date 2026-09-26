"use client";

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useOverlay } from './core/useOverlay';
import { handleFocusTrap, getFocusableElements } from './core/overlayManager';

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

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  intent = 'primary',
  loading,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { zIndex } = useOverlay({
    isOpen,
    type: 'dialog',
    lockScroll: true,
    closeOnEsc: true,
    closeOnOutsideClick: true,
    onClose,
    containerRef,
  });

  React.useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const focusables = getFocusableElements(containerRef.current);
    if (focusables.length > 0) {
      focusables[focusables.length - 1].focus(); // Default to confirm/action button
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      handleFocusTrap(containerRef.current, e);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const intentClasses = {
    primary: 'bg-primary text-surface hover:bg-primary/90',
    danger: 'bg-danger text-surface hover:bg-danger/90',
    warning: 'bg-accent text-surface hover:bg-accent/90',
  };

  return createPortal(
    <div style={{ zIndex }} className="fixed inset-0 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm" aria-hidden="true" />
      <div
        ref={containerRef}
        role="alertdialog"
        aria-modal="true"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-sm bg-surface-strong border border-border rounded-card elevation-raised overflow-hidden outline-none"
      >
        <div className="px-6 py-4 border-b border-border bg-panel-strong/20">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text">{title}</h2>
        </div>
        <div className="p-6 text-xs text-text-muted">{message}</div>
        <div className="px-6 py-4 border-t border-border bg-panel-strong/20 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium text-text hover:bg-panel rounded-input transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
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

export interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  actionText?: string;
  intent?: 'primary' | 'danger' | 'warning';
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  actionText = 'Understood',
  intent = 'warning',
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { zIndex } = useOverlay({
    isOpen,
    type: 'dialog',
    lockScroll: true,
    closeOnEsc: true,
    closeOnOutsideClick: true,
    onClose,
    containerRef,
  });

  React.useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const focusables = getFocusableElements(containerRef.current);
    if (focusables.length > 0) {
      focusables[0].focus();
    }
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const intentClasses = {
    primary: 'bg-primary text-surface hover:bg-primary/90',
    danger: 'bg-danger text-surface hover:bg-danger/90',
    warning: 'bg-accent text-surface hover:bg-accent/90',
  };

  return createPortal(
    <div style={{ zIndex }} className="fixed inset-0 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm" aria-hidden="true" />
      <div
        ref={containerRef}
        role="alertdialog"
        aria-modal="true"
        tabIndex={-1}
        className="relative w-full max-w-sm bg-surface-strong border border-border rounded-card elevation-raised overflow-hidden outline-none"
      >
        <div className="px-6 py-4 border-b border-border bg-panel-strong/20">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text">{title}</h2>
        </div>
        <div className="p-6 text-xs text-text-muted">{message}</div>
        <div className="px-6 py-4 border-t border-border bg-panel-strong/20">
          <button
            type="button"
            onClick={onClose}
            className={`w-full px-4 py-2 text-xs font-medium rounded-input transition-all ${intentClasses[intent]}`}
          >
            {actionText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
