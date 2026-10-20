# Orbit Worker — Repository Discovery and Architecture Audit Report

> [!NOTE]
> **Discovery Phase Only**: This document represents the architectural audit and repository discovery of `orbit-worker` and its integration boundary with `core-desktop` within the 40Labs monorepo. No features have been implemented, frameworks replaced, or refactored during this discovery.

---

## 1. Repository Architecture and Package Map

The `40Labs` monorepo (`40labs-monorepo`, version `0.1.0`) uses **pnpm workspaces** (`pnpm@11.24.0`, configured via `pnpm-workspace.yaml`) and **Turbo** (`turbo@2.0.0`).

### Package & App Inventory
- **`apps/core-desktop`**: Authoritative Tauri v2 desktop application (Rust backend with Axum/SQLx + React 19 / TypeScript frontend). Acts as the primary hub for business records, database persistence, transaction processing, and permission enforcement.
- **`apps/orbit-worker`**: Mobile operational companion client (React Native 0.86.3 + Expo ~57 / Expo Router ~57) for pharmacy and laboratory workers.
- **`apps/web-app`**: Web portal application (`Next.js`).
- **`packages/types`**: Canonical shared TypeScript domain types (`@40labs/types`).
- **`packages/design-tokens`**: Source of truth for brand, spacing, radius, typography, and dark/light color tokens (`@40labs/design-tokens`).
- **`packages/i18n`**: Internationalization package (`@40labs/i18n`).
- **`packages/ui-components`**: DOM-specific component library (`@40labs/ui-components`), explicitly marked as DOM-only (not compatible with React Native).
- **`packages/api-client`**: Shared API client stub (`@40labs/api-client`).

---

## 2. Current Orbit Worker Implementation Status

`orbit-worker` is currently scaffolded with a robust set of UI mockups, screen skeletons, and state primitives, but requires integration with the desktop hub.

### Implemented vs. Scaffolding Status
- **Navigation & Shell**: 4-tab bottom navigation (`/(tabs)/index`, `/(tabs)/history`, `/(tabs)/notifications`, `/(tabs)/settings`), plus stack screens (`pair`, `pos`, `stock`, `lab-sample`, `lab-result`, `outbox`, `gallery`).
- **Design System & Theming**: Integrated with `@40labs/design-tokens` and `ThemeProvider` supporting dark/light switching (persisted via `expo-sqlite`).
- **Connection & State Management**: `useConnectionStore` (Zustand) managing connection states (`unpaired`, `connecting`, `connected`, `unreachable`, `revoked`), periodic heartbeats, NetInfo monitoring, and AppState monitoring.
- **Offline & Outbox**: SQLite-backed outbox (`db/outbox.ts`, `lib/outbox-sync.ts`) for queued idempotent writes (`stock_receipt`, `lab_sample`, `lab_result`, `customer_create`). Sales are explicitly excluded from outbox queueing.
- **Pairing & Security**: QR code scanning (`expo-camera`, `expo-image-picker`), QR payload parsing (`lib/qr-parser.ts`), and secure token storage (`expo-secure-store`).

---

## 3. Desktop Business-Workflow Map

The desktop system (`core-desktop`) implements rich domain services and SQLite repositories across several core domains:

| Workflow Domain | Desktop Screen / Feature | Domain Model & IDs | Business Service / Repository | Required Validation & Permissions | Persistence & Sync |
|---|---|---|---|---|---|
| **Sales & POS** | `SalesScreen.tsx` | `Sale`, `SaleItem`, `sale_id` | `SalesService` / `SalesRepository` | `can_create_sale`, stock availability check, fiscalization | SQLite `sale`, `sale_item`, idempotent keys |
| **Sample Collection & Lab** | `LabScreen.tsx`, `LabSampleModal` | `LabOrder`, `LabSample`, `lab_order_id` | `LabService` / `LabRepository` | `can_add_lab_sample`, `can_record_lab_result` | SQLite `lab_sample`, `lab_order` |
| **Customers / Patients** | `CustomersScreen.tsx` | `Customer`, `customer_id` | `CustomerService` / `CustomerRepository` | `can_manage_customers`, unique phone constraint | SQLite `customer` |
| **Inventory & Stock** | `InventoryScreen.tsx`, `NewStockModal` | `Medicine`, `InventoryItem`, `inventory_item_id` | `InventoryService` / `InventoryRepository` | `can_update_stock`, batch/expiry validation | SQLite `inventory_item`, `medicine` |
| **User Identities & Roles** | `UsersScreen.tsx`, `DevicesPanel.tsx` | `AppUser`, `PairedDevice`, `device_id` | Auth Engine / `DeviceRepository` | Role-based authorization (`sudo`, `staff`), device status (`active`, `blocked`, `revoked`) | SQLite `app_user`, `paired_device` |
| **Audit Logs & Sync** | Audit Trail view | `AuditLogEntry`, `audit_id` | `AuditRepository` | Write-once insert immutability | SQLite `audit_log` (INSERT only) |

---

## 4. Existing Connection and Authorization Design

### Network & Transport Mechanism
- **LAN Communication**: Orbit Worker connects exclusively over the local network (LAN) to the desktop hub (Axum server running within the Tauri process).
- **Pairing Flow**: QR code scan provides `endpoint`, `sessionId`, `token`, and certificate fingerprint (`fp`). The phone calls `/api/pairing/pair`, receives a bearer credential, and stores it securely in `expo-secure-store`.
- **Authorization Enforcement**:
  - The desktop hub independently enforces permissions on every request via `auth_middleware` reading `device.permissions_json` from SQLite.
  - Hiding or disabling mobile UI buttons is strictly cosmetic; the desktop server rejects unauthorized requests with `403 Forbidden`.
- **Token & Device Revocation**: Heartbeat requests (`/api/v1/devices/me/heartbeat` and `/api/v1/devices/me`) verify device status (`active`, `blocked`, `revoked`). If revoked/blocked, the client transitions immediately to `revoked`.

---

## 5. Shared Colour-Token Integration Plan

- **Canonical Source**: `@40labs/design-tokens` (`packages/design-tokens/src/colors.ts`).
- **Policy Compliance**:
  - Orbit Worker uses `darkTokens` and `lightTokens` imported directly from `@40labs/design-tokens`.
  - No duplicate colour-token definitions are introduced in the mobile app.
  - Typography (`fonts`, `fontSizes`, `fontWeights`), spacing (`spacing`), and radius (`radius`) are sourced from `@40labs/design-tokens`.
  - Light/dark theme switching is fully supported via React Native context (`ThemeProvider`) and stored locally in SQLite (`orbit_theme.db`).

---

## 6. Proposed Mobile-Specific Component Structure

Orbit Worker maintains its own mobile component library tailored for touch interfaces and compact operational screens, while leveraging shared tokens:
- **Atoms/Primitives**: `Card`, `Chip`, `CountBadge`, `EmptyState`, `Fab`, `FabMenu`, `InlineError`, `PinPad`, `ScanFrame`, `ScreenHeader`, `StatusDot`, `Tile`, `BottomTabBar`.
- **Interaction Patterns**: Touch-optimized hit targets (minimum 48x48dp), bottom sheets / modals for data entry, QR scan viewfinders, offline status indicators, and outbox synchronization progress.

---

## 7. Prioritized MVP Scope for Sales and Sample Collection

1. **Pairing & Connection Health**: Reliable QR pairing, secure credential storage, and status monitoring (Active/Unreachable/Revoked).
2. **Home Dashboard & Today Metrics**: Read-only summary counts for sales, patients, samples, results, low stock, and alerts.
3. **Inventory & Stock Lookup**: Viewing stock levels, filtering by low stock / search.
4. **Stock Receipt (Add Stock)**: Idempotent offline-capable write through outbox.
5. **Sample Collection & Lab Results**: Collecting lab samples and recording results via outbox queueing.
6. **Customer / Patient Management**: Adding patients with duplicate-phone handling.
7. **Sales & POS**: Direct online execution of sales with idempotency keys (sales are never queued offline).
8. **Staff Notifications**: Receiving broadcast/role/direct notifications and sending alerts/broadcasts.

---

## 8. Security, Multi-User, Offline, and Synchronization Gaps

- **TLS Pinning**: Implementation of certificate pinning on the mobile side matching the hub's self-signed certificate fingerprint (`fp`).
- **Outbox Conflict Handling**: Managing 4xx errors (non-retryable permanent failures) vs 5xx / network errors (exponential backoff with jitter).
- **Multi-Device Isolation**: Ensuring each paired device maintains isolated secure storage credentials and strict workspace/branch scoping.
- **PIN Authorization**: Ensuring any sensitive operational triggers on mobile properly handle server-side PIN challenges or privilege checks.

---

## 9. Existing Tests and Commands Needed for Verification

### Verification Commands
- **Root Tests**: `pnpm test` (Vitest unit tests across workspace).
- **Core Desktop Build**: `pnpm --filter @40labs/core-desktop build`
- **Core Desktop Tauri Dev**: `pnpm --filter @40labs/core-desktop tauri dev`
- **Rust Tests**: `cargo test -p core-desktop` (run inside `apps/core-desktop/src-tauri`)
- **Orbit Worker Typecheck**: `pnpm --filter @40labs/orbit-worker typecheck`
- **Orbit Worker Tests**: `pnpm --filter @40labs/orbit-worker test` (`jest-expo` + `@testing-library/react-native`)

---

## 10. Exact Files Likely to Require Changes

- `apps/orbit-worker/src/stores/connection.ts`: Enhance error handling and token refresh/revocation flows.
- `apps/orbit-worker/src/lib/outbox-sync.ts`: Refine outbox retry logic and error classification.
- `apps/core-desktop/src-tauri/src/services/lan/router.rs`: Ensure robust endpoint coverage and strict permission validation.
- `apps/orbit-worker/app/pos.tsx`, `lab-sample.tsx`, `stock.tsx`: Wire up API integration with error states and offline guards.

---

## 11. Phased Implementation Plan

1. **Phase 1: Hub & Transport Verification**: Verify Axum LAN server, TLS pairing handshake, and device authentication middleware.
2. **Phase 2: Core Read Workflows**: Validate Home dashboard metrics, Stock lookup, and History screens.
3. **Phase 3: Operational Write Workflows (Outbox)**: Integrate Stock receipts, Lab sample collection, and Customer creation with the offline outbox.
4. **Phase 4: Sales & POS Integration**: Finalize online POS transaction flow with idempotency and error handling.
5. **Phase 5: End-to-End Verification**: Run full test suites (`pnpm test`, `cargo test`, `jest`), and verify on physical Android/iOS devices against running desktop hub.
