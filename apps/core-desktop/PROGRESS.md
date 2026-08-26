# 40LabsCore — Build Progress Tracker

Update this file at the end of every work session. This is the single
place to check "where are we" without re-reading every SPEC file.

## Current phase
MVP — pre-implementation. No feature code written yet as of this file's
creation. `packages/types` not yet scaffolded.

## Build order status
- [ ] `packages/types` scaffolded
- [ ] `packages/design-tokens` scaffolded (mirrors CONTEXT/02-DESIGN-TOKENS.md)
- [ ] API design pass — services/api-core route contract (MVP + scale-shaped)
- [ ] SQLite schema — infra/db/sqlite-schema
- [ ] Inventory feature
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
   retry/expiry logic (open compliance question, needs direct TRA confirmation
   per PRD/business docs).

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

6. Literal skeuomorphic elements (e.g. a physical-switch-style dark/light
   toggle) vs pure shadow-based depth language, no literal metaphors —
   blocks final AppearancePanel toggle component design. Default assumption
   (per Ade, pending confirmation): pure shadow language, no literal switch.