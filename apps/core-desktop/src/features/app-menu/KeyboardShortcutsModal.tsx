import * as React from 'react';
import { Dialog } from '@40labs/ui-components';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Ctrl + K', desc: 'Global Search / Quick Navigation' },
  { key: 'Ctrl + B', desc: 'Toggle / Cycle Sidebar Navigation' },
  { key: 'Ctrl + E', desc: 'File Explorer Workspace' },
  { key: 'Ctrl + N', desc: 'New Sale (POS)' },
  { key: 'Ctrl + ,', desc: 'Settings' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts">
      <div className="space-y-2 text-xs">
        {SHORTCUTS.map((s) => (
          <div key={s.key} className="flex items-center justify-between py-1.5 border-b border-border/30">
            <span className="text-text-muted">{s.desc}</span>
            <span className="font-mono bg-panel px-2 py-0.5 rounded border border-border text-text-primary font-bold">{s.key}</span>
          </div>
        ))}
      </div>
    </Dialog>
  );
};
