# Orbit Worker — Mobile Foundation and Desktop Integration Implementation Plan

Implement the mobile application foundation, connection lifecycle, design tokens, UI components, API layer, and session security for Orbit Worker (`apps/orbit-worker`), connecting it to `core-desktop`.

## User Review Required

> [!IMPORTANT]
> - **Connection Lifecycle States**: Fully integrates pairing, active heartbeat monitoring, connection state transitions (`unpaired`, `connecting`, `connected`, `unreachable`, `revoked`), and NetInfo/AppState listeners.
> - **Design Tokens & Theme**: Leverages canonical `@40labs/design-tokens` with dynamic dark/light theme switching persisted in SQLite.
> - **Security & Session**: Enforces device-level authentication credentials in `expo-secure-store`, server-side permissions, and handles sign-out/clear-data cleanly without unpairing the device unnecessarily unless requested.

## Open Questions
- None. All specifications adhere to `apps/orbit-worker/CONTEXT/` and root `CLAUDE.md`.

## Proposed Changes

### Mobile App Foundation & Shell
- **[MODIFY]** [app/_layout.tsx](file:///C:/dev/40Labs/apps/orbit-worker/app/_layout.tsx): Ensure root layout, fonts, and theme providers correctly wrap all routes.
- **[MODIFY]** [app/(tabs)/_layout.tsx](file:///C:/dev/40Labs/apps/orbit-worker/app/(tabs)/_layout.tsx): Bottom tab navigation with active state and localized tab items.

### Design Tokens & Component Library
- **[MODIFY]** [src/components/](file:///C:/dev/40Labs/apps/orbit-worker/src/components/): Polish primitives (`Card`, `Chip`, `CountBadge`, `EmptyState`, `Fab`, `InlineError`, `ScreenHeader`, `StatusDot`, `Tile`, `BottomTabBar`) to ensure strict token consumption and accessibility.

### Connection & Session Lifecycle
- **[MODIFY]** [src/stores/connection.ts](file:///C:/dev/40Labs/apps/orbit-worker/src/stores/connection.ts): Robust connection monitoring, heartbeat, and revocation handling.
- **[MODIFY]** [app/(tabs)/settings.tsx](file:///C:/dev/40Labs/apps/orbit-worker/app/(tabs)/settings.tsx): Complete settings screen with server info, user/role details, language switcher, theme toggle, and outbox sync/clear data actions.

## Verification Plan

### Automated Tests
- Run `pnpm --filter @40labs/orbit-worker typecheck`
- Run `pnpm --filter @40labs/orbit-worker test` (Jest tests)

### Manual Verification
- Verify app starts and renders screens correctly.
- Test theme toggle and i18n language switching.
- Verify connection state representation and settings actions.
