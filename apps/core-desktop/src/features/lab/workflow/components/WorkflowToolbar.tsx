import React, { useState, useRef, useEffect } from 'react';
import {
  Save,
  Play,
  CheckCircle,
  Download,
  Upload,
  LayoutGrid,
  Undo2,
  Redo2,
  MoreHorizontal,
  ArrowLeft
} from 'lucide-react';
import { Button, Badge } from '@40labs/ui-components';
import { useWorkflowStore } from '../store/workflowStore';

interface WorkflowToolbarProps {
  onBackToList: () => void;
  onExportClick: () => Promise<void>;
  onImportClick: () => Promise<void>;
  onPublishClick: () => Promise<void>;
}

export const WorkflowToolbar: React.FC<WorkflowToolbarProps> = ({
  onBackToList,
  onExportClick,
  onImportClick,
  onPublishClick,
}) => {
  const {
    workflowName,
    workflowStatus,
    isDirty,
    lastSavedAt,
    setWorkflowName,
    saveCurrentWorkflow,
    validateWorkflow,
    applyAutoLayout,
    undo,
    redo,
    historyIndex,
    history,
    validationErrors,
  } = useWorkflowStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(workflowName);
  const [showOverflow, setShowOverflow] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNameInput(workflowName);
  }, [workflowName]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setShowOverflow(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNameSubmit = () => {
    setIsEditingName(false);
    if (nameInput.trim()) {
      setWorkflowName(nameInput.trim());
    } else {
      setNameInput(workflowName);
    }
  };

  const isPublished = workflowStatus === 'published';

  return (
    <header className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-xs gap-4">
      {/* Left: Back & Inline Editable Title */}
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <button
          onClick={onBackToList}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          title="Back to Workflows"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex-1 flex items-center space-x-2">
          {isEditingName && !isPublished ? (
            <input
              autoFocus
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSubmit();
                if (e.key === 'Escape') { setIsEditingName(false); setNameInput(workflowName); }
              }}
              className="text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 py-1 rounded border border-indigo-500 focus:outline-none w-full max-w-sm truncate"
            />
          ) : (
            <h1
              onClick={() => !isPublished && setIsEditingName(true)}
              className={`text-sm font-bold text-slate-900 dark:text-slate-100 truncate tracking-tight ${!isPublished ? 'cursor-pointer hover:text-indigo-600 transition-colors' : ''}`}
              title={isPublished ? `${workflowName} (Published - Read Only)` : 'Click to rename'}
            >
              {workflowName}
            </h1>
          )}

          <Badge variant={isPublished ? 'success' : 'warning'} className="shrink-0 text-[10px]">
            {isPublished ? 'Published' : 'Draft'}
          </Badge>

          {/* Dirty state & Save status */}
          <div className="hidden lg:flex items-center space-x-2 text-[11px] text-slate-400 shrink-0 font-mono">
            {isDirty && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Unsaved changes" />}
            {lastSavedAt && <span>Saved ✓ {new Date(lastSavedAt).toLocaleTimeString()}</span>}
          </div>
        </div>
      </div>

      {/* Right: Grouped Buttons & Overflow */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* File Group */}
        <div className="hidden md:flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => saveCurrentWorkflow()}
            disabled={isPublished}
            className="h-8 px-2.5 text-xs flex items-center space-x-1 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
            title="Save Draft (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Save</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onImportClick}
            disabled={isPublished}
            className="h-8 px-2.5 text-xs flex items-center space-x-1 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Import</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onExportClick}
            className="h-8 px-2.5 text-xs flex items-center space-x-1 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Export</span>
          </Button>
        </div>

        {/* Edit Group */}
        <div className="hidden lg:flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={undo}
            disabled={historyIndex <= 0 || isPublished}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1 || isPublished}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />
          <button
            onClick={applyAutoLayout}
            disabled={isPublished}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
            title="Auto Layout"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>

        {/* Check Group */}
        <Button
          variant="outline"
          size="sm"
          onClick={validateWorkflow}
          className="h-9 px-3 text-xs flex items-center space-x-1.5"
        >
          <CheckCircle className={`w-4 h-4 ${validationErrors.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
          <span className="hidden sm:inline">Validate</span>
          {validationErrors.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
              {validationErrors.length}
            </span>
          )}
        </Button>

        {/* Primary Publish Button (Never clipped) */}
        <Button
          variant="primary"
          size="sm"
          onClick={onPublishClick}
          className="h-9 px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 shadow-sm flex items-center space-x-1.5"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isPublished ? 'Published' : 'Publish'}</span>
        </Button>

        {/* Overflow Menu (⋯) for tight widths */}
        <div className="relative" ref={overflowRef}>
          <button
            onClick={() => setShowOverflow(!showOverflow)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden"
            title="More Actions"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showOverflow && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
              <button
                onClick={() => { setShowOverflow(false); saveCurrentWorkflow(); }}
                disabled={isPublished}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Save className="w-4 h-4 text-slate-500" />
                <span>Save Draft</span>
              </button>
              <button
                onClick={() => { setShowOverflow(false); onImportClick(); }}
                disabled={isPublished}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Import JSON</span>
              </button>
              <button
                onClick={() => { setShowOverflow(false); onExportClick(); }}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Export JSON</span>
              </button>
              <button
                onClick={() => { setShowOverflow(false); applyAutoLayout(); }}
                disabled={isPublished}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <LayoutGrid className="w-4 h-4 text-slate-500" />
                <span>Auto-layout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
