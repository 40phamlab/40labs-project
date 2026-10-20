# Orbit Worker — Mobile Sample Collection Workflow Implementation Plan

Implement and verify the mobile-optimized Sample Collection workflow (`apps/orbit-worker/app/lab-sample.tsx` and associated lab API/outbox client) integrating with `core-desktop` authoritative lab services, offline caching, and outbox queuing for sample collection (`lab_sample`) and lab results (`lab_result`).

## User Review Required

> [!IMPORTANT]
> - **Outbox Queueing for Collection**: Sample collection actions are queued in the idempotent SQLite outbox (`lab_sample`), supporting offline queueing and automatic background syncing when the desktop hub is reachable.
> - **Cache Fallback**: Displays cached pending orders when offline, with clear connection status indicators.
> - **Authoritative Desktop Validation**: Desktop validates all sample orders, specimen identifiers, and state transitions (`pending` -> `collected`).

## Open Questions
- None.

## Proposed Changes

### Mobile Lab Sample Workflow & Screen
- **[MODIFY]** [app/lab-sample.tsx](file:///C:/dev/40Labs/apps/orbit-worker/app/lab-sample.tsx): Polish sample collection modal, validation, and offline cache display.
- **[MODIFY]** [src/features/lab/api.ts](file:///C:/dev/40Labs/apps/orbit-worker/src/features/lab/api.ts): Ensure correct outbox queueing and API error handling.

### Automated Tests
- **[NEW]** [__tests__/LabSampleWorkflow.test.tsx](file:///C:/dev/40Labs/apps/orbit-worker/__tests__/LabSampleWorkflow.test.tsx): Unit tests covering lab orders fetching, offline cache fallback, sample label validation, and outbox enqueueing.

## Verification Plan

### Automated Tests
- Run `pnpm --filter @40labs/orbit-worker typecheck`
- Run `pnpm --filter @40labs/orbit-worker test`

### Manual Verification
- Verify lab orders screen lists pending orders, allows selecting an order, entering a sample label, and queueing the sample in the outbox.
