import { describe, test, expect } from 'vitest';
import { buildWorkflowTree } from '../buildWorkflowTree';

describe('buildWorkflowTree Pure Function', () => {
  test('handles empty graph', () => {
    const result = buildWorkflowTree([], [], []);
    expect(result.roots).toEqual([]);
    expect(result.unconnected).toEqual([]);
  });

  test('builds linear tree correctly', () => {
    const nodes = [
      { id: '1', type: 'labNode', position: { x: 0, y: 0 }, data: { label: 'Step 1', stepType: 'sample_reception' } },
      { id: '2', type: 'labNode', position: { x: 100, y: 0 }, data: { label: 'Step 2', stepType: 'test_execution' } },
    ];
    const edges = [
      { id: 'e1', source: '1', target: '2' },
    ];

    const result = buildWorkflowTree(nodes, edges, []);
    expect(result.roots.length).toBe(1);
    expect(result.roots[0].label).toBe('Step 1');
    expect(result.roots[0].children.length).toBe(1);
    expect(result.roots[0].children[0].label).toBe('Step 2');
  });

  test('detects cycles and marks as loop without infinite recursion', () => {
    const nodes = [
      { id: '1', type: 'labNode', position: { x: 0, y: 0 }, data: { label: 'Exec', stepType: 'test_execution' } },
      { id: '2', type: 'labNode', position: { x: 100, y: 0 }, data: { label: 'Rework', stepType: 'repeat_rework' } },
    ];
    const edges = [
      { id: 'e1', source: '1', target: '2' },
      { id: 'e2', source: '2', target: '1' }, // loop back
    ];

    const result = buildWorkflowTree(nodes, edges, []);
    expect(result.roots.length).toBe(1);
    const root = result.roots[0];
    expect(root.children.length).toBe(1);
    const child = root.children[0];
    expect(child.children.length).toBe(1);
    expect(child.children[0].isLoop).toBe(true);
    expect(child.children[0].label).toContain('↺ back to');
  });

  test('handles disconnected subgraphs', () => {
    const nodes = [
      { id: '1', type: 'labNode', position: { x: 0, y: 0 }, data: { label: 'Connected 1', stepType: 'sample_reception' } },
      { id: '2', type: 'labNode', position: { x: 100, y: 0 }, data: { label: 'Connected 2', stepType: 'test_execution' } },
      { id: '3', type: 'labNode', position: { x: 300, y: 0 }, data: { label: 'Isolated', stepType: 'qc_check' } },
    ];
    const edges = [
      { id: 'e1', source: '1', target: '2' },
    ];

    const result = buildWorkflowTree(nodes, edges, []);
    expect(result.roots.length).toBe(1);
    expect(result.unconnected.length).toBe(1);
    expect(result.unconnected[0].label).toBe('Isolated');
  });
});
