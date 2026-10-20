# Orbit Worker — Mobile Sales Workflow Implementation Plan

Implement and verify the mobile-optimized Sales workflow (`apps/orbit-worker/app/pos.tsx` and associated sales API clients) integrating with `core-desktop` authoritative sales services, enforcing idempotency, PIN authorization, and rigorous integrity checks.

## User Review Required

> [!IMPORTANT]
> - **Online-Only Enforcement**: Sales are processed strictly online through authenticated requests with idempotency keys. If offline, the POS blocks sales and explains that sales require desktop connectivity.
> - **Authoritative Totals & Stock**: Cart totals and stock checks are validated server-side by `core-desktop`. Client calculations display authoritative amounts returned upon success.
> - **Idempotency & Retry Safety**: Uses persistent idempotency keys (`Idempotency-Key` header) to prevent duplicate transactions during network retries or timeouts.

## Open Questions
- None.

## Proposed Changes

### Mobile Sales Workflow & POS Screen
- **[MODIFY]** [app/pos.tsx](file:///C:/dev/40Labs/apps/orbit-worker/app/pos.tsx): Enhance POS screen error handling, offline state guards, idempotency key preservation, and receipt rendering.
- **[MODIFY]** [src/features/sales/api.ts](file:///C:/dev/40Labs/apps/orbit-worker/src/features/sales/api.ts): Ensure proper error propagation and idempotency header injection.

### Automated Tests
- **[NEW]** [__tests__/SalesWorkflow.test.tsx](file:///C:/dev/40Labs/apps/orbit-worker/__tests__/SalesWorkflow.test.tsx): Unit tests covering cart operations, offline POS blocking, idempotency handling, and successful checkout flows.

## Verification Plan

### Automated Tests
- Run `pnpm --filter @40labs/orbit-worker typecheck`
- Run `pnpm --filter @40labs/orbit-worker test`

### Manual Verification
- Verify POS screen starts, allows product search, cart updates, customer selection, and PIN authorization checkout.
