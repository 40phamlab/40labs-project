import * as React from 'react';
import {
  Folder,
  FolderPlus,
  Search,
  RotateCw,
  AlertTriangle,
  X
} from 'lucide-react';
import { Button, FileTypeIcon } from '@40labs/ui-components';
import { explorerApi, type ExplorerItemMetadata, type ExplorerDirectoryContent } from '../../api/explorerApi';
import { useFilePreviewContext } from '../../providers/FilePreviewProvider';
import { useToast } from '../../hooks/useToast';
import { isUsingTauriIpc } from '../../api/client';

import { ExplorerBreadcrumb } from './components/ExplorerBreadcrumb';
import { ExplorerToolbar } from './components/ExplorerToolbar';
import { ExplorerSidebarTree } from './components/ExplorerSidebarTree';
import { ExplorerListView } from './components/ExplorerListView';
import { ExplorerGridView } from './components/ExplorerGridView';
import { ExplorerContextMenu } from './components/ExplorerContextMenu';
import { ExplorerModals } from './components/ExplorerModals';

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(timestamp: number): string {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getFileTypeLabel(item: ExplorerItemMetadata): string {
  if (item.is_dir) return 'Folder';
  const ext = item.extension.toLowerCase();
  switch (ext) {
    case 'pdf': return 'PDF Document';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp': return `${ext.toUpperCase()} Image`;
    case 'txt': return 'Text Document';
    case 'md': return 'Markdown File';
    case 'json': return 'JSON File';
    case 'csv': return 'CSV Spreadsheet';
    case 'doc':
    case 'docx': return 'Word Document';
    case 'xls':
    case 'xlsx': return 'Excel Spreadsheet';
    case 'zip':
    case 'tar':
    case 'gz': return 'Archive File';
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'rs':
    case 'py': return 'Source Code';
    default: return ext ? `${ext.toUpperCase()} File` : 'File';
  }
}

export function getFileIcon(item: ExplorerItemMetadata) {
  if (item.is_dir) return <Folder className="text-[var(--color-warning)] shrink-0" size={18} />;
  return <FileTypeIcon fileName={item.name} size={18} />;
}

export function getMimeTypeFromExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'gif': return 'image/gif';
    case 'svg': return 'image/svg+xml';
    case 'webp': return 'image/webp';
    case 'json': return 'application/json';
    case 'txt': return 'text/plain';
    case 'md': return 'text/markdown';
    case 'csv': return 'text/csv';
    case 'html': return 'text/html';
    case 'xml': return 'text/xml';
    default: return 'application/octet-stream';
  }
}

export const ExplorerScreen: React.FC = () => {
  const { toast } = useToast();
  const { openFile, openBlob } = useFilePreviewContext();

  const [currentPath, setCurrentPath] = React.useState<string>('');
  const [history, setHistory] = React.useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState<number>(-1);

  const [directoryData, setDirectoryData] = React.useState<ExplorerDirectoryContent | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const [selectedPaths, setSelectedPaths] = React.useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list');
  const [sortField, setSortField] = React.useState<'name' | 'modified_at' | 'size_bytes' | 'extension'>('name');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

  const [treeState, setTreeState] = React.useState<Record<string, { isExpanded: boolean; subdirs: ExplorerItemMetadata[] }>>({});

  // Context menu state
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; item?: ExplorerItemMetadata } | null>(null);

  // Modal Dialogs
  const [modalMode, setModalMode] = React.useState<'none' | 'new_folder' | 'rename' | 'delete_confirm'>('none');
  const [modalInput, setModalInput] = React.useState<string>('');
  const [targetItem, setTargetItem] = React.useState<ExplorerItemMetadata | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  // Initialize default directory
  React.useEffect(() => {
    let isMounted = true;
    explorerApi
      .getDefaultDirectory()
      .then((defPath) => {
        if (!isMounted) return;
        setCurrentPath(defPath);
        setHistory([defPath]);
        setHistoryIndex(0);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to resolve default directory:', err);
        setError('Failed to load initial workspace folder.');
        setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Directory Data
  const loadDirectory = React.useCallback(async (path: string) => {
    if (!path) return;
    setLoading(true);
    setError(null);
    setSelectedPaths(new Set());
    try {
      const data = await explorerApi.readDirectory(path);
      setDirectoryData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Failed to read directory.');
      setDirectoryData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (currentPath) {
      loadDirectory(currentPath);
    }
  }, [currentPath, loadDirectory]);

  // Handle Tree Node Expand
  const toggleTreeNode = async (path: string) => {
    const existing = treeState[path];
    if (existing?.isExpanded) {
      setTreeState((prev) => ({
        ...prev,
        [path]: { ...prev[path], isExpanded: false },
      }));
    } else {
      try {
        const content = await explorerApi.readDirectory(path);
        const subdirs = content.items.filter((i) => i.is_dir);
        setTreeState((prev) => ({
          ...prev,
          [path]: { isExpanded: true, subdirs },
        }));
      } catch (err) {
        console.warn('Failed to expand tree node:', err);
      }
    }
  };

  // Navigation handlers
  const navigateTo = (path: string) => {
    if (path === currentPath) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(path);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentPath(path);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentPath(history[newIndex]);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentPath(history[newIndex]);
    }
  };

  const handleUp = () => {
    if (directoryData?.parent_path) {
      navigateTo(directoryData.parent_path);
    }
  };

  const handlePickDirectory = async () => {
    try {
      const picked = await explorerApi.selectDirectory(currentPath);
      if (picked) {
        navigateTo(picked);
      }
    } catch (err) {
      toast.error('Failed to open directory picker.');
    }
  };

  // Double-click file handler
  const handleOpenFile = async (item: ExplorerItemMetadata) => {
    if (item.is_dir) {
      navigateTo(item.path);
      return;
    }

    const ext = item.extension.toLowerCase();
    const mimeType = getMimeTypeFromExtension(item.name);

    try {
      if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'pdf'].includes(ext)) {
        let fileUrl = item.path;
        if (isUsingTauriIpc()) {
          const { convertFileSrc } = await import('@tauri-apps/api/core');
          fileUrl = convertFileSrc(item.path);
        }
        openFile({
          fileName: item.name,
          mimeType,
          sizeBytes: item.size_bytes,
          url: fileUrl,
        });
      } else if (['txt', 'md', 'json', 'csv', 'log', 'xml', 'html', 'css', 'ts', 'tsx', 'js', 'jsx', 'rs', 'py', 'sql'].includes(ext)) {
        const textContent = await explorerApi.readTextFile(item.path);
        const blob = new Blob([textContent], { type: mimeType });
        openBlob({
          fileName: item.name,
          mimeType,
          blob,
        });
      } else {
        await explorerApi.revealInFileManager(item.path);
        toast.info(`Opened location for ${item.name}`);
      }
    } catch (err) {
      console.error('Error opening file:', err);
      toast.error(`Failed to open file ${item.name}`);
    }
  };

  // Selection handlers
  const handleSelectItem = (item: ExplorerItemMetadata, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey) {
      setSelectedPaths((prev) => {
        const next = new Set(prev);
        if (next.has(item.path)) {
          next.delete(item.path);
        } else {
          next.add(item.path);
        }
        return next;
      });
    } else {
      setSelectedPaths(new Set([item.path]));
    }
  };

  const handleSelectAll = () => {
    if (!directoryData) return;
    const allPaths = new Set(directoryData.items.map((i) => i.path));
    setSelectedPaths(allPaths);
  };

  const handleClearSelection = () => {
    setSelectedPaths(new Set());
  };

  // Context Menu handlers
  const handleContextMenu = (e: React.MouseEvent, item?: ExplorerItemMetadata) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
    });
    if (item && !selectedPaths.has(item.path)) {
      setSelectedPaths(new Set([item.path]));
    }
  };

  React.useEffect(() => {
    const handleOutsideClick = () => setContextMenu(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Modal actions
  const handleCreateFolder = async () => {
    if (!modalInput.trim() || !currentPath) return;
    setIsSubmitting(true);
    try {
      await explorerApi.createDirectory(currentPath, modalInput.trim());
      toast.success(`Created folder "${modalInput.trim()}"`);
      setModalMode('none');
      setModalInput('');
      loadDirectory(currentPath);
    } catch (err: unknown) {
      toast.error(String(err) || 'Failed to create folder.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenameItem = async () => {
    if (!targetItem || !modalInput.trim()) return;
    setIsSubmitting(true);
    try {
      await explorerApi.renameItem(targetItem.path, modalInput.trim());
      toast.success(`Renamed to "${modalInput.trim()}"`);
      setModalMode('none');
      setModalInput('');
      setTargetItem(null);
      loadDirectory(currentPath);
    } catch (err: unknown) {
      toast.error(String(err) || 'Failed to rename item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async () => {
    if (selectedPaths.size === 0) return;
    setIsSubmitting(true);
    try {
      for (const p of selectedPaths) {
        await explorerApi.deleteItem(p);
      }
      toast.success(`Deleted ${selectedPaths.size} item(s)`);
      setModalMode('none');
      setSelectedPaths(new Set());
      loadDirectory(currentPath);
    } catch (err: unknown) {
      toast.error(String(err) || 'Failed to delete item(s).');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered and Sorted Items
  const displayedItems = React.useMemo(() => {
    if (!directoryData) return [];
    let items = [...directoryData.items];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }

    items.sort((a, b) => {
      if (a.is_dir !== b.is_dir) {
        return b.is_dir ? 1 : -1;
      }
      let cmp = 0;
      if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      } else if (sortField === 'modified_at') {
        cmp = a.modified_at - b.modified_at;
      } else if (sortField === 'size_bytes') {
        cmp = a.size_bytes - b.size_bytes;
      } else if (sortField === 'extension') {
        cmp = a.extension.localeCompare(b.extension);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return items;
  }, [directoryData, searchQuery, sortField, sortOrder]);

  // Breadcrumbs
  const breadcrumbSegments = React.useMemo(() => {
    if (!currentPath) return [];
    const parts = currentPath.split(/[/\\]/).filter(Boolean);
    let accum = '';
    const isWindows = currentPath.includes('\\');
    const sep = isWindows ? '\\' : '/';

    return parts.map((part, index) => {
      if (index === 0 && isWindows) {
        accum = `${part}${sep}`;
      } else {
        accum = accum ? `${accum}${sep}${part}` : `${sep}${part}`;
      }
      return {
        name: part,
        path: accum,
      };
    });
  }, [currentPath]);

  const selectedItem = React.useMemo(() => {
    if (selectedPaths.size !== 1 || !directoryData) return null;
    const path = Array.from(selectedPaths)[0];
    return directoryData.items.find((i) => i.path === path) || null;
  }, [selectedPaths, directoryData]);

  const handleSortChange = (field: 'name' | 'modified_at' | 'size_bytes' | 'extension') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-[var(--color-app-bg)] text-[var(--color-text-primary)] select-none overflow-hidden font-sans">
      {/* Top Header / Breadcrumb Bar */}
      <div className="h-12 px-3 border-b border-[var(--color-border-default)] flex items-center justify-between gap-3 bg-[var(--color-surface-primary)] shrink-0 elevation-raised">
        {/* Navigation History & Refresh */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleBack}
            disabled={historyIndex <= 0}
            className="p-1.5 h-7 w-7 flex items-center justify-center rounded-md"
            title="Go Back"
          >
            ←
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleForward}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 h-7 w-7 flex items-center justify-center rounded-md"
            title="Go Forward"
          >
            →
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleUp}
            disabled={!directoryData?.parent_path}
            className="p-1.5 h-7 w-7 flex items-center justify-center rounded-md"
            title="Go to Parent Folder"
          >
            ↑
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => loadDirectory(currentPath)}
            className="p-1.5 h-7 w-7 flex items-center justify-center rounded-md"
            title="Refresh Directory"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>

        {/* Breadcrumb Path Bar */}
        <ExplorerBreadcrumb
          currentPath={currentPath}
          breadcrumbSegments={breadcrumbSegments}
          onNavigate={navigateTo}
        />

        {/* Search Bar */}
        <div className="relative flex items-center w-64 shrink-0">
          <Search size={14} className="absolute left-3 text-[var(--color-text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search folder..."
            className="w-full pl-8 pr-7 py-1.5 bg-[var(--color-app-bg)] border border-[var(--color-border-default)] rounded-[var(--radius-input)] text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)] elevation-inset"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace split */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Collapsible Directory Tree */}
        <ExplorerSidebarTree
          currentPath={currentPath}
          directoryData={directoryData}
          treeState={treeState}
          onNavigate={navigateTo}
          onToggleTreeNode={toggleTreeNode}
          onPickDirectory={handlePickDirectory}
          onGetDefaultDirectory={explorerApi.getDefaultDirectory}
        />

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--color-app-bg)] overflow-hidden" onClick={handleClearSelection}>
          {/* Action Toolbar */}
          <ExplorerToolbar
            historyIndex={historyIndex}
            historyLength={history.length}
            hasParentPath={!!directoryData?.parent_path}
            loading={loading}
            selectedPaths={selectedPaths}
            selectedItem={selectedItem}
            viewMode={viewMode}
            onBack={handleBack}
            onForward={handleForward}
            onUp={handleUp}
            onRefresh={() => loadDirectory(currentPath)}
            onNewFolder={() => {
              setModalInput('');
              setModalMode('new_folder');
            }}
            onRename={() => {
              if (selectedItem) {
                setTargetItem(selectedItem);
                setModalInput(selectedItem.name);
                setModalMode('rename');
              }
            }}
            onDelete={() => setModalMode('delete_confirm')}
            onReveal={() => {
              if (selectedItem) explorerApi.revealInFileManager(selectedItem.path);
            }}
            onViewModeChange={setViewMode}
          />

          {/* Main List Area */}
          <div className="flex-1 overflow-y-auto p-3.5 min-h-0 custom-scrollbar" onContextMenu={(e) => handleContextMenu(e)}>
            {loading ? (
              <div className="h-full flex items-center justify-center flex-col gap-2.5 text-[var(--color-text-muted)] text-xs">
                <RotateCw size={24} className="animate-spin text-[var(--color-action-primary)]" />
                <span>Loading directory content...</span>
              </div>
            ) : error ? (
              <div className="h-full flex items-center justify-center flex-col gap-3 p-6 text-center">
                <AlertTriangle size={32} className="text-[var(--color-danger)]" />
                <div className="space-y-1 max-w-md">
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">Unable to Access Folder</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{error}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    explorerApi.getDefaultDirectory().then(navigateTo);
                  }}
                >
                  Return to Default Workspace
                </Button>
              </div>
            ) : displayedItems.length === 0 ? (
              <div className="h-full flex items-center justify-center flex-col gap-3.5 text-[var(--color-text-muted)] text-xs py-12">
                <Folder size={44} className="text-[var(--color-text-muted)]/30" />
                <p className="font-medium text-sm text-[var(--color-text-primary)]">This folder is empty</p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalInput('');
                    setModalMode('new_folder');
                  }}
                  className="flex items-center gap-1.5"
                >
                  <FolderPlus size={14} />
                  <span>Create New Subfolder</span>
                </Button>
              </div>
            ) : viewMode === 'list' ? (
              <ExplorerListView
                displayedItems={displayedItems}
                selectedPaths={selectedPaths}
                sortField={sortField}
                sortOrder={sortOrder}
                onSelectItem={handleSelectItem}
                onSelectAll={handleSelectAll}
                onClearSelection={handleClearSelection}
                onOpenFile={handleOpenFile}
                onContextMenu={handleContextMenu}
                onSortChange={handleSortChange}
                formatBytes={formatBytes}
                formatDate={formatDate}
                getFileTypeLabel={getFileTypeLabel}
              />
            ) : (
              <ExplorerGridView
                displayedItems={displayedItems}
                selectedPaths={selectedPaths}
                onSelectItem={handleSelectItem}
                onOpenFile={handleOpenFile}
                onContextMenu={handleContextMenu}
                formatBytes={formatBytes}
              />
            )}
          </div>
        </div>
      </div>

      {/* Context Menu Popup */}
      <ExplorerContextMenu
        contextMenu={contextMenu}
        onClose={() => setContextMenu(null)}
        onOpenFile={handleOpenFile}
        onRename={(item) => {
          setTargetItem(item);
          setModalInput(item.name);
          setModalMode('rename');
        }}
        onReveal={(path) => explorerApi.revealInFileManager(path)}
        onDeleteConfirm={() => setModalMode('delete_confirm')}
        onNewFolder={() => {
          setModalInput('');
          setModalMode('new_folder');
        }}
        onRefresh={() => loadDirectory(currentPath)}
        onSelectAll={handleSelectAll}
      />

      {/* Modals */}
      <ExplorerModals
        modalMode={modalMode}
        modalInput={modalInput}
        isSubmitting={isSubmitting}
        selectedCount={selectedPaths.size}
        onClose={() => setModalMode('none')}
        onInputChange={setModalInput}
        onCreateFolder={handleCreateFolder}
        onRenameItem={handleRenameItem}
        onDeleteItem={handleDeleteItem}
      />
    </div>
  );
};
