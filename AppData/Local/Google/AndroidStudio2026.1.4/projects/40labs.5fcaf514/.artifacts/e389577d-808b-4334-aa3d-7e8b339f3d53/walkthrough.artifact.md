# Lab Workflow Builder & Execution Engine Walkthrough

Successfully implemented the deterministic Lab Workflow Builder and Execution Engine for `apps/core-desktop`.

## Changes Made

### 1. Types & Models
- **[packages/types/src/lab-workflow.ts]**: Defined step types enum (`registration`, `collection`, `receive`, `process`, `qc_check`, `result_entry`, `review`, `report_draft`, `notify`, `forward_report`), auto-actions whitelist (`set_expiry_from_catalog`, `create_notification`, `create_report_draft`, `assign_to_role`, `advance_on_complete`), template, run, and step interfaces.

### 2. Validation & Engine Core
- **[validateGraph.ts]**: Graph validation enforcing single start node, reachability, no disallowed cycles (except rework from review/qc back to process), at least one `result_entry` and terminal node, and branch termination.
- **[engine/advance.ts]**: Deterministic state machine executor with idempotent `advance()`, whitelist auto-actions execution, sample expiry blocking check, and default workflow fallback (`registration → collection → receive → process → result_entry → review → report_draft`).

### 3. Workflow Builder & API
- **[WorkflowBuilder.tsx]**: XYFlow canvas in Test Catalog Tab Container with step palette, node properties panel (assigned role, whitelist auto-actions), and publish validation feedback.
- **[labWorkflowApi.ts]**: CRUD for workflow templates, publishing endpoint, run execution, and step completion.

### 4. Integration
- **[LabScreen.tsx]**: Added "Configure Workflow" action in Test Catalog table to open the Workflow Builder for any test.

## Verification Results

### Automated Tests
- `validateGraph.test.ts`: Passed all validation rules (linear flow, missing result entry, orphans, rework edges).
- `advance.test.ts`: Passed idempotency, expired sample blocking, and invalid template default fallback tests.
