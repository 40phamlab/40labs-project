import React, { useMemo, useEffect } from 'react';
import { ReactFlow, Controls, MiniMap, Background, BackgroundVariant, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore } from '../store/workflowStore';
import { LabNodeComponent } from './nodes/LabNodeComponent';
import { getNodeTheme } from '../utils/nodeTheme';

const nodeTypes = {
  labNode: LabNodeComponent,
};

export const WorkflowCanvas: React.FC = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNodeId,
    deleteSelected,
    undo,
    redo,
    addStep,
  } = useWorkflowStore();

  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  // Keyboard shortcut listener (Delete, Ctrl+Z, Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected, undo, redo]);

  const styledEdges = useMemo(() => {
    return edges.map((e) => ({
      ...e,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
      animated: e.selected || false,
      style: { stroke: e.selected ? '#6366f1' : '#cbd5e1', strokeWidth: e.selected ? 3 : 2 },
    }));
  }, [edges]);

  return (
    <div
      className="flex-1 h-full relative bg-slate-50 dark:bg-slate-950"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const stepType = e.dataTransfer.getData('application/lab-step');
        if (stepType) {
          const bounds = e.currentTarget.getBoundingClientRect();
          const position = {
            x: e.clientX - bounds.left - 110,
            y: e.clientY - bounds.top - 50,
          };
          addStep(stepType as any, position);
        }
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)}
        nodeTypes={memoizedNodeTypes}
        snapToGrid
        snapGrid={[16, 16]}
        fitView
      >
        <Controls className="!bg-white dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 !shadow-lg !rounded-xl overflow-hidden" />
        <MiniMap
          className="!bg-white dark:!bg-slate-900 !border !border-slate-200 dark:!border-slate-800 !rounded-xl !shadow-lg overflow-hidden !w-48 !h-32"
          nodeColor={(node) => {
            const stepType = node.data?.stepType as string;
            return getNodeTheme(stepType).colorHex;
          }}
          zoomable
          pannable
        />
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#cbd5e1" className="dark:opacity-20" />
      </ReactFlow>
    </div>
  );
};
