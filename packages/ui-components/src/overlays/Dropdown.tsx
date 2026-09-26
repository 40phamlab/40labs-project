"use client";

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useOverlay } from './core/useOverlay';
import { useOverlayPosition, OverlayPlacement } from './core/useOverlayPosition';

export interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  placement?: OverlayPlacement;
  className?: string;
  closeOnEsc?: boolean;
  closeOnOutsideClick?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  children,
  isOpen = false,
  onClose,
  placement = 'bottom-start',
  className = '',
  closeOnEsc = true,
  closeOnOutsideClick = true,
}) => {
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const { zIndex } = useOverlay({
    isOpen,
    type: 'dropdown',
    lockScroll: false,
    closeOnEsc,
    closeOnOutsideClick,
    onClose,
    triggerRef,
    containerRef: menuRef,
  });

  const coords = useOverlayPosition({
    isOpen,
    triggerRef,
    overlayRef: menuRef,
    placement,
    offset: 4,
  });

  return (
    <div ref={triggerRef} className={`relative inline-block ${className}`}>
      {trigger}
      {isOpen && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex,
            }}
            className="animate-in fade-in"
          >
            {children}
          </div>,
          document.body
        )}
    </div>
  );
};
