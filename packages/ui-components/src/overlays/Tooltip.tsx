"use client";

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useOverlay } from './core/useOverlay';
import { useOverlayPosition, OverlayPlacement } from './core/useOverlayPosition';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: OverlayPlacement;
  delay?: number;
  className?: string;
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'right',
  delay = 300,
  className = '',
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const { zIndex } = useOverlay({
    isOpen: isVisible,
    type: 'tooltip',
    lockScroll: false,
    closeOnEsc: true,
    closeOnOutsideClick: false,
    triggerRef,
    containerRef: overlayRef,
  });

  const coords = useOverlayPosition({
    isOpen: isVisible,
    triggerRef,
    overlayRef,
    placement: position,
    offset: 6,
  });

  const showTooltip = () => {
    if (disabled || !content) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

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
    onMouseEnter: (e: React.MouseEvent) => {
      showTooltip();
      childProps.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hideTooltip();
      childProps.onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      showTooltip();
      childProps.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      hideTooltip();
      childProps.onBlur?.(e);
    },
  });

  return (
    <>
      {triggerElement}
      {isVisible && content && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={overlayRef}
            role="tooltip"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex,
            }}
            className={`
              px-3 py-1.5 bg-[#F8FAFB] dark:bg-[#1E293B] border border-border rounded-[8px]
              text-[13px] font-normal text-text-primary shadow-md whitespace-nowrap
              pointer-events-none transition-opacity duration-150 animate-in fade-in
              ${className}
            `}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
};
