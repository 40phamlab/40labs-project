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
