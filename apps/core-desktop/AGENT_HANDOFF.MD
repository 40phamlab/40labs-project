# 40LabsCore — Agent Handoff

**Read this file first, before anything else in CONTEXT/SPEC/PROGRESS.md.**
This is the live "where are we right now" snapshot. PROGRESS.md is the
detailed checklist; this file is the fast-orientation summary a new
Claude session (or coding agent) reads to get productive in one pass
instead of re-deriving context from scratch.

Last updated: 2026-08-26 · Updated by: Ade (Claude)

---

## Who's who
- **Sairiamu** — Founder, self-taught engineer (React/RN, Rust/Axum, OCI,
  Docker/K8s beginner, Tauri). Building 40Labs solo with Claude as
  co-founder/architect. Prefers advice + paste-ready files over Claude
  pushing directly to GitHub (no GitHub connector active yet — see
  Environment Notes below).
- **Ade** — Claude, acting as co-founder/architect. Writes CONTEXT/SPEC
  docs, schema, types, and either paste-ready files or [AGENT PROMPT]
  blocks for a coding agent, depending on task size/risk.

## What 40Labs is (one paragraph)
Offline-first pharmacy + lab + dispensary management platform for
Tanzania/East Africa. 40LabsCore (Tauri desktop) is the current focus —
the system of record. Full ecosystem (Orbit Worker, Admin Web App, aMob,
public Web App) is documented but only 40LabsCore + Orbit Worker + Admin
Web App are in MVP scope. Source docs: `/docs/prd/40Labs_PRD_v1_MVP.md`,
`/docs/business-mechanism/`, `/docs/competetive-reports/`.

## Current build state (as of last update)
✅ Monorepo scaffolded — pnpm workspace + Turborepo, root
   package.json/pnpm-workspace.yaml/turbo.json/Cargo.toml all valid.
✅ `apps/core-desktop` scaffolded — Tauri v2 + React 19 + TypeScript + Vite.
✅ Tailwind **v4** (not v3 — deliberate choice, already installed clean).
   Config lives in CSS via `@theme`, NOT a `tailwind.config.js` — v4 has
   no config file. Entry: `apps/core-desktop/src/App.css`.
✅ `packages/design-tokens` — colors, typography, radius, spacing,
   elevation (claymorphic shadows) as both `.ts` exports and
   `tokens.css` (`@theme` block for Tailwind v4 consumption).
✅ `packages/types` — canonical TypeScript types, 15 entities, all
   carrying `workspace_id`/`branch_id` per the non-negotiable rule.
✅ `infra/db/sqlite-schema/migrations/0001_init.sql` — 23 tables,
   validated against a live SQLite engine, audit_log immutability
   triggers proven to block UPDATE/DELETE. Migration applied,
   `dev.db` exists, confirmed via `sqlx migrate info`.
✅ `sqlx` chosen over `rusqlite` (async fit with Tauri commands,
   compile-time query checking, same crate will drive Postgres sync
   later). Both `.env` files in place:
   - `infra/db/sqlite-schema/.env` → `DATABASE_URL=sqlite:dev.db`
   - `apps/core-desktop/src-tauri/.env` → `DATABASE_URL=sqlite:../../../infra/db/sqlite-schema/dev.db`
✅ `apps/core-desktop/src/lib/mockData.ts` — full mock-API seam,
   type-checked clean against `@40labs/types` (0 errors), covers all
   15 entities plus `getMockDashboardSummary()` computed aggregate.
   Every React Query hook should read from here until real Tauri
   commands exist.
✅ `pnpm tauri dev` confirmed working end-to-end.

## Next up (in order — do not reorder without asking Sairiamu)
1. **`packages/ui-components`** — Button, Card, Input, Toggle, KPITile
   with the 4 claymorphic elevation states (raised/hover/pressed/inset).
   Build standalone, prove the elevation tokens work, BEFORE wiring
   into any feature screen.
2. **Inventory feature** (`apps/core-desktop/src/features/inventory/`)
   — first real screen, reads from `mockData.ts`. Per
   `CONTEXT/SPEC/inventory.md`.
3. Then: Sales/POS → Customers → Purchases → Lab → Dashboard (built
   LAST, reads from everything above) → Settings.
4. `services/api-core` (Rust/Axum) is DEFERRED — build UI against mock
   data first, design real API routes once the UI reveals what shapes
   are actually needed. Do not start this prematurely.

## Locked decisions — do not relitigate these
- SUDO-only staff creation, no self-registration (auth SCREENS are
  deferred — see `CONTEXT/SPEC/deferred-auth.md` — but the RULE is locked).
- e-pharmacy panel is dormant config only in MVP, not a live storefront
  — see `CONTEXT/SPEC/deferred-e-pharmacy.md`.
- Dashboard variant B confirmed (includes Customer Debt/Balance).
- AppearancePanel = dark/light toggle ONLY, no custom theming.
- Design direction = "Clinical Claymorphism" — soft shadow depth, NOT
  literal skeuomorphism (no screws/rivets/hardware metaphors).
- Tailwind v4, not v3.
- `sqlx`, not `rusqlite`.
- Money = INTEGER (smallest unit), never REAL/float, everywhere.
- IDs = TEXT (UUID), never AUTOINCREMENT.

## Open decisions genuinely still blocking something (see PROGRESS.md for full list)
1. Dark-mode surface palette — blocks dark-mode elevation shadow values.
2. Dashboard status donut (red ring in original design) meaning — unresolved.
3. Discount PIN-gate threshold value — blocks sales-pos.md refund logic.
4. Max offline fiscal buffering window (TRA compliance question) —
   blocks FiscalReceipt retry/expiry logic.
5. Sign In/Role screen intent — blocks deferred-auth.md unblock.

## Environment notes for whoever picks this up
- Sairiamu is on Windows (PowerShell, OneDrive-synced desktop path,
  `C:\Users\User\OneDrive\Desktop\40Labs`), using WSL for some tooling.
- No GitHub connector active yet — Claude cannot push commits directly.
  Workflow is: Claude writes paste-ready files or [AGENT PROMPT] blocks
  in chat → Sairiamu pastes/commits manually. Re-check tool availability
  if this file says otherwise by the time you're reading it.
- pnpm v11.x in use. Had to run `pnpm approve-builds` once for esbuild
  (Tailwind's dependency) — supply-chain safety gate, not a real error.
- Root `Cargo.toml` workspace `members` currently = `["apps/core-desktop/src-tauri"]`
  only. Add `"services/api-core"` back to that array once that crate
  actually exists — don't forget, or a fresh `cargo build` will error.

---

## STANDING PROTOCOL — for any Claude session or coding agent reading this

**This section is an instruction to you, the AI, not documentation to skim.**

1. **At the start of every session working on 40LabsCore**, read this
   file first, in full, before touching CONTEXT/SPEC/PROGRESS.md or
   writing any code. This file tells you what to trust as current.

2. **At the end of every meaningful session** (a feature built, a
   decision locked, an environment change, a bug found), update the
   "Current build state," "Next up," and "Open decisions" sections
   above to reflect reality — not what was planned, what actually
   happened and was confirmed working. Update the "Last updated" line.

3. **Never silently resolve an item in "Open decisions."** If Sairiamu
   answers one mid-conversation, move it from Open Decisions into
   Locked Decisions in this same update — don't leave stale unresolved
   items sitting here after they're actually settled.

4. **If you discover this file is out of sync with the real repo state**
   (e.g. a feature marked ✅ here doesn't actually exist, or vice versa),
   say so explicitly to Sairiamu before proceeding — do not silently
   trust this file over what you can verify, and do not silently trust
   your own assumption over this file either. Flag the discrepancy,
   then update this file once the real state is confirmed.

5. **Keep this file short enough to read in one pass.** If a section
   is growing into paragraphs, that detail belongs in PROGRESS.md,
   GOTCHAS.md, or a SPEC file — link to it, don't duplicate it here.
   This file's job is orientation speed, not completeness.

6. **Sairiamu's stated preference:** advice, design thinking, and
   paste-ready files/[AGENT PROMPT] blocks over silent autonomous
   action. Don't create files unprompted, don't push to GitHub unless
   a connector is confirmed active, don't reorder the locked build
   sequence without asking. Full collaboration means visible
   collaboration — every material decision should be traceable to a
   point in the conversation where it was actually made, not assumed.

✅ packages/ui-components — Button, Card, Input, Toggle, KPITile, all
   using claymorphic elevation tokens, confirmed rendering correctly
   in a real Tauri window (screenshot-verified). Tailwind v4 requires
   an explicit @source directive in App.css to scan packages outside
   apps/core-desktop's own tree — see GOTCHAS.md #10.