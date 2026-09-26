"use client";

import * as React from 'react';
import { overlayManager, OverlayType, Z_INDEX_LAYERS } from './overlayManager';

export interface UseOverlayOptions {
  isOpen: boolean;
  type: OverlayType;
  id?: string;
  lockScroll?: boolean;
  closeOnEsc?: boolean;
  closeOnOutsideClick?: boolean;
  onClose?: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
  containerRef?: React.RefObject<HTMLElement | null>;
  baseZIndex?: number;
}

export function useOverlay({
  isOpen,
  type,
  id: customId,
  lockScroll = false,
  closeOnEsc = true,
  closeOnOutsideClick = true,
  onClose,
  triggerRef,
  containerRef,
  baseZIndex,
}: UseOverlayOptions) {
  const generatedId = React.useId();
  const id = customId || generatedId;
  const [zIndex, setZIndex] = React.useState<number>(baseZIndex ?? Z_INDEX_LAYERS[type]);

  React.useLayoutEffect(() => {
    if (!isOpen) return;

    const { computedZIndex, unregister } = overlayManager.register({
      id,
      type,
      lockScroll,
      closeOnEsc,
      closeOnOutsideClick,
      onClose,
      triggerRef,
      containerRef,
      baseZIndex,
    });

    setZIndex(computedZIndex);

    return () => {
      unregister();
    };
  }, [
    isOpen,
    id,
    type,
    lockScroll,
    closeOnEsc,
    closeOnOutsideClick,
    onClose,
    triggerRef,
    containerRef,
    baseZIndex,
  ]);

  return { zIndex, id, isTop: overlayManager.isTopOverlay(id) };
}
