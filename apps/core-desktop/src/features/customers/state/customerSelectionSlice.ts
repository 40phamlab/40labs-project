import { create } from 'zustand';

export type SelectionState =
  | { mode: 'ids'; ids: Set<string> }
  | { mode: 'allMatching'; excludedIds: Set<string> };

interface CustomerSelectionStore {
  selection: SelectionState;
  totalMatching: number;
  setTotalMatching: (total: number) => void;
  toggle: (id: string) => void;
  selectRange: (fromId: string, toId: string, orderedIds: string[]) => void;
  selectPage: (ids: string[]) => void;
  selectAllMatching: () => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
  isAllMatching: () => boolean;
  getCount: () => number;
  clearOnFilterChange: () => void;
}

export const useCustomerSelectionStore = create<CustomerSelectionStore>((set, get) => ({
  selection: { mode: 'ids', ids: new Set() },
  totalMatching: 0,
  setTotalMatching: (total) => set({ totalMatching: total }),
  toggle: (id) => {
    const { selection } = get();
    if (selection.mode === 'ids') {
      const newIds = new Set(selection.ids);
      if (newIds.has(id)) {
        newIds.delete(id);
      } else {
        newIds.add(id);
      }
      set({ selection: { mode: 'ids', ids: newIds } });
    } else {
      const newExcluded = new Set(selection.excludedIds);
      if (newExcluded.has(id)) {
        newExcluded.delete(id);
      } else {
        newExcluded.add(id);
      }
      set({ selection: { mode: 'allMatching', excludedIds: newExcluded } });
    }
  },
  selectRange: (fromId, toId, orderedIds) => {
    const fromIdx = orderedIds.indexOf(fromId);
    const toIdx = orderedIds.indexOf(toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const start = Math.min(fromIdx, toIdx);
    const end = Math.max(fromIdx, toIdx);
    const rangeIds = orderedIds.slice(start, end + 1);

    const { selection } = get();
    if (selection.mode === 'ids') {
      const newIds = new Set(selection.ids);
      rangeIds.forEach((id) => newIds.add(id));
      set({ selection: { mode: 'ids', ids: newIds } });
    } else {
      const newExcluded = new Set(selection.excludedIds);
      rangeIds.forEach((id) => newExcluded.delete(id));
      set({ selection: { mode: 'allMatching', excludedIds: newExcluded } });
    }
  },
  selectPage: (ids) => {
    const { selection } = get();
    if (selection.mode === 'ids') {
      const newIds = new Set(selection.ids);
      const allSelected = ids.every((id) => newIds.has(id));
      if (allSelected) {
        ids.forEach((id) => newIds.delete(id));
      } else {
        ids.forEach((id) => newIds.add(id));
      }
      set({ selection: { mode: 'ids', ids: newIds } });
    } else {
      const newExcluded = new Set(selection.excludedIds);
      ids.forEach((id) => newExcluded.delete(id));
      set({ selection: { mode: 'allMatching', excludedIds: newExcluded } });
    }
  },
  selectAllMatching: () => {
    set({ selection: { mode: 'allMatching', excludedIds: new Set() } });
  },
  clear: () => {
    set({ selection: { mode: 'ids', ids: new Set() } });
  },
  isSelected: (id) => {
    const { selection } = get();
    if (selection.mode === 'ids') {
      return selection.ids.has(id);
    }
    return !selection.excludedIds.has(id);
  },
  isAllMatching: () => {
    const { selection } = get();
    return selection.mode === 'allMatching' && selection.excludedIds.size === 0;
  },
  getCount: () => {
    const { selection, totalMatching } = get();
    if (selection.mode === 'ids') {
      return selection.ids.size;
    }
    return Math.max(0, totalMatching - selection.excludedIds.size);
  },
  clearOnFilterChange: () => {
    set({ selection: { mode: 'ids', ids: new Set() } });
  },
}));
