"use client";

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useOverlay } from './core/useOverlay';
import { handleFocusTrap, getFocusableElements } from './core/overlayManager';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  side?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnEsc?: boolean;
  closeOnOutsideClick?: boolean;
  lockScroll?: boolean;
  className?: string;
  id?: string;
}

const sizeClasses = {
  sm: 'w-64',
  md: 'w-80',
  lg: 'w-96',
  xl: 'w-[480px]',
};

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  side = 'right',
  size = 'md',
  closeOnEsc = true,
  closeOnOutsideClick = true,
  lockScroll = true,
  className = '',
  id,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const { zIndex } = useOverlay({
    isOpen,
    type: 'drawer',
    id,
    lockScroll,
    closeOnEsc,
    closeOnOutsideClick,
    onClose,
    containerRef,
  });

  React.useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const focusables = getFocusableElements(containerRef.current);
    const autoFocusEl = containerRef.current.querySelector<HTMLElement>('[autofocus]');

    if (autoFocusEl) {
      autoFocusEl.focus();
    } else if (focusables.length > 0) {
      focusables[0].focus();
    } else {
      containerRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      handleFocusTrap(containerRef.current, e);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  const sideClasses = side === 'left' ? 'left-0 border-r' : 'right-0 border-l';

  return createPortal(
    <div style={{ zIndex }} className="fixed inset-0 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface/80 transition-opacity"
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={`
          fixed inset-y-0 ${sideClasses} flex flex-col max-w-full bg-surface-strong border-border elevation-raised
          transition-transform duration-300 ease-in-out outline-none
          ${sizeClasses[size]} ${className}
        `}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-panel-strong/20 shrink-0">
          <div>
            {title && (
              <h2 className="text-sm font-bold uppercase tracking-wider text-text">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-text-muted mt-0.5">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-full hover:bg-panel transition-colors text-text-muted hover:text-text"
            aria-label="Close drawer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 text-xs text-text custom-scrollbar">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 border-t border-border bg-panel-strong/20 flex flex-col gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
