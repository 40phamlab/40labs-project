# Lab Workflows Architecture & Specification

## 1. Folder Location
Local filesystem persistence for workflow graph definitions is stored in the Tauri app data directory:
- **Path**: `<AppData>/40labs/workflows/<slug>.workflow.json`
- **Trash Directory**: `<AppData>/40labs/workflows/.trash/`

## 2. File Format (Schema v1)
Workflows are stored as standalone JSON files adhering to `schemaVersion: 1`:
```json
{
  "schemaVersion": 1,
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Blood / Hematology Workflow",
  "labCategory": "Hematology",
  "status": "draft",
  "version": 1,
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z",
  "nodes": [...],
  "edges": [...],
  "viewport": { "x": 0, "y": 0, "zoom": 1 },
  "meta": {}
}
```

## 3. Validation Rules
The workflow graph validator enforces strict laboratory process rules:
1. **Start Node**: Exactly one starting node (in-degree === 0).
2. **Execution Step**: Must contain at least one execution/result entry step (`test_execution`, `observation_entry`, or `result_entry`).
3. **End Node**: Must have at least one terminal node (`report_finalization`, `report_draft`, or out-degree === 0).
4. **Reachability**: All nodes must be reachable from the start node (no orphan nodes).
5. **Conditional Decision**: `conditional_decision` nodes must have both `Yes` and `No` outgoing branches connected (`sourceHandle === 'yes'` and `sourceHandle === 'no'`).
6. **Cycles & Loops**: Cycles are strictly prohibited except when originating from `repeat_rework` or allowed review rework loops.
7. **Quality Sequence**: `qc_check` must precede `review_approval` in the workflow path.

## 4. Node Categories & Theme Mapping (`nodeTheme.ts`)
- **Intake**: Blue (`sample_reception`, `specimen_identification`, `registration`, `collection`, `receive`)
- **Preparation**: Amber (`preparation_processing`, `process`)
- **Analysis**: Green (`test_execution`, `observation_entry`, `result_entry`)
- **Quality Check**: Purple (`qc_check`, `review_approval`, `review`)
- **Logic & Decision**: Orange (`conditional_decision`, `repeat_rework`)
- **Output & Reporting**: Teal (`report_finalization`, `report_draft`, `notify`, `forward_report`)
- **Attachments & Notes**: Gray (`notes_attachments`)
- **Unknown**: Rose/Gray fallback for unrecognized step types.
