"use client";

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useOverlay } from './core/useOverlay';
import { useOverlayPosition, OverlayPlacement } from './core/useOverlayPosition';

export interface PopoverProps {
  content: React.ReactNode;
  children: React.ReactElement;
  title?: string;
  isOpen?: boolean;
  onClose?: () => void;
  position?: OverlayPlacement;
  trigger?: 'click' | 'hover';
  className?: string;
  closeOnEsc?: boolean;
  closeOnOutsideClick?: boolean;
}

export const Popover: React.FC<PopoverProps> = ({
  content,
  children,
  title,
  isOpen: controlledIsOpen,
  onClose,
  position = 'bottom',
  trigger = 'click',
  className = '',
  closeOnEsc = true,
  closeOnOutsideClick = true,
}) => {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = React.useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;

  const triggerRef = React.useRef<HTMLElement | null>(null);
  const overlayRef = React.useRef<HTMLDivElement>(null);

  const handleClose = React.useCallback(() => {
    if (!isControlled) setUncontrolledIsOpen(false);
    onClose?.();
  }, [isControlled, onClose]);

  const { zIndex } = useOverlay({
    isOpen,
    type: 'popover',
    lockScroll: false,
    closeOnEsc,
    closeOnOutsideClick,
    onClose: handleClose,
    triggerRef,
    containerRef: overlayRef,
  });

  const coords = useOverlayPosition({
    isOpen,
    triggerRef,
    overlayRef,
    placement: position,
    offset: 8,
  });

  const toggle = () => {
    if (isControlled) {
      if (isOpen) onClose?.();
    } else {
      setUncontrolledIsOpen((prev) => !prev);
    }
  };

  const childProps = (children as React.ReactElement<any>).props || {};

  const triggerElement = React.cloneElement(children as React.ReactElement<any>, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const childRef = (children as any).ref;
      if (typeof childRef === 'function') {
        childRef(node);
      } else if (childRef && typeof childRef === 'object') {
        childRef.current = node;
      }
    },
    onClick: (e: React.MouseEvent) => {
      if (trigger === 'click') {
        toggle();
      }
      childProps.onClick?.(e);
    },
    onMouseEnter: (e: React.MouseEvent) => {
      if (trigger === 'hover') {
        if (!isControlled) setUncontrolledIsOpen(true);
      }
      childProps.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      if (trigger === 'hover') {
        if (!isControlled) setUncontrolledIsOpen(false);
      }
      childProps.onMouseLeave?.(e);
    },
  });

  return (
    <>
      {triggerElement}
      {isOpen && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={overlayRef}
            role="dialog"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex,
            }}
            className={`
              min-w-[200px] p-4 bg-surface-strong border border-border rounded-card
              elevation-raised text-xs text-text outline-none animate-in fade-in
              ${className}
            `}
          >
            {title && (
              <div className="font-bold uppercase tracking-wider mb-2 border-b border-border pb-1 text-[11px] text-text">
                {title}
              </div>
            )}
            {content}
          </div>,
          document.body
        )}
    </>
  );
};
