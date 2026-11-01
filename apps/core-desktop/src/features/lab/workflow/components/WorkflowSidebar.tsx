import React, { useState, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  Layers,
  GripVertical,
  PanelLeftClose,
  PanelLeftOpen,
  AlertTriangle,
  FolderTree
} from 'lucide-react';
import { getNodeTheme } from '../utils/nodeTheme';
import { useWorkflowStore } from '../store/workflowStore';
import { buildWorkflowTree, WorkflowTreeNode } from '../utils/buildWorkflowTree';
import type { LabWorkflowStepType } from '@40labs/types';

const STEP_LABELS: Record<string, string> = {
  sample_reception: 'Sample Reception',
  specimen_identification: 'Specimen Identification',
  preparation_processing: 'Preparation Processing',
  test_execution: 'Test Execution',
  observation_entry: 'Observation Entry',
  qc_check: 'QC Check',
  review_approval: 'Review & Approval',
  notes_attachments: 'Notes & Attachments',
  conditional_decision: 'Conditional Decision',
  repeat_rework: 'Repeat & Rework',
  report_finalization: 'Report Finalization',
};

const CATEGORIES = [
  { name: 'Intake', types: ['sample_reception', 'specimen_identification'] },
  { name: 'Preparation', types: ['preparation_processing'] },
  { name: 'Analysis', types: ['test_execution', 'observation_entry'] },
  { name: 'Quality Check', types: ['qc_check', 'review_approval'] },
  { name: 'Logic & Decision', types: ['conditional_decision', 'repeat_rework'] },
  { name: 'Output & Reporting', types: ['report_finalization'] },
  { name: 'Attachments & Notes', types: ['notes_attachments'] },
];

interface WorkflowSidebarProps {
  onCenterNode?: (nodeId: string) => void;
}

export const WorkflowSidebar: React.FC<WorkflowSidebarProps> = ({ onCenterNode }) => {
  const { addStep, nodes, edges, selectedNodeId, setSelectedNodeId, validationErrors } = useWorkflowStore();

  const [activeTab, setActiveTab] = useState<'palette' | 'structure'>('palette');
  const [isRailCollapsed, setIsRailCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Persist collapsed accordion state in localStorage
  const STORAGE_KEY = 'lab_workflow_collapsed_categories_v1';
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsedCategories));
    } catch {}
  }, [collapsedCategories]);

  const toggleCategory = (catName: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }));
  };

  const collapseAll = () => {
    const all: Record<string, boolean> = {};
    CATEGORIES.forEach((c) => { all[c.name] = true; });
    setCollapsedCategories(all);
  };

  const expandAll = () => {
    setCollapsedCategories({});
  };

  const handleAddWithAutoConnect = (stepType: LabWorkflowStepType) => {
    if (selectedNodeId) {
      const parentNode = nodes.find((n) => n.id === selectedNodeId);
      if (parentNode) {
        const pos = {
          x: parentNode.position.x + 280,
          y: parentNode.position.y,
        };
        addStep(stepType, pos);
        // Note: Edge auto-connection happens or can be hooked if needed
        return;
      }
    }
    addStep(stepType);
  };

  const tree = useMemo(() => {
    return buildWorkflowTree(nodes, edges, validationErrors);
  }, [nodes, edges, validationErrors]);

  if (isRailCollapsed) {
    return (
      <aside className="w-14 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-4 space-y-4 shrink-0 shadow-xs">
        <button
          onClick={() => setIsRailCollapsed(false)}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Expand Sidebar"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>
        <button
          onClick={() => { setIsRailCollapsed(false); setActiveTab('palette'); }}
          className={`p-2.5 rounded-lg transition-colors ${activeTab === 'palette' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          title="Palette"
        >
          <Layers className="w-5 h-5" />
        </button>
        <button
          onClick={() => { setIsRailCollapsed(false); setActiveTab('structure'); }}
          className={`p-2.5 rounded-lg transition-colors ${activeTab === 'structure' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          title="Structure Tree"
        >
          <FolderTree className="w-5 h-5" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shrink-0 shadow-xs">
      {/* Header with Tabs & Collapse Rail */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('palette')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'palette' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Palette
          </button>
          <button
            onClick={() => setActiveTab('structure')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'structure' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Structure
          </button>
        </div>

        <button
          onClick={() => setIsRailCollapsed(true)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Collapse to Icon Rail"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* TAB 1: PALETTE */}
      {activeTab === 'palette' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search step types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span>Drag to canvas or click</span>
              <div className="space-x-2">
                <button onClick={collapseAll} className="hover:underline">Collapse All</button>
                <span>&bull;</span>
                <button onClick={expandAll} className="hover:underline">Expand All</button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {CATEGORIES.map((cat) => {
              const filteredTypes = cat.types.filter((t) =>
                (STEP_LABELS[t] || t).toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (filteredTypes.length === 0 && searchQuery) return null;

              const isCollapsed = collapsedCategories[cat.name];
              const sampleTheme = getNodeTheme(filteredTypes[0]);

              return (
                <div key={cat.name} className="space-y-1.5">
                  <button
                    onClick={() => toggleCategory(cat.name)}
                    className="w-full flex items-center justify-between text-left px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${sampleTheme.badgeBg}`} />
                      <span>{cat.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({filteredTypes.length})</span>
                    </div>
                    {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-1 pl-3 border-l-2 border-slate-100 dark:border-slate-800 ml-2">
                      {filteredTypes.map((stepType) => (
                        <div
                          key={stepType}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/lab-step', stepType);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onClick={() => handleAddWithAutoConnect(stepType as LabWorkflowStepType)}
                          className="group flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all"
                          title="Click to add after selection or drag to canvas"
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                              {STEP_LABELS[stepType] || stepType}
                            </span>
                          </div>
                          <div className="p-1 rounded bg-slate-50 dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0">
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: STRUCTURE TREE */}
      {activeTab === 'structure' && (
        <div className="flex flex-col flex-1 overflow-hidden p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Workflow Graph Hierarchy</span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-mono">
              {nodes.length} nodes
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {nodes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No nodes in workflow. Add steps from the palette.
              </div>
            ) : (
              <>
                {tree.roots.map((root) => (
                  <TreeItem key={root.id} node={root} onSelectNode={(id) => {
                    setSelectedNodeId(id);
                    onCenterNode?.(id);
                  }} />
                ))}

                {tree.unconnected.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mb-2 block">
                      ⚠️ Unconnected Subgraphs ({tree.unconnected.length})
                    </span>
                    {tree.unconnected.map((node) => (
                      <TreeItem key={node.id} node={node} onSelectNode={(id) => {
                        setSelectedNodeId(id);
                        onCenterNode?.(id);
                      }} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

interface TreeItemProps {
  node: WorkflowTreeNode;
  onSelectNode: (nodeId: string) => void;
}

const TreeItem: React.FC<TreeItemProps> = ({ node, onSelectNode }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const theme = getNodeTheme(node.stepType);

  return (
    <div className="space-y-1">
      <div
        onClick={() => onSelectNode(node.nodeId)}
        className={`group flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
          node.isLoop ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200' : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
        }`}
      >
        <div className="flex items-center space-x-2 min-w-0">
          {node.children.length > 0 && !node.isLoop ? (
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="w-3.5" />
          )}

          {node.handleLabel && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${node.handleLabel === 'Yes' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {node.handleLabel}
            </span>
          )}

          <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate" title={node.label}>
            {node.label}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          {node.hasError && (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" title="Validation warning" />
          )}
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${theme.badgeBg} ${theme.badgeText}`}>
            {node.stepType}
          </span>
        </div>
      </div>

      {isExpanded && node.children.length > 0 && !node.isLoop && (
        <div className="pl-4 border-l-2 border-slate-100 dark:border-slate-800 ml-3 space-y-1">
          {node.children.map((child) => (
            <TreeItem key={child.id} node={child} onSelectNode={onSelectNode} />
          ))}
        </div>
      )}
    </div>
  );
};
