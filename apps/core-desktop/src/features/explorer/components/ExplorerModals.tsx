import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog, Button } from '@40labs/ui-components';

export interface ExplorerModalsProps {
  modalMode: 'none' | 'new_folder' | 'rename' | 'delete_confirm';
  modalInput: string;
  isSubmitting: boolean;
  selectedCount: number;
  onClose: () => void;
  onInputChange: (value: string) => void;
  onCreateFolder: () => void;
  onRenameItem: () => void;
  onDeleteItem: () => void;
}

export const ExplorerModals: React.FC<ExplorerModalsProps> = ({
  modalMode,
  modalInput,
  isSubmitting,
  selectedCount,
  onClose,
  onInputChange,
  onCreateFolder,
  onRenameItem,
  onDeleteItem,
}) => {
  return (
    <>
      {/* New Folder Modal */}
      <Dialog
        isOpen={modalMode === 'new_folder'}
        onClose={onClose}
        title="Create New Folder"
      >
        <div className="space-y-4 text-xs text-[var(--color-text-primary)] pt-1">
          <div className="space-y-1.5">
            <label className="text-[var(--color-text-muted)] font-medium">Folder Name</label>
            <input
              type="text"
              autoFocus
              value={modalInput}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="New Folder"
              onKeyDown={(e) => {
                if (e.key === 'Enter') onCreateFolder();
              }}
              className="w-full px-3 py-2 bg-[var(--color-app-bg)] border border-[var(--color-border-default)] rounded-[var(--radius-input)] text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)] elevation-inset"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" disabled={!modalInput.trim() || isSubmitting} onClick={onCreateFolder}>
              {isSubmitting ? 'Creating...' : 'Create Folder'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Rename Modal */}
      <Dialog
        isOpen={modalMode === 'rename'}
        onClose={onClose}
        title="Rename Item"
      >
        <div className="space-y-4 text-xs text-[var(--color-text-primary)] pt-1">
          <div className="space-y-1.5">
            <label className="text-[var(--color-text-muted)] font-medium">New Name</label>
            <input
              type="text"
              autoFocus
              value={modalInput}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onRenameItem();
              }}
              className="w-full px-3 py-2 bg-[var(--color-app-bg)] border border-[var(--color-border-default)] rounded-[var(--radius-input)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)] elevation-inset"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" disabled={!modalInput.trim() || isSubmitting} onClick={onRenameItem}>
              {isSubmitting ? 'Renaming...' : 'Save Name'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        isOpen={modalMode === 'delete_confirm'}
        onClose={onClose}
        title="Confirm Delete"
      >
        <div className="space-y-4 text-xs text-[var(--color-text-primary)] pt-1">
          <div className="p-3.5 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 rounded-lg flex items-start gap-3">
            <AlertTriangle size={20} className="text-[var(--color-danger)] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-[var(--color-danger)]">Permanent Deletion Warning</p>
              <p className="text-[var(--color-text-muted)]">
                Are you sure you want to delete {selectedCount} selected item(s)? This operation cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" variant="danger" disabled={isSubmitting} onClick={onDeleteItem}>
              {isSubmitting ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
};
