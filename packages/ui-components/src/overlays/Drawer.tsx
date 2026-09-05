import * as React from 'react';
import { createPortal } from 'react-dom';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  side?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-64',
  md: 'w-80',
  lg: 'w-96',
};

export const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  side = 'right',
  size = 'md',
  className = '',
}: DrawerProps) => {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sideClasses = side === 'left' ? 'left-0 border-r' : 'right-0 border-l';

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-surface/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`
          fixed inset-y-0 ${sideClasses} flex flex-col max-w-full bg-surface-strong border-border elevation-raised
          transition-transform duration-300 ease-in-out
          ${sizeClasses[size]} ${className}
        `}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-panel-strong/20">
          {title && (
            <h2 className="text-sm font-bold uppercase tracking-wider text-text">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-full hover:bg-panel transition-colors text-text-muted"
            aria-label="Close drawer"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 text-xs text-text">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 border-t border-border bg-panel-strong/20 flex flex-col gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
