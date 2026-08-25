# 40LabsCore — Architecture Context

## Runtime shape
- Tauri v2 shell, React 18+ TypeScript strict mode (no `any`)
- Local SQLite is the ONLY source of truth for the running app. All reads/writes
  hit SQLite first, always, with zero exception for "just this once needs internet."
- Background sync process pushes queued changes to PostgreSQL silently.
  UI never blocks on sync. UI never shows a sync error as a blocking modal —
  sync status is a passive indicator only (see 02-DESIGN-TOKENS.md → sync states).

## State management (non-negotiable split)
- **Zustand**: local/UI state only (modal open/closed, active tab, form drafts,
  device pairing state). Slice-based — one slice per feature domain.
- **React Query**: ALL server/SQLite-backed state. Never store server data in
  Zustand. Never call SQLite directly from a component — always through a
  React Query hook that wraps a Rust/Axum-facing (or local Tauri command) call.
- If you're not sure which one owns a piece of state, ask: "does this survive
  a page refresh and come from data, or is it purely UI?" Data → React Query.

## Component rules
- No component file over ~400 lines. Split before it grows past that.
- Every component that reads shared entities (Customer, Medicine, Inventory)
  imports its shape from `packages/types` — never redefines an inline type
  that duplicates a canonical entity.
- Shared UI primitives (buttons, cards, inputs, tables) live in
  `packages/ui-components`, not copy-pasted per screen. If a component is
  used in 2+ of {Dashboard, Sales, Inventory, Purchases, Customers, Lab},
  it belongs in ui-components.

## PIN-gated actions
Every refund, stock adjustment, PO approval, and interaction override:
1. Frontend shows PIN prompt (UI convenience only)
2. Actual authorization check happens server-side (Rust/Axum middleware)
   — frontend PIN entry is NEVER sufficient on its own, even for desktop-only
   flows, because Orbit Worker must enforce the identical rule.
3. On success, an immutable AuditLog entry is written. Frontend never has
   a code path that skips this.

## Offline behavior (every screen must state this explicitly in its spec)
Every SPEC/*.md file must answer: "what happens on this screen with zero
internet?" If the answer is "it breaks," that's a blocker, not a TODO.

## File/folder shape (within apps/core-desktop)
src/
  features/
    dashboard/
    inventory/
    sales/
    purchases/
    customers/
    lab/
    settings/
    scheduling/
    notifications/
  components/        (app-specific composites, not generic — generic goes to packages/ui-components)
  hooks/
  stores/            (zustand slices)
  queries/           (react-query hooks)
  lib/
  types/             (LOCAL-only types not worth promoting to packages/types yet)