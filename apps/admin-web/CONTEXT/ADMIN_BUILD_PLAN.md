# Admin Web Build Plan

Work strictly in order. Stop at each checkpoint and report what was done, what was skipped, and why. Do not start a phase before the previous checkpoint is accepted.

## Admin-A: Foundation
1. Scaffold `apps/admin-web` (Vite/React19/TS strict), wire pnpm + Turborepo, import design tokens, Tailwind v4 @theme, fonts.
2. Extract the sidebar/shell/tab/table/KPI primitives from core-desktop into `packages/ui-components` where not already shared. Admin and desktop must both render with the extracted versions, so verify desktop is not broken2. Copy the sidebar, shell, tab, table, and KPI primitives from core-desktop into `src/_copied/`. Strip Tauri coupling. Do not edit core-desktop or packages/ui-components.
...
✅ Checkpoint A: log in with TOTP, see the shell with sidebar + tabs, empty pages routed.
3. Router, layout shell, theme toggle, React Query provider, API client (`src/lib/api.ts`) with typed errors.
4. Migration `0002_admin_ops.sql`, `admin` module skeleton in api-core, `/healthz`, `/readyz`.
5. Auth: seed CLI, login, TOTP enroll/verify, sessions, middleware, Account page, login page.
✅ Checkpoint A: log in with TOTP, see empty shell, desktop app still builds.

## Admin-B: Businesses + Overview
1. `/businesses` list + filters + search, detail page with Profile tab.
2. Verification decision (modal, reason, audit row, transaction).
3. Stock & Prices, Sync, Activity tabs.
4. Overview KPIs + needs-attention.
✅ Checkpoint B: verify a real synced business end-to-end; audit row exists; no patient keys in any response (test passes).

## Admin-C: Infra
1. Health prober + `infra_health_checks` + Health tab.
2. Heartbeat endpoint + desktop sender (small change in the sync module; flag any desktop edits to me before merging) + Heartbeats tab.
3. `ops_events` tracing layer + Logs tab + live toggle.
4. Sync page (Devices / Recent Changes / Failures).
✅ Checkpoint C: kill the DB locally, so Health goes red within 2 minutes, then recovers; a failed sync push shows in Logs; redaction test passes.

## Admin-D: Analytics + hardening
1. Revenue / Products / Growth endpoints + charts.
2. Indexes, 60s cache, empty-data states.
3. Security checklist from API spec, rate limits, CORS, cookie flags.
4. Seed script for realistic demo data so analytics are reviewable.
✅ Checkpoint D: full walkthrough; Lighthouse/a11y basics pass; docs updated.

## Deferred (do NOT build)
Compliances/document upload · org/gov portals · alerts via email/WhatsApp · SSE log stream · ML predictions · multi-admin roles beyond `admin` and `viewer` · i18n.
Shared-UI extraction into packages/ui-components (revisit post-MVP, after Admin-D).
## Report format after each phase
Files created/edited · endpoints added · migrations · tests run + results · deviations from spec (with reason) · open questions.
