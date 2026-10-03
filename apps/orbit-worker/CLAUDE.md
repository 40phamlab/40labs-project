# CLAUDE.md — 40Labs (standing context for coding agents)

40Labs = offline-first pharmacy / lab / dispensary platform for Tanzania, later an East-African healthcare data layer. Co-founders: Sairiamu (product owner) and Ade (engineering). Treat Sairiamu as the decision-maker; raise disagreements clearly, never silently implement something worse.

## Read before any task (in this order)
1. `apps/core-desktop/CONTEXT/04-CONVENTIONS.md` and `apps/core-desktop/GOTCHAS.md` — always.
2. The SPEC file for your feature: `apps/core-desktop/CONTEXT/SPEC/<feature>.md` (check status in `00-SPEC-INDEX.md`; do not touch 🔴 specs without an explicit unblock).
3. LAN / Orbit Worker work only: `apps/core-desktop/CONTEXT/05-LAN-ORBIT.md`, `apps/core-desktop/CONTEXT/SPEC/lan-orbit-hub.md`, `docs/adr/0001-orbit-lan-hub.md`.
4. Product intent when unsure: `docs/prd/40Labs_PRD_v1_MVP.md`, `PROJECT.md`.

## Commands (run from repo root; pnpm 11.24.0 is pinned via `packageManager`)
- Install: `pnpm install --frozen-lockfile`
- TS tests (vitest, all workspaces): `pnpm test`
- Desktop typecheck + build: `pnpm --filter @40labs/core-desktop build`
- Run desktop app: `pnpm --filter @40labs/core-desktop tauri dev`
- Rust tests: `cargo test -p core-desktop`   (crate lives in `apps/core-desktop/src-tauri`)
- Rust lint: `cargo clippy -p core-desktop`  (do not fix pre-existing warnings you didn't cause; don't add new ones)
Baseline recorded 2026-10-02 on commit 651662a: `pnpm test` = 18 files / 78 tests passing. Rust tests could not be run in the setup environment — run them yourself and report real output.

## Layout
- `apps/core-desktop/` — ACTIVE. Tauri v2 + React 19 + TS. UI in `src/features/*`, API wrappers in `src/api/*Api.ts` (Tauri `invoke` + mock fallbacks), Rust in `src-tauri/src/{commands,services,repositories,models}`; schema is created in `src-tauri/src/db.rs`.
- `apps/orbit-worker, admin-web, amob, web-app/` — scaffolds. DO NOT build in them unless the prompt says so.
- `packages/types` (canonical shared types), `design-tokens`, `i18n`, `ui-components` (DOM-only, not usable in React Native), `api-client` (stub). `services/api-core` is empty; no REST layer exists yet.
- `infra/db/` — verify which schema source is authoritative before changing tables (see Ask-first).
- `tests/` — root vitest feature tests.

## Architecture facts you can't infer quickly
- Layering is `commands/` (Tauri entry) → `services/` (business rules) → `repositories/` (sqlx/SQLite). Put rules in services, never in commands, so every entry point (Tauri invoke today, LAN HTTP for Orbit next) shares them.
- SQLite is the single source of truth; nothing may require internet. Cloud sync is later and silent.
- Customer, Medicine, Inventory exist once and are shared by every module.

## Hard rules (never)
- Never trust the frontend for authorization. PIN-gated actions (refund, stock adjustment, PO approval, interaction override, device block/remove, PIN/password change) are enforced server-side in services, on every surface.
- Audit log is write-once: INSERT only, never UPDATE/DELETE. Every PIN-gated action writes exactly one audit row in the same transaction as the action. See GOTCHAS #9.
- Every new table: `workspace_id` + `branch_id`. No exceptions.
- Rust: no `unwrap()`/`expect()` on production paths; propagate `Result`. TypeScript: strict, no `any`; import shared types from `@40labs/types`, never redefine.
- Design tokens only — no inline hex, font-family, or ad-hoc radius. Tailwind v4 needs `@source` for workspace packages (GOTCHAS #10).
- No secrets, PINs, tokens or credentials in logs, audit metadata, or error bodies.
- Do not call regulatory bodies by wrong names: TMDA (not TFDA); no NHIF in Tanzania copy.

## Phase tagging
Every new component/screen file starts with
`// [PHASE: MVP | POST-MVP | DEFERRED]` and `// [SPEC: CONTEXT/SPEC/<file>.md]`. TODOs: `TODO: [reason] [phase]`.

## Workflow
- Feature-sized work: propose design first (approach + one alternative + assumptions), wait for approval, then implement one layer at a time (types → repo → service → command/route → UI). Stop at the end of each prompt's scope for review.
- Bug fixes: confirm the bug against the code and quote line references before changing anything.
- Prefer small diffs over whole-file rewrites. No drive-by refactors.
- "Done" means: tests written for the happy path AND the edge cases in the prompt, `pnpm test` green, desktop build green, `cargo test -p core-desktop` green. Report exactly what you ran and the real output. If something couldn't be run, say so — never write "should pass".
- When you almost make a mistake worth remembering, append it to `apps/core-desktop/GOTCHAS.md` (append-only). Update `PROGRESS.md` when a milestone lands.

## Ask first (stop and ask Sairiamu)
- Adding any crate or npm package (name, why, alternative).
- Any schema change (and which schema source is authoritative).
- Any API endpoint not in a SPEC file.
- Anything in a 🔴 spec, or anything that contradicts a locked decision (e.g. AppearancePanel is dark/light toggle only).



# NOTE THIS

Staff phone companion to 40LabsCore. Talks ONLY to the pharmacy's desktop over the LAN. Read the root `CLAUDE.md` first; this file adds Orbit-specific rules. If they conflict, stop and ask.

## Read before any task (in order)
1. Root `CLAUDE.md`, `apps/core-desktop/GOTCHAS.md`, `apps/orbit-worker/GOTCHAS.md`
2. `apps/orbit-worker/CONTEXT/00-OVERVIEW.md` (scope, build order, open decisions)
3. `apps/orbit-worker/CONTEXT/01-ARCHITECTURE.md`, `02-DESIGN-TOKENS.md`, `03-SCREENS.md`
4. Hub side: `apps/core-desktop/CONTEXT/05-LAN-ORBIT.md`, `apps/core-desktop/CONTEXT/SPEC/lan-orbit-hub.md`, `docs/adr/0001-orbit-lan-hub.md`

## Package & commands (confirm the package name in apps/orbit-worker/package.json; expected `@40labs/orbit-worker`)
- Dev client (NOT Expo Go): `pnpm --filter @40labs/orbit-worker start`  (runs `expo start --dev-client`)
- Typecheck: `pnpm --filter @40labs/orbit-worker typecheck`
- Tests: `pnpm --filter @40labs/orbit-worker test`  (jest-expo + @testing-library/react-native; adding them is pre-approved, nothing else is)
- Health check: `npx expo-doctor`
Root `pnpm test` (vitest/jsdom) does not cover React Native code. Do not wire RN tests into root vitest.

## Hard rules
- Orbit is a thin client. The hub (desktop SQLite) is the only source of truth. Never compute stock, price, tax, fiscal, or permission outcomes on the phone.
- UI permission checks are cosmetic. The hub enforces permissions and PINs on every request. Never assume a hidden or disabled button is the only barrier.
- Device credential and pinned fingerprint live only in `expo-secure-store`. Never log, print, persist elsewhere, or put them in query strings, error messages, crash reports, or analytics. No analytics/crash SDKs without approval (health data).
- No `any`. TypeScript strict. Shared entity types come from `@40labs/types`, never redefined.
- Server state = React Query. Client/UI state = Zustand slices. Never mix them.
- Every user-facing string goes through i18n. Swahili (sw-TZ) is the default language, English secondary. No hard-coded copy.
- Design tokens only (02-DESIGN-TOKENS.md). No inline hex, font family, radius, or shadow values in components.
- Phase header on every new file: `// [PHASE: MVP | POST-MVP | DEFERRED]` and `// [SPEC: apps/orbit-worker/CONTEXT/03-SCREENS.md#<section>]`. TODOs: `TODO: [reason] [phase]`.
- Components are small and composable; no 300+ line files.
- A screen not covered by a mockup or by 03-SCREENS.md (cart, forms, PIN pad, error states) is NOT yours to improvise. In your design reply, propose a text wireframe and wait for approval.

## Workflow
1. Spike first (see 00-OVERVIEW build order, Spike S0). No feature work before the TLS-pinning spike result is reviewed.
2. Each feature is a vertical slice: spec entry for the hub route -> hub route + test (Rust, under apps/core-desktop/src-tauri) -> `packages/api-client` method + types -> RN screen + tests. Do not build an Orbit screen against an endpoint that is not in a SPEC file.
3. Design reply first (approach, one alternative, assumptions), wait for approval, then implement. Stop at the end of each prompt's scope.
4. Done means: typecheck green, tests written (happy path + edge cases the prompt names), tested on a real Android device AND an iOS device/simulator against a real running desktop hub when the slice touches networking. Report exactly what you ran. If you couldn't run something, say so.

## Ask first
New dependencies (name, why, alternative), any schema change on the hub, any route not in a SPEC, any deviation from 01-ARCHITECTURE.md, any copy/label you had to invent.
