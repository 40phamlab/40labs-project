"use client";

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useOverlay } from '../overlays/core/useOverlay';

export type ToastIntent = 'info' | 'success' | 'warning' | 'danger';

export interface ToastItem {
  id: string;
  message: string;
  intent?: ToastIntent;
  duration?: number;
}

export interface ToastProps extends ToastItem {
  onClose: (id: string) => void;
}

const intentClasses = {
  info: 'bg-surface-strong border-border text-text',
  success: 'bg-primary/10 border-primary/30 text-text',
  warning: 'bg-accent/10 border-accent/30 text-text',
  danger: 'bg-danger/10 border-danger/30 text-text',
};

export const Toast: React.FC<ToastProps> = ({ id, message, intent = 'info', duration = 3000, onClose }) => {
  React.useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative p-4 rounded-card border flex items-center gap-3 elevation-raised pointer-events-auto min-w-[300px] max-w-md animate-in slide-in-from-bottom-2 ${intentClasses[intent]}`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium leading-relaxed">{message}</div>
      </div>
      <button
        type="button"
        onClick={() => onClose(id)}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface/20 transition-colors text-text-muted hover:text-text"
        aria-label="Close toast"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export interface ToastContainerProps {
  toasts: ToastItem[];
  onClose: (id: string) => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const positionClasses = {
  'bottom-right': 'bottom-4 right-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start',
  'top-right': 'top-4 right-4 items-end',
  'top-left': 'top-4 left-4 items-start',
};

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
  position = 'bottom-right',
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isOpen = toasts.length > 0;

  const { zIndex } = useOverlay({
    isOpen,
    type: 'toast',
    lockScroll: false,
    closeOnEsc: false,
    closeOnOutsideClick: false,
    containerRef,
  });

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={containerRef}
      style={{ zIndex }}
      className={`fixed flex flex-col gap-2 pointer-events-none ${positionClasses[position]}`}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>,
    document.body
  );
};
