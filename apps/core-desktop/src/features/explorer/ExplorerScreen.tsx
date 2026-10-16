import * as React from 'react';
import {
  Folder,
  FolderPlus,
  FileText,
  Image as ImageIcon,
  FileCode,
  FileSpreadsheet,
  File,
  Search,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RotateCw,
  Grid as GridIcon,
  List as ListIcon,
  Trash2,
  Edit3,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  HardDrive,
  CheckSquare,
  Square,
  AlertTriangle,
  X
} from 'lucide-react';
import { Dialog, Button } from '@40labs/ui-components';
import { explorerApi, type ExplorerItemMetadata, type ExplorerDirectoryContent } from '../../api/explorerApi';
import { useFilePreviewContext } from '../../providers/FilePreviewProvider';
import { useToast } from '../../hooks/useToast';
import { isUsingTauriIpc } from '../../api/client';

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
  if (item.is_dir) return <Folder className="text-amber-400 shrink-0" size={18} />;
  const ext = item.extension.toLowerCase();
  switch (ext) {
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return <ImageIcon className="text-blue-400 shrink-0" size={18} />;
    case 'txt':
    case 'md':
    case 'log':
      return <FileText className="text-emerald-400 shrink-0" size={18} />;
    case 'json':
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'rs':
    case 'py':
    case 'html':
    case 'css':
      return <FileCode className="text-purple-400 shrink-0" size={18} />;
    case 'csv':
    case 'xls':
    case 'xlsx':
      return <FileSpreadsheet className="text-green-400 shrink-0" size={18} />;
    case 'pdf':
      return <FileText className="text-rose-400 shrink-0" size={18} />;
    default:
      return <File className="text-text-muted shrink-0" size={18} />;
  }
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
        // Unknown binary file: reveal in file manager
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

  return (
    <div className="h-full w-full flex flex-col bg-app-bg text-text-primary select-none overflow-hidden font-sans">
      {/* Top Header / Breadcrumb Bar */}
      <div className="h-11 px-3 border-b border-border-muted/50 flex items-center justify-between gap-2 bg-surface-card shrink-0">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleBack}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleForward}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Go Forward"
          >
            <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={handleUp}
            disabled={!directoryData?.parent_path}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Go to Parent Folder"
          >
            <ArrowUp size={16} />
          </button>
          <button
            type="button"
            onClick={() => loadDirectory(currentPath)}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
            title="Refresh Directory"
          >
            <RotateCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Breadcrumbs Path Bar */}
        <div className="flex-1 flex items-center gap-1 px-2.5 py-1 bg-app-bg border border-border-muted rounded-md text-xs font-mono overflow-x-auto whitespace-nowrap scrollbar-thin">
          <HardDrive size={14} className="text-action-primary shrink-0 mr-1" />
          {breadcrumbSegments.map((segment, idx) => (
            <React.Fragment key={segment.path}>
              {idx > 0 && <span className="text-text-muted/40 font-sans">/</span>}
              <button
                type="button"
                onClick={() => navigateTo(segment.path)}
                className={`hover:text-action-primary hover:underline transition-colors cursor-pointer ${
                  idx === breadcrumbSegments.length - 1 ? 'font-bold text-text-primary' : 'text-text-muted'
                }`}
              >
                {segment.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center w-64 shrink-0">
          <Search size={14} className="absolute left-2.5 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search folder..."
            className="w-full pl-8 pr-7 py-1 bg-app-bg border border-border-muted rounded-md text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-focus-ring"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-text-muted hover:text-text-primary"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace split */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Collapsible Directory Tree */}
        <div className="w-56 border-r border-border-muted/50 bg-surface-card flex flex-col shrink-0 overflow-hidden">
          <div className="p-2 border-b border-border-muted/40 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted px-1">Locations</span>
            <button
              type="button"
              onClick={handlePickDirectory}
              className="text-[11px] px-1.5 py-0.5 rounded bg-app-bg hover:bg-surface-hover text-action-primary hover:underline transition-colors cursor-pointer"
              title="Open native directory picker"
            >
              Browse...
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin text-xs">
            {/* Quick Access Items */}
            <div
              onClick={() => {
                explorerApi.getDefaultDirectory().then(navigateTo);
              }}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                currentPath.endsWith('40Labs') ? 'bg-action-primary/15 text-action-primary font-medium' : 'hover:bg-surface-hover text-text-muted hover:text-text-primary'
              }`}
            >
              <Folder size={15} className="text-amber-400 shrink-0" />
              <span className="truncate">40Labs Root</span>
            </div>

            {/* Subtree node renderer */}
            {directoryData && (
              <div className="mt-2 pt-2 border-t border-border-muted/30 space-y-1">
                <div className="px-2 py-1 flex items-center justify-between text-text-muted font-bold text-[11px] uppercase tracking-wider">
                  <span>Folder Structure</span>
                </div>
                {directoryData.items
                  .filter((i) => i.is_dir)
                  .map((sub) => {
                    const isExp = treeState[sub.path]?.isExpanded;
                    return (
                      <div key={sub.path} className="space-y-0.5">
                        <div
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer transition-colors text-xs ${
                            currentPath === sub.path ? 'bg-action-primary/15 text-action-primary font-bold' : 'hover:bg-surface-hover text-text-primary'
                          }`}
                          onClick={() => navigateTo(sub.path)}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTreeNode(sub.path);
                            }}
                            className="p-0.5 text-text-muted hover:text-text-primary"
                          >
                            {isExp ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                          </button>
                          <Folder size={14} className="text-amber-400 shrink-0" />
                          <span className="truncate">{sub.name}</span>
                        </div>

                        {/* Expanded sub-folders */}
                        {isExp && treeState[sub.path]?.subdirs && (
                          <div className="pl-5 space-y-0.5 border-l border-border-muted/30 ml-2">
                            {treeState[sub.path].subdirs.map((child) => (
                              <div
                                key={child.path}
                                onClick={() => navigateTo(child.path)}
                                className={`flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer text-[11px] ${
                                  currentPath === child.path ? 'bg-action-primary/15 text-action-primary font-bold' : 'hover:bg-surface-hover text-text-muted hover:text-text-primary'
                                }`}
                              >
                                <Folder size={12} className="text-amber-400/80 shrink-0" />
                                <span className="truncate">{child.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-app-bg overflow-hidden" onClick={handleClearSelection}>
          {/* Action Toolbar */}
          <div className="h-10 px-3 border-b border-border-muted/50 bg-surface-card flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setModalInput('');
                  setModalMode('new_folder');
                }}
                className="h-7 text-xs flex items-center gap-1.5"
              >
                <FolderPlus size={14} className="text-amber-400" />
                <span>New Folder</span>
              </Button>

              <Button
                size="sm"
                variant="secondary"
                disabled={selectedPaths.size !== 1}
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedItem) {
                    setTargetItem(selectedItem);
                    setModalInput(selectedItem.name);
                    setModalMode('rename');
                  }
                }}
                className="h-7 text-xs flex items-center gap-1.5"
              >
                <Edit3 size={14} />
                <span>Rename</span>
              </Button>

              <Button
                size="sm"
                variant="danger"
                disabled={selectedPaths.size === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  setModalMode('delete_confirm');
                }}
                className="h-7 text-xs flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </Button>

              {selectedItem && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    explorerApi.revealInFileManager(selectedItem.path);
                  }}
                  className="h-7 text-xs flex items-center gap-1.5"
                  title="Reveal in OS File Manager"
                >
                  <ExternalLink size={14} />
                  <span>Reveal</span>
                </Button>
              )}
            </div>

            {/* View Mode & Selection count */}
            <div className="flex items-center gap-3">
              {selectedPaths.size > 0 && (
                <span className="text-xs text-action-primary font-medium">
                  {selectedPaths.size} item(s) selected
                </span>
              )}

              <div className="flex items-center bg-app-bg border border-border-muted rounded-md p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded ${viewMode === 'list' ? 'bg-surface-hover text-action-primary' : 'text-text-muted hover:text-text-primary'}`}
                  title="List View"
                >
                  <ListIcon size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded ${viewMode === 'grid' ? 'bg-surface-hover text-action-primary' : 'text-text-muted hover:text-text-primary'}`}
                  title="Grid View"
                >
                  <GridIcon size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Main List Area */}
          <div className="flex-1 overflow-y-auto p-3 min-h-0 scrollbar-thin" onContextMenu={(e) => handleContextMenu(e)}>
            {loading ? (
              <div className="h-full flex items-center justify-center flex-col gap-2 text-text-muted text-xs">
                <RotateCw size={24} className="animate-spin text-action-primary" />
                <span>Loading directory content...</span>
              </div>
            ) : error ? (
              <div className="h-full flex items-center justify-center flex-col gap-3 p-6 text-center">
                <AlertTriangle size={32} className="text-danger" />
                <div className="space-y-1 max-w-md">
                  <p className="text-sm font-bold text-text-primary">Unable to Access Folder</p>
                  <p className="text-xs text-text-muted">{error}</p>
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
              <div className="h-full flex items-center justify-center flex-col gap-3 text-text-muted text-xs py-12">
                <Folder size={40} className="text-text-muted/30" />
                <p className="font-medium text-text-primary">This folder is empty</p>
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
              /* Table List View */
              <table className="w-full text-left text-xs border-collapse select-none">
                <thead>
                  <tr className="border-b border-border-muted/50 text-text-muted text-[11px] font-bold uppercase tracking-wider h-8">
                    <th className="w-8 px-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedPaths.size === displayedItems.length) {
                            handleClearSelection();
                          } else {
                            handleSelectAll();
                          }
                        }}
                        className="text-text-muted hover:text-text-primary cursor-pointer"
                      >
                        {selectedPaths.size > 0 && selectedPaths.size === displayedItems.length ? (
                          <CheckSquare size={14} className="text-action-primary" />
                        ) : (
                          <Square size={14} />
                        )}
                      </button>
                    </th>
                    <th
                      className="px-2 cursor-pointer hover:text-text-primary"
                      onClick={() => {
                        if (sortField === 'name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        else {
                          setSortField('name');
                          setSortOrder('asc');
                        }
                      }}
                    >
                      Name {sortField === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th
                      className="px-2 w-36 cursor-pointer hover:text-text-primary"
                      onClick={() => {
                        if (sortField === 'extension') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        else {
                          setSortField('extension');
                          setSortOrder('asc');
                        }
                      }}
                    >
                      Type {sortField === 'extension' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th
                      className="px-2 w-28 text-right cursor-pointer hover:text-text-primary"
                      onClick={() => {
                        if (sortField === 'size_bytes') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        else {
                          setSortField('size_bytes');
                          setSortOrder('asc');
                        }
                      }}
                    >
                      Size {sortField === 'size_bytes' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th
                      className="px-2 w-44 text-right cursor-pointer hover:text-text-primary"
                      onClick={() => {
                        if (sortField === 'modified_at') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        else {
                          setSortField('modified_at');
                          setSortOrder('asc');
                        }
                      }}
                    >
                      Date Modified {sortField === 'modified_at' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-muted/30">
                  {displayedItems.map((item) => {
                    const isSelected = selectedPaths.has(item.path);
                    return (
                      <tr
                        key={item.path}
                        onClick={(e) => handleSelectItem(item, e)}
                        onDoubleClick={() => handleOpenFile(item)}
                        onContextMenu={(e) => handleContextMenu(e, item)}
                        className={`h-9 hover:bg-surface-hover/80 cursor-pointer transition-colors ${
                          isSelected ? 'bg-action-primary/15 font-medium' : ''
                        }`}
                      >
                        <td className="px-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleSelectItem(item, e)}
                            className="text-text-muted hover:text-text-primary"
                          >
                            {isSelected ? <CheckSquare size={14} className="text-action-primary" /> : <Square size={14} />}
                          </button>
                        </td>
                        <td className="px-2">
                          <div className="flex items-center gap-2">
                            {getFileIcon(item)}
                            <span className="truncate">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-2 text-text-muted">{getFileTypeLabel(item)}</td>
                        <td className="px-2 text-right font-mono text-text-muted">
                          {item.is_dir ? '—' : formatBytes(item.size_bytes)}
                        </td>
                        <td className="px-2 text-right text-text-muted font-mono text-[11px]">
                          {formatDate(item.modified_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              /* Grid Card View */
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {displayedItems.map((item) => {
                  const isSelected = selectedPaths.has(item.path);
                  return (
                    <div
                      key={item.path}
                      onClick={(e) => handleSelectItem(item, e)}
                      onDoubleClick={() => handleOpenFile(item)}
                      onContextMenu={(e) => handleContextMenu(e, item)}
                      className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-action-primary bg-action-primary/15 shadow-sm'
                          : 'border-border-muted/60 bg-surface-card hover:bg-surface-hover hover:border-border-muted'
                      }`}
                    >
                      <div className="p-2 rounded bg-app-bg/50">
                        {item.is_dir ? (
                          <Folder size={32} className="text-amber-400" />
                        ) : (
                          getFileIcon(item)
                        )}
                      </div>
                      <span className="text-xs font-medium truncate w-full px-1">{item.name}</span>
                      <span className="text-[10px] text-text-muted font-mono">
                        {item.is_dir ? 'Folder' : formatBytes(item.size_bytes)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context Menu Popup */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 w-48 bg-surface-card border border-border-muted rounded-lg shadow-xl py-1 text-xs text-text-primary animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.item ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setContextMenu(null);
                  handleOpenFile(contextMenu.item!);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-surface-hover flex items-center gap-2 cursor-pointer"
              >
                {contextMenu.item.is_dir ? <Folder size={14} /> : <ExternalLink size={14} />}
                <span>{contextMenu.item.is_dir ? 'Open Folder' : 'Open Preview'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setContextMenu(null);
                  setTargetItem(contextMenu.item!);
                  setModalInput(contextMenu.item!.name);
                  setModalMode('rename');
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-surface-hover flex items-center gap-2 cursor-pointer"
              >
                <Edit3 size={14} />
                <span>Rename</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setContextMenu(null);
                  explorerApi.revealInFileManager(contextMenu.item!.path);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-surface-hover flex items-center gap-2 cursor-pointer"
              >
                <ExternalLink size={14} />
                <span>Reveal in File Manager</span>
              </button>
              <div className="my-1 border-t border-border-muted/50" />
              <button
                type="button"
                onClick={() => {
                  setContextMenu(null);
                  setModalMode('delete_confirm');
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-danger/10 text-danger flex items-center gap-2 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Delete Permanently</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setContextMenu(null);
                  setModalInput('');
                  setModalMode('new_folder');
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-surface-hover flex items-center gap-2 cursor-pointer"
              >
                <FolderPlus size={14} className="text-amber-400" />
                <span>New Folder</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setContextMenu(null);
                  loadDirectory(currentPath);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-surface-hover flex items-center gap-2 cursor-pointer"
              >
                <RotateCw size={14} />
                <span>Refresh Folder</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setContextMenu(null);
                  handleSelectAll();
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-surface-hover flex items-center gap-2 cursor-pointer"
              >
                <CheckSquare size={14} />
                <span>Select All</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* New Folder Modal */}
      <Dialog
        isOpen={modalMode === 'new_folder'}
        onClose={() => setModalMode('none')}
        title="Create New Folder"
      >
        <div className="space-y-4 text-xs text-text-primary pt-1">
          <div className="space-y-1.5">
            <label className="text-text-muted font-medium">Folder Name</label>
            <input
              type="text"
              autoFocus
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              placeholder="New Folder"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
              }}
              className="w-full px-3 py-1.5 bg-app-bg border border-border-muted rounded-md text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-focus-ring"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="secondary" onClick={() => setModalMode('none')}>
              Cancel
            </Button>
            <Button size="sm" disabled={!modalInput.trim() || isSubmitting} onClick={handleCreateFolder}>
              {isSubmitting ? 'Creating...' : 'Create Folder'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Rename Modal */}
      <Dialog
        isOpen={modalMode === 'rename'}
        onClose={() => setModalMode('none')}
        title="Rename Item"
      >
        <div className="space-y-4 text-xs text-text-primary pt-1">
          <div className="space-y-1.5">
            <label className="text-text-muted font-medium">New Name</label>
            <input
              type="text"
              autoFocus
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameItem();
              }}
              className="w-full px-3 py-1.5 bg-app-bg border border-border-muted rounded-md text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-focus-ring"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="secondary" onClick={() => setModalMode('none')}>
              Cancel
            </Button>
            <Button size="sm" disabled={!modalInput.trim() || isSubmitting} onClick={handleRenameItem}>
              {isSubmitting ? 'Renaming...' : 'Save Name'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        isOpen={modalMode === 'delete_confirm'}
        onClose={() => setModalMode('none')}
        title="Confirm Delete"
      >
        <div className="space-y-4 text-xs text-text-primary pt-1">
          <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg flex items-start gap-3">
            <AlertTriangle size={20} className="text-danger shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-danger">Permanent Deletion Warning</p>
              <p className="text-text-muted">
                Are you sure you want to delete {selectedPaths.size} selected item(s)? This operation cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="secondary" onClick={() => setModalMode('none')}>
              Cancel
            </Button>
            <Button size="sm" variant="danger" disabled={isSubmitting} onClick={handleDeleteItem}>
              {isSubmitting ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
