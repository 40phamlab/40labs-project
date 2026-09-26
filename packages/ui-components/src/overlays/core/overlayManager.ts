"use client";

import * as React from 'react';

export type OverlayType = 'dialog' | 'drawer' | 'dropdown' | 'popover' | 'tooltip' | 'toast';

export const Z_INDEX_LAYERS: Record<OverlayType, number> = {
  dropdown: 1000,
  popover: 1200,
  drawer: 2000,
  dialog: 3000,
  toast: 5000,
  tooltip: 6000,
};

export interface OverlayRecord {
  id: string;
  type: OverlayType;
  lockScroll?: boolean;
  closeOnEsc?: boolean;
  closeOnOutsideClick?: boolean;
  onClose?: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
  containerRef?: React.RefObject<HTMLElement | null>;
  previousActiveElement?: HTMLElement | null;
  baseZIndex?: number;
  computedZIndex: number;
}

class OverlayStackManager {
  private stack: OverlayRecord[] = [];
  private lockCount = 0;
  private originalBodyOverflow = '';
  private originalBodyPaddingRight = '';
  private isListenersAttached = false;

  private attachGlobalListeners() {
    if (this.isListenersAttached || typeof window === 'undefined') return;
    window.addEventListener('keydown', this.handleKeyDown, true);
    window.addEventListener('mousedown', this.handlePointerDown, true);
    window.addEventListener('touchstart', this.handlePointerDown, true);
    this.isListenersAttached = true;
  }

  private detachGlobalListeners() {
    if (!this.isListenersAttached || typeof window === 'undefined') return;
    if (this.stack.length === 0) {
      window.removeEventListener('keydown', this.handleKeyDown, true);
      window.removeEventListener('mousedown', this.handlePointerDown, true);
      window.removeEventListener('touchstart', this.handlePointerDown, true);
      this.isListenersAttached = false;
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.stack.length > 0) {
      for (let i = this.stack.length - 1; i >= 0; i--) {
        const item = this.stack[i];
        if (item.closeOnEsc !== false && item.onClose) {
          e.preventDefault();
          e.stopPropagation();
          item.onClose();
          break;
        }
      }
    }
  };

  private handlePointerDown = (e: MouseEvent | TouchEvent) => {
    if (this.stack.length === 0) return;
    const target = e.target as Node;

    for (let i = this.stack.length - 1; i >= 0; i--) {
      const item = this.stack[i];
      const insideContainer = item.containerRef?.current?.contains(target);
      const insideTrigger = item.triggerRef?.current?.contains(target);

      if (insideContainer || insideTrigger) {
        return;
      }

      if (item.closeOnOutsideClick !== false && item.onClose) {
        item.onClose();
        return;
      }
    }
  };

  public register(item: Omit<OverlayRecord, 'computedZIndex'>): { computedZIndex: number; unregister: () => void } {
    this.attachGlobalListeners();

    const baseZ = item.baseZIndex ?? Z_INDEX_LAYERS[item.type];
    let computedZIndex: number;

    if (item.type === 'toast' || item.type === 'tooltip') {
      const sameTypeItems = this.stack.filter((s) => s.type === item.type);
      const maxZ = sameTypeItems.reduce((acc, curr) => Math.max(acc, curr.computedZIndex), baseZ);
      computedZIndex = sameTypeItems.length > 0 ? maxZ + 10 : baseZ;
    } else {
      const structuralItems = this.stack.filter(
        (s) => s.type !== 'toast' && s.type !== 'tooltip'
      );
      const maxStructuralZ = structuralItems.reduce(
        (acc, curr) => Math.max(acc, curr.computedZIndex),
        0
      );
      computedZIndex = maxStructuralZ > 0 ? Math.max(baseZ, maxStructuralZ + 10) : baseZ;
    }

    const record: OverlayRecord = {
      ...item,
      computedZIndex,
      previousActiveElement:
        typeof document !== 'undefined' ? (document.activeElement as HTMLElement) : null,
    };

    this.stack.push(record);

    if (item.lockScroll) {
      this.lockBodyScroll();
    }

    const unregister = () => {
      this.unregister(item.id);
    };

    return { computedZIndex, unregister };
  }

  public unregister(id: string) {
    const index = this.stack.findIndex((item) => item.id === id);
    if (index === -1) return;

    const [removed] = this.stack.splice(index, 1);

    if (removed && removed.lockScroll) {
      this.unlockBodyScroll();
    }

    if (
      removed &&
      removed.previousActiveElement &&
      typeof document !== 'undefined' &&
      document.body.contains(removed.previousActiveElement)
    ) {
      try {
        removed.previousActiveElement.focus({ preventScroll: true });
      } catch {
        // Ignore focus errors
      }
    }

    this.detachGlobalListeners();
  }

  public getTopOverlay(): OverlayRecord | undefined {
    return this.stack[this.stack.length - 1];
  }

  public isTopOverlay(id: string): boolean {
    const top = this.getTopOverlay();
    return top ? top.id === id : false;
  }

  private lockBodyScroll() {
    if (typeof document === 'undefined') return;
    if (this.lockCount === 0) {
      this.originalBodyOverflow = document.body.style.overflow;
      this.originalBodyPaddingRight = document.body.style.paddingRight;

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        const currentPadding = parseFloat(window.getComputedStyle(document.body).paddingRight || '0');
        document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
      }
      document.body.style.overflow = 'hidden';
    }
    this.lockCount++;
  }

  private unlockBodyScroll() {
    if (typeof document === 'undefined') return;
    this.lockCount = Math.max(0, this.lockCount - 1);
    if (this.lockCount === 0) {
      document.body.style.overflow = this.originalBodyOverflow;
      document.body.style.paddingRight = this.originalBodyPaddingRight;
    }
  }
}

export const overlayManager = new OverlayStackManager();

export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const selector =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el.tagName === 'A'
  );
};

export const handleFocusTrap = (container: HTMLElement, e: React.KeyboardEvent | KeyboardEvent) => {
  if (e.key !== 'Tab') return;
  const focusables = getFocusableElements(container);
  if (focusables.length === 0) {
    e.preventDefault();
    container.focus();
    return;
  }
  const firstEl = focusables[0];
  const lastEl = focusables[focusables.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === firstEl || document.activeElement === container) {
      e.preventDefault();
      lastEl.focus();
    }
  } else {
    if (document.activeElement === lastEl) {
      e.preventDefault();
      firstEl.focus();
    }
  }
};
