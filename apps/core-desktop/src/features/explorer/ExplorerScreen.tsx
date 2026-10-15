import * as React from 'react';
import {
  FolderTree,
  FilePlus,
  FileText,
  RefreshCw,
  Eye,
  X,
  Layers,
  HardDrive
} from 'lucide-react';
import {
  PageViewport,
  PageHeader,
  PageToolbar,
  PageContent,
  Button,
  IconButton,
  Card,
  SearchInput,
  EmptyState,
  Badge
} from '@40labs/ui-components';
import { useFilePreviewContext } from '../../providers/FilePreviewProvider';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { convertFileSrc } from '@tauri-apps/api/core';

export const ExplorerScreen: React.FC = () => {
  const { previewState, selectFileTab, closeFileTab, openBlob } = useFilePreviewContext();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleOpenFile = async () => {
    setIsLoading(true);
    try {
      const selected = await openDialog({
        multiple: false,
        filters: [
          {
            name: 'Supported Documents & Media',
            extensions: ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'txt', 'csv', 'json', 'md', 'docx', 'xlsx', 'mp4', 'webm'],
          },
        ],
      });
      if (selected && typeof selected === 'string') {
        const fileName = selected.split(/[\\/]/).pop() || 'file';
        const fileUrl = convertFileSrc(selected);
        const resp = await fetch(fileUrl);
        const blob = await resp.blob();
        openBlob({
          fileName,
          blob,
          mimeType: blob.type,
        });
      }
    } catch (err) {
      console.warn('Failed to open file in Explorer', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOpenFiles = (previewState.files || []).filter((file) =>
    file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageViewport className="bg-app-bg h-full flex flex-col">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <FolderTree size={20} className="text-action-primary shrink-0" />
            <div>
              <h1 className="text-xl font-bold text-text font-heading tracking-tight">
                File Explorer Workspace
              </h1>
              <p className="text-xs text-text-muted font-normal mt-0.5">
                Central workspace file management and interactive document preview hub
              </p>
            </div>
          </div>
        }
      />

      <PageToolbar className="flex items-center justify-between gap-3 px-6 py-3 border-b border-border bg-panel/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <SearchInput
            placeholder="Filter open files and active documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            intent="primary"
            size="sm"
            leftIcon={<FilePlus size={15} />}
            onClick={handleOpenFile}
            disabled={isLoading}
          >
            Open File...
          </Button>

          <IconButton
            icon={<RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />}
            label="Refresh Workspace"
            intent="ghost"
            size="sm"
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 300);
            }}
          />
        </div>
      </PageToolbar>

      <PageContent className="flex-1 p-6 overflow-y-auto space-y-6">
        {/* Active Open Tabs Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-action-primary" />
              <h2 className="text-sm font-bold text-text-primary tracking-tight font-ui">
                Active Open Preview Tabs
              </h2>
              <Badge variant="neutral" size="sm">
                {previewState.files.length}
              </Badge>
            </div>
            {previewState.files.length > 0 && (
              <span className="text-xs text-text-muted">
                Click any tab card to focus in the preview modal
              </span>
            )}
          </div>

          {filteredOpenFiles.length === 0 ? (
            <Card className="p-8 border border-dashed border-border bg-panel/30">
              <EmptyState
                icon={<HardDrive size={32} className="text-text-muted" />}
                title={previewState.files.length === 0 ? 'No Files Currently Open' : 'No Matching Files Found'}
                action={
                  previewState.files.length === 0
                    ? {
                        label: 'Browse Files...',
                        onClick: handleOpenFile,
                      }
                    : undefined
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredOpenFiles.map((file, idx) => {
                const isSelected = previewState.isOpen && previewState.currentIndex === idx;
                return (
                  <div
                    key={file.url || `${file.fileName}-${idx}`}
                    onClick={() => selectFileTab(idx)}
                    className={`group relative p-4 rounded-lg border transition-all cursor-pointer flex flex-col justify-between h-32 select-none ${
                      isSelected
                        ? 'bg-panel border-action-primary ring-1 ring-action-primary/30 shadow-md'
                        : 'bg-panel/60 hover:bg-panel border-border hover:border-border-subtle shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-md bg-surface-hover text-action-primary shrink-0">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-text-primary truncate font-ui" title={file.fileName}>
                            {file.fileName}
                          </p>
                          {file.mimeType && (
                            <p className="text-[10px] text-text-muted truncate mt-0.5 font-mono">
                              {file.mimeType}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => closeFileTab(idx, e)}
                        className="w-5 h-5 flex items-center justify-center rounded text-text-muted hover:text-danger hover:bg-surface-hover transition-colors opacity-70 group-hover:opacity-100"
                        title={`Close ${file.fileName}`}
                        aria-label={`Close ${file.fileName}`}
                      >
                        <X size={12} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-text-muted">
                      {file.sizeBytes !== undefined ? (
                        <span className="font-mono">{(file.sizeBytes / 1024).toFixed(1)} KB</span>
                      ) : (
                        <span>Loaded</span>
                      )}
                      <span className="flex items-center gap-1 text-action-primary group-hover:underline font-semibold">
                        <Eye size={12} />
                        Preview
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PageContent>
    </PageViewport>
  );
};
