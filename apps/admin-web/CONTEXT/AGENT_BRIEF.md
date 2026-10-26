# Admin Web App: Agent Brief (read first, every session)

## What this is
Internal 40Labs web app. Read-mostly. Lets the team see registered businesses, simple platform metrics, sync state, and infra health/logs.
NOT in scope: org portal, gov portal, document upload/Compliances, billing, patient-level data, any editing of business data.

## Hard rules
1. **Only write action in the whole app: business verification decision** (verify / reject / suspend). Everything else is GET.
2. **No per-patient data. Ever.** Aggregates only (PRD P0-14). No customer names, phones, or prescriptions in any endpoint or screen.
3. **core-desktop is read-only for you.** You may READ and COPY from `apps/core-desktop` (shell, sidebar, tabs, tables, KPI tiles, styles) into `apps/admin-web/src/_copied/`. You may NOT edit, move, rename, delete, or reformat anything under `apps/core-desktop`, nor `packages/ui-components`. Run `git diff --stat -- apps/core-desktop packages/ui-components` before every commit; it must be empty.
   - Use as-is (import, never copy): `packages/design-tokens`, `packages/types`.
   - Copied files: strip Tauri imports (`@tauri-apps/*`), add header `// COPIED FROM: <original path>`.
   - Speed over purity: if something takes >30 min, simplify and log it under Deviations.
4. Tailwind v4 via `@theme` CSS. There is NO tailwind.config.js. Do not create one.
5. Design tokens locked: green #16A34A, orange #F97316, danger #EF4444, surface #F8FAFB, Sora (headings), Inter (UI), JetBrains Mono (ids, numbers, logs). Card radius 12px, input radius 8px. Dark mode via existing `darkColors`.
6. TypeScript strict, no `any`. Rust: `Result<>`, no `unwrap()` in non-test paths.
7. Server state = React Query only. Zustand = UI state only (sidebar collapsed, filters). Never mix.
8. Admin API = a router inside `services/api-core` under `/admin/v1`. Do not create a new service.
9. Auth: separate `admin_users` table, email + password + **mandatory TOTP**. Not the pharmacy PIN system.
10. Every admin write goes to the immutable audit log. No update/delete on that table.
11. Every new Postgres table carries `workspace_id` + `branch_id` where it relates to business data. Admin-only ops tables (health, logs, admin_users) are platform-level and exempt; note this in the migration comment.
12. Tag every new file with its phase in a header comment: `// PHASE: Admin-A`.

## Stack
Vite + React 19 + TS, react-router, @tanstack/react-query, zustand, recharts, Tailwind v4.
Location: `apps/admin-web`. Package name: `@40labs/admin-web`.

## Data sources (already exist from sync Phase 2A)
Postgres: `cloud_*` mirror tables, `sync_changes`, `sync_devices`. Business column for TMDA is `tmda_number`.
Sync entities: stock, price, business, daily_summary.

## Definition of done (every task)
- Typechecks, lint clean, runs against real api-core (not only mock)
- Loading, empty, and error state for every data view
- No console errors; works at 1280px and 1920px
- Endpoint documented in `ADMIN_API_SPEC.md` before it is merged
- Read all files in `apps/admin-web/CONTEXT/` at the start of each session.
- If something takes more than ~30 minutes to get right, simplify it and note it under "Deviations" instead of polishing.
