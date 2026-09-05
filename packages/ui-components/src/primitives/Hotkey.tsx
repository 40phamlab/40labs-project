import * as React from 'react';
import { Modal } from '../overlays/Modal';

export interface HotkeyBadgeProps {
  children: React.ReactNode;
  className?: string;
}

export const HotkeyBadge = ({ children, className = '' }: HotkeyBadgeProps) => {
  return (
    <kbd
      className={`
        inline-flex items-center justify-center px-1.5 py-0.5
        min-w-[20px] rounded-input
        bg-panel-strong border border-border/40
        text-caption font-mono font-bold text-text-muted
        shadow-[inset_0_-1px_0_rgba(255,255,255,0.05),0_1px_0_rgba(0,0,0,0.5)]
        ${className}
      `}
    >
      {children}
    </kbd>
  );
};

export interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

export interface HotkeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: Shortcut[];
}

export const HotkeyModal = ({ isOpen, onClose, shortcuts }: HotkeyModalProps) => {
  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" size="md">
      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {categories.map(category => (
          <div key={category} className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-accent/80 border-b border-border/30 pb-1">
              {category}
            </h3>
            <div className="space-y-2">
              {shortcuts
                .filter(s => s.category === category)
                .map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <span className="text-xs text-text">{s.description}</span>
                    <div className="flex gap-1">
                      {s.keys.map(key => (
                        <HotkeyBadge key={key}>{key}</HotkeyBadge>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t border-border/20 flex justify-center">
        <p className="text-[9px] text-text-muted italic">
          Press <HotkeyBadge>ESC</HotkeyBadge> to close this menu
        </p>
      </div>
    </Modal>
  );
};
