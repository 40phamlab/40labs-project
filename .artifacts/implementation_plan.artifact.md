# Orbit Worker — Multi-User Authorization and Secure Desktop Requests Implementation Plan

Verify and test multi-user authorization, secure pairing, session isolation, and permission-aware request handling in Orbit Worker (`apps/orbit-worker`) interacting with `core-desktop`.

## User Review Required

> [!IMPORTANT]
> - **Separation of Device Pairing and User Identity**: Device pairing establishes the secure LAN tunnel and device credential, while user identity and role permissions govern what operations the user can perform.
> - **Server-Side Enforcement**: All permissions (`can_create_sale`, `can_add_lab_sample`, `can_update_stock`, etc.) are validated authoritatively by `core-desktop` via `auth_middleware`.
> - **Session Cleanup**: Sign-out and cache clearing properly scrub session tokens and cached domain data without breaking device pairing credentials unless explicitly uninstalled/cleared.

## Open Questions
- None.

## Proposed Changes

### Automated Tests for Multi-User Auth & Security
- **[NEW]** [__tests__/MultiUserAuth.test.ts](file:///C:/dev/40Labs/apps/orbit-worker/__tests__/MultiUserAuth.test.ts): Unit tests verifying permission checks, secure store credential handling, session clearing on sign-out, and cache isolation across users.

## Verification Plan

### Automated Tests
- Run `pnpm --filter @40labs/orbit-worker typecheck`
- Run `pnpm --filter @40labs/orbit-worker test`

### Manual Verification
- Verify permission handling and sign-out cleanup behavior.
