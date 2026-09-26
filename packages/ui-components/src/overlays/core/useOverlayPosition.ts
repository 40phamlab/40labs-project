"use client";

import * as React from 'react';

export type OverlayPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

export interface UseOverlayPositionOptions {
  isOpen: boolean;
  triggerRef: React.RefObject<HTMLElement | null>;
  overlayRef: React.RefObject<HTMLElement | null>;
  placement?: OverlayPlacement;
  offset?: number;
  padding?: number;
}

export function useOverlayPosition({
  isOpen,
  triggerRef,
  overlayRef,
  placement = 'bottom-start',
  offset = 4,
  padding = 8,
}: UseOverlayPositionOptions) {
  const [coords, setCoords] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current || typeof window === 'undefined') return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const overlayRect = overlayRef.current
      ? overlayRef.current.getBoundingClientRect()
      : { width: 200, height: 150 };

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let targetPlacement = placement;
    const overlayWidth = overlayRect.width;
    const overlayHeight = overlayRect.height;

    // Viewport flip checks for vertical placements
    if (placement.startsWith('bottom')) {
      const spaceBelow = vh - triggerRect.bottom - offset;
      const spaceAbove = triggerRect.top - offset;
      if (spaceBelow < overlayHeight && spaceAbove >= overlayHeight) {
        targetPlacement = placement.replace('bottom', 'top') as OverlayPlacement;
      }
    } else if (placement.startsWith('top')) {
      const spaceAbove = triggerRect.top - offset;
      const spaceBelow = vh - triggerRect.bottom - offset;
      if (spaceAbove < overlayHeight && spaceBelow >= overlayHeight) {
        targetPlacement = placement.replace('top', 'bottom') as OverlayPlacement;
      }
    } else if (placement.startsWith('right')) {
      const spaceRight = vw - triggerRect.right - offset;
      const spaceLeft = triggerRect.left - offset;
      if (spaceRight < overlayWidth && spaceLeft >= overlayWidth) {
        targetPlacement = placement.replace('right', 'left') as OverlayPlacement;
      }
    } else if (placement.startsWith('left')) {
      const spaceLeft = triggerRect.left - offset;
      const spaceRight = vw - triggerRect.right - offset;
      if (spaceLeft < overlayWidth && spaceRight >= overlayWidth) {
        targetPlacement = placement.replace('left', 'right') as OverlayPlacement;
      }
    }

    let top = 0;
    let left = 0;

    switch (targetPlacement) {
      case 'bottom-start':
        top = triggerRect.bottom + offset;
        left = triggerRect.left;
        break;
      case 'bottom':
        top = triggerRect.bottom + offset;
        left = triggerRect.left + (triggerRect.width - overlayWidth) / 2;
        break;
      case 'bottom-end':
        top = triggerRect.bottom + offset;
        left = triggerRect.right - overlayWidth;
        break;

      case 'top-start':
        top = triggerRect.top - overlayHeight - offset;
        left = triggerRect.left;
        break;
      case 'top':
        top = triggerRect.top - overlayHeight - offset;
        left = triggerRect.left + (triggerRect.width - overlayWidth) / 2;
        break;
      case 'top-end':
        top = triggerRect.top - overlayHeight - offset;
        left = triggerRect.right - overlayWidth;
        break;

      case 'left-start':
        top = triggerRect.top;
        left = triggerRect.left - overlayWidth - offset;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - overlayHeight) / 2;
        left = triggerRect.left - overlayWidth - offset;
        break;
      case 'left-end':
        top = triggerRect.bottom - overlayHeight;
        left = triggerRect.left - overlayWidth - offset;
        break;

      case 'right-start':
        top = triggerRect.top;
        left = triggerRect.right + offset;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - overlayHeight) / 2;
        left = triggerRect.right + offset;
        break;
      case 'right-end':
        top = triggerRect.bottom - overlayHeight;
        left = triggerRect.right + offset;
        break;
    }

    // Viewport boundary clamping (fixed coordinates MUST NOT exceed screen bounds)
    top = Math.max(padding, Math.min(top, vh - overlayHeight - padding));
    left = Math.max(padding, Math.min(left, vw - overlayWidth - padding));

    setCoords({ top, left });
  }, [triggerRef, overlayRef, placement, offset, padding]);

  React.useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  React.useEffect(() => {
    if (!isOpen) return;

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  return coords;
}
