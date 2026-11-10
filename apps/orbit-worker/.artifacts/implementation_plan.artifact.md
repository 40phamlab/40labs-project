# Implementation Plan — Orbit Worker End-to-End Workflows (Sales, Lab, Stock)

Make Make-a-Sale, Collect Sample, Record Lab Result, View Stock and Stock Detail work end-to-end against the real hub.

## User Review Required

> [!IMPORTANT]
> **PIN Step Removal**: The POS checkout PIN pad has been removed because the hub (`sales_handlers.rs`) does not require or validate a step-up token/PIN for sales. Checkout proceeds directly on confirmation.

## Proposed Changes

### 1. Sales Workflow (`apps/orbit-worker/src/features/sales`)
- **`api.ts` & `PosScreen.tsx`**:
  - Generate Idempotency-Key *once* when "Confirm" is clicked and store in `idempotencyKeyRef`. Reuse the same key on retry (timeout or retryable failure).
  - Reset `idempotencyKeyRef` on successful sale completion or "New Sale".
  - Implement robust error mapping in `executeCheckout`: catch network/offline errors, 401/403 auth errors, 409 stock/conflict errors, 422 validation errors, and 5xx server errors, surfacing the hub's actual error message instead of masking with "Sales are online only".
- **`CartSheet.tsx` / `PosScreen.tsx`**:
  - Separate inner cart contents from `BottomSheet` Modal wrapper so wide/tablet screens render the cart inline in `cartPane` without triggering a full-screen mobile modal overlay.

### 2. Lab Sample & Result Workflow (`apps/orbit-worker/app/lab-sample.tsx`, `apps/orbit-worker/app/lab-result.tsx`)
- **`lab-sample.tsx`**:
  - Auto-suggest sample label (e.g., `SAMPLE-{shortId}` or `ORD-{id}`) while keeping it fully editable.
  - Optimistically remove or update pending orders after queuing sample collection so they disappear immediately from the pending list.
- **`lab-result.tsx`**:
  - Ensure correct status filtering (`sample_collected`), required result notes, and proper transition to `report_ready` / `completed`.

### 3. Stock & Stock Detail (`apps/orbit-worker/app/stock.tsx`, `src/features/stock`)
- Verify and ensure end-to-end stock search, low-stock filter, stock card display, and `StockDetailModal` details function seamlessly.

## Verification Plan

### Automated Tests
- Run `pnpm --filter @40labs/orbit-worker test` covering sales workflow, lab sample workflow, and stock workflows.
- Add unit/integration test cases verifying idempotency key reuse on retry and correct error message surfacing.

### Manual Verification
- Deploy/run against local hub and test POS sale, sample collection, lab results, and stock view.
