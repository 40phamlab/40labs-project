"use client";

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useOverlay } from './core/useOverlay';
import { handleFocusTrap, getFocusableElements } from './core/overlayManager';
import { X } from 'lucide-react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnEsc?: boolean;
  closeOnOutsideClick?: boolean;
  lockScroll?: boolean;
  className?: string;
  id?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)]',
};

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnEsc = true,
  closeOnOutsideClick = true,
  lockScroll = true,
  className = '',
  id,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();

  const { zIndex } = useOverlay({
    isOpen,
    type: 'dialog',
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

  return createPortal(
    <div
      style={{ zIndex }}
      className="fixed inset-0 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface/80 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Dialog Card */}
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={`
          relative w-full bg-surface-strong border border-border rounded-card elevation-raised
          flex flex-col max-h-[calc(100vh-3rem)] overflow-hidden outline-none
          ${sizeClasses[size]} ${className}
        `}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-panel-strong/20 shrink-0">
          <div>
            {title && (
              <h2 id={titleId} className="text-sm font-bold uppercase tracking-wider text-text">
                {title}
              </h2>
            )}
            {description && (
              <p id={descriptionId} className="text-xs text-text-muted mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto w-8 h-8 flex items-center justify-center rounded-full hover:bg-panel transition-colors text-text-muted hover:text-text"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 text-xs text-text custom-scrollbar">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 border-t border-border bg-panel-strong/20 flex justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
