"use client";

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useOverlay } from '../overlays/core/useOverlay';
import { useOverlayPosition } from '../overlays/core/useOverlayPosition';

export interface MenuBarItemProps {
  label: React.ReactNode;
  isOpen?: boolean;
  onOpen?: () => void;
  onHover?: () => void;
  children?: React.ReactNode;
  isActive?: boolean;
  className?: string;
  disabled?: boolean;
}

export const MenuBarItem: React.FC<MenuBarItemProps> = ({
  label,
  isOpen = false,
  onOpen,
  onHover,
  children,
  isActive = false,
  className = '',
  disabled = false,
}) => {
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const { zIndex } = useOverlay({
    isOpen: Boolean(isOpen && children),
    type: 'dropdown',
    lockScroll: false,
    closeOnEsc: true,
    closeOnOutsideClick: true,
    onClose: () => onOpen?.(),
    triggerRef,
    containerRef: dropdownRef,
  });

  const coords = useOverlayPosition({
    isOpen: Boolean(isOpen && children),
    triggerRef,
    overlayRef: dropdownRef,
    placement: 'bottom-start',
    offset: 0,
  });

  return (
    <div className="relative flex items-center h-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) onOpen?.();
        }}
        onMouseEnter={() => {
          if (!disabled) onHover?.();
        }}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup={children ? 'menu' : undefined}
        className={`
          h-full px-2.5 text-[11px] font-medium transition-colors outline-none select-none flex items-center
          focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset
          ${isOpen ? 'bg-surface-hover text-text-primary' : 'text-text-muted hover:bg-surface-hover hover:text-text-primary'}
          ${isActive ? 'text-action-primary' : ''}
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
      >
        {label}
      </button>

      {isOpen && children && typeof document !== 'undefined' && (
        createPortal(
          <div
            ref={dropdownRef}
            role="menu"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex,
            }}
            className="min-w-[200px] bg-surface-elevated border border-border rounded-md shadow-md overflow-hidden select-none animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-1 flex flex-col">{children}</div>
          </div>,
          document.body
        )
      )}
    </div>
  );
};

export interface MenuBarProps {
  children: React.ReactNode;
  className?: string;
}

export const MenuBar: React.FC<MenuBarProps> = ({ children, className = '' }) => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const childCount = React.Children.count(children);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (openIndex === null) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        setOpenIndex(null);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setOpenIndex((openIndex + 1) % childCount);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setOpenIndex((openIndex - 1 + childCount) % childCount);
      }
    };

    if (openIndex !== null) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openIndex, childCount]);

  return (
    <div
      ref={containerRef}
      role="menubar"
      className={`flex items-center h-full ${className}`}
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement<MenuBarItemProps>(child)) {
          return React.cloneElement(child, {
            isOpen: openIndex === index,
            onOpen: () => setOpenIndex(openIndex === index ? null : index),
            onHover: () => {
              if (openIndex !== null) setOpenIndex(index);
            },
          });
        }
        return child;
      })}
    </div>
  );
};
