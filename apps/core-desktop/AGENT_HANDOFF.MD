# 40LabsCore — Agent Handoff

**Read this file first, before anything else in CONTEXT/SPEC/PROGRESS.md.**
This is the live "where are we right now" snapshot. PROGRESS.md is the
detailed checklist; this file is the fast-orientation summary a new
coding agent reads to get productive in one pass instead of re-deriving context from scratch.

Last updated: 2025-02-23 · Updated by: Codex AI Assistant

---

## Who's who
- **Sairiamu** — Founder, self-taught engineer (React/RN, Rust/Axum, OCI, Docker/K8s beginner, Tauri). Building 40Labs solo with Claude/Codex as co-founder/architect.
- **Codex / Ade** — AI assistant acting as co-founder/architect.

## What 40Labs is (one paragraph)
Offline-first pharmacy + lab + dispensary management platform for Tanzania/East Africa. 40LabsCore (Tauri desktop) is the current focus — the system of record. Full ecosystem (Orbit Worker, Admin Web App, aMob, public Web App) is documented but only 40LabsCore + Orbit Worker + Admin Web App are in MVP scope.

## Current build state (as of last update)
✅ Monorepo scaffolded — pnpm workspace + Turborepo.
✅ `apps/core-desktop` scaffolded — Tauri v2 + React 19 + TypeScript + Vite.
✅ Tailwind **v4** configured via `@theme` in `apps/core-desktop/src/App.css`.
✅ **Theme Architecture (Prompt 1)**: Unified `useThemeStore` persistence contract (`40labs_theme`), supporting light/dark themes with dynamic `color-scheme` and flash-free boot-time initialization in `main.tsx`. Unused competing `ThemeProvider.tsx` removed.
✅ **Design Tokens & Parity (Prompt 2)**: Comprehensive `[data-theme="light"]` token overrides in `tokens.css`, `panelSubtle` added, canonical card-radius standardized to `12px`, and parity tested via `tokens.test.ts`.
✅ **Component Reuse & Audit (Prompt 3)**: Shared UI components (`Button`, `Input`, `Dialog`, `Table`, `PageHeader`, `Tooltip`) audited and refactored to consume canonical design tokens without hardcoded hex values.
✅ **Responsive Application Shell (Prompt 4)**: `AppShell`, `Sidebar`, `AppSidebarNav`, `TitleBar`, and `TabContainer` optimized with proper `min-w-0`, `min-h-0`, three-state sidebar persistence, and single-scroll ownership.
✅ **Regression Pass & Build Verification (Prompt 5)**: All test suites executed successfully, and workspace build (`pnpm build`) completed with **0 TypeScript or build errors**.

## Next up (in order)
1. Inventory feature enhancements & sales/POS implementation.
2. Subsequent feature modules (Customers, Purchases, Lab, Dashboard, Settings).

## Locked decisions — do not relitigate these
- SUDO-only staff creation, no self-registration.
- Dashboard variant B confirmed (includes Customer Debt/Balance).
- AppearancePanel = dark/light toggle ONLY, no custom theming.
- Design direction = "Clinical Claymorphism" — soft shadow depth, solid surfaces.
- Tailwind v4 `@theme` configuration.
- `sqlx`, not `rusqlite`.
- Money = INTEGER (smallest unit).
- IDs = TEXT (UUID).
- `workspace_id`/`branch_id` inheritance.

---

## STANDING PROTOCOL
1. Read this file first in every session.
2. Update build state at the end of every meaningful session.
3. Keep this file concise for rapid orientation.
