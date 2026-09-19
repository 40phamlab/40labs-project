# 40LabsCore — Build Progress Tracker

Update this file at the end of every work session. This is the single
place to check "where are we" without re-reading every SPEC file.

## Current phase
MVP — pre-implementation of first feature. UI components and shared
infrastructure baseline is now clean and type-checked.

## Build order status
- [x] `packages/types` scaffolded (canonical 15 entities)
- [x] `packages/design-tokens` scaffolded (claymorphic shadows + tailwind v4)
- [x] SQLite schema — infra/db/sqlite-schema (triggers validated, doc drift fixed)
- [x] Mock data layer — apps/core-desktop/src/lib/mockData.ts
- [x] UI Component library — packages/ui-components (strict resolution baseline)
- [ ] Inventory feature (Next)
- [ ] Sales/POS feature
- [ ] Customers feature
- [ ] Purchases feature
- [ ] Lab module feature
- [ ] Dashboard feature
- [ ] Settings feature
- [ ] Scheduling/Notifications feature

## Open decisions blocking specific work (do not silently resolve — ask)
1. Dark-mode surface palette — blocks packages/design-tokens completion.
2. Dashboard status donut (red ring) meaning — blocks dashboard.md build.
3. Discount PIN-gate threshold value — blocks sales-pos.md refund/discount logic.
4. Sign In/Role screen intent — blocks deferred-auth.md unblock (see that file).
5. Max offline fiscal buffering window with TRA — blocks FiscalReceipt outbox
   retry/expiry logic (open compliance question, needs direct TRA confirmation).
6. COMPONENTS_TEST/ build exclusion strategy — currently left in-tree.

## Known copy fixes queued (non-blocking, fix during build)
- "TFDA" → "TMDA" (Settings/Compliance panel)
- "NHIF" → TZ-appropriate reference (Settings/Compliance panel)
- "Doptors" → "Debtors" (Customers)
- "Paracatamol" → "Paracetamol" (sample data/mockups)

## Deferred (not in current sprint, tracked so nothing's forgotten)
- Sign In / Signup screens — see SPEC/deferred-auth.md
- e-pharmacy live panel — see SPEC/deferred-e-pharmacy.md
- Multi-branch UX — schema-ready, UI is v3.5
- AI analytics — schema-ready (data captured), features are Phase 2+
- Insurance/SHA claims — Phase 2+
- Regional (KE/UG/RW) compliance — Phase 3

## Completed Infrastructure Tasks
- [x] Monorepo scaffold (pnpm + turbo + cargo)
- [x] Tauri v2 / React 19 baseline
- [x] SQLite immutability triggers (audit_log)
- [x] Type resolution for strict pnpm mode
- [x] MedicineWithInventory canonicalization
- [x] Component Sandbox migration to COMPONENTS_TEST/
- [x] Cleanup of unused features/ v0 code (archived to features-v0/)
- [x] Clean baseline tsc pass (0 errors)
