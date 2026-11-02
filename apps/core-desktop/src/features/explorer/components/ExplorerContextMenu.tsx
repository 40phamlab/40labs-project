import * as React from 'react';
import { Folder, FolderPlus, RotateCw, Edit3, Trash2, ExternalLink, CheckSquare } from 'lucide-react';
import { type ExplorerItemMetadata } from '../../../api/explorerApi';

export interface ExplorerContextMenuProps {
  contextMenu: { x: number; y: number; item?: ExplorerItemMetadata } | null;
  onClose: () => void;
  onOpenFile: (item: ExplorerItemMetadata) => void;
  onRename: (item: ExplorerItemMetadata) => void;
  onReveal: (path: string) => void;
  onDeleteConfirm: () => void;
  onNewFolder: () => void;
  onRefresh: () => void;
  onSelectAll: () => void;
}

export const ExplorerContextMenu: React.FC<ExplorerContextMenuProps> = ({
  contextMenu,
  onClose,
  onOpenFile,
  onRename,
  onReveal,
  onDeleteConfirm,
  onNewFolder,
  onRefresh,
  onSelectAll,
}) => {
  if (!contextMenu) return null;

  return (
    <div
      style={{ top: contextMenu.y, left: contextMenu.x }}
      className="fixed z-50 w-52 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-[var(--radius-card)] shadow-2xl py-1.5 text-xs text-[var(--color-text-primary)] animate-in fade-in zoom-in-95 duration-100 elevation-raised"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      {contextMenu.item ? (
        <>
          <button
            type="button"
            onClick={() => onOpenFile(contextMenu.item!)}
            className="w-full text-left px-3 py-2 hover:bg-[var(--color-surface-hover)] flex items-center gap-2.5 cursor-pointer transition-colors"
          >
            {contextMenu.item.is_dir ? <Folder size={15} /> : <ExternalLink size={15} />}
            <span>{contextMenu.item.is_dir ? 'Open Folder' : 'Open Preview'}</span>
          </button>
          <button
            type="button"
            onClick={() => onRename(contextMenu.item!)}
            className="w-full text-left px-3 py-2 hover:bg-[var(--color-surface-hover)] flex items-center gap-2.5 cursor-pointer transition-colors"
          >
            <Edit3 size={15} />
            <span>Rename</span>
          </button>
          <button
            type="button"
            onClick={() => onReveal(contextMenu.item!.path)}
            className="w-full text-left px-3 py-2 hover:bg-[var(--color-surface-hover)] flex items-center gap-2.5 cursor-pointer transition-colors"
          >
            <ExternalLink size={15} />
            <span>Reveal in File Manager</span>
          </button>
          <div className="my-1 border-t border-[var(--color-border-default)]" />
          <button
            type="button"
            onClick={onDeleteConfirm}
            className="w-full text-left px-3 py-2 hover:bg-[var(--color-danger)]/15 text-[var(--color-danger)] flex items-center gap-2.5 cursor-pointer transition-colors font-medium"
          >
            <Trash2 size={15} />
            <span>Delete Permanently</span>
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={onNewFolder}
            className="w-full text-left px-3 py-2 hover:bg-[var(--color-surface-hover)] flex items-center gap-2.5 cursor-pointer transition-colors"
          >
            <FolderPlus size={15} className="text-[var(--color-warning)]" />
            <span>New Folder</span>
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="w-full text-left px-3 py-2 hover:bg-[var(--color-surface-hover)] flex items-center gap-2.5 cursor-pointer transition-colors"
          >
            <RotateCw size={15} />
            <span>Refresh Folder</span>
          </button>
          <button
            type="button"
            onClick={onSelectAll}
            className="w-full text-left px-3 py-2 hover:bg-[var(--color-surface-hover)] flex items-center gap-2.5 cursor-pointer transition-colors"
          >
            <CheckSquare size={15} />
            <span>Select All</span>
          </button>
        </>
      )}
    </div>
  );
};
