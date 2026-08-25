# 40LabsCore — Desktop App Context

**Product:** 40LabsCore (Pharmacy Desktop — the hub)
**Stack:** Tauri v2 + React + TypeScript (strict) + TailwindCSS
**Status:** MVP build in progress
**Owner:** Sairiamu (Founder) · Ade (Claude, co-founder/architect)

## What this app is
The system of record for a single pharmacy/lab business. Runs POS, inventory,
dispensing, lab module, customer records, purchases, reporting, and settings.
Every other 40Labs surface (Orbit Worker, Admin Web App, future aMob/Web App)
reads from or is authorized by what happens here.

## What this app is NOT (right now)
- Not a login/signup product yet — auth screens are explicitly deferred
  (see SPEC/deferred-auth.md). We build straight to feature dashboards.
- Not a live e-commerce storefront — e-pharmacy panel is a dormant config
  surface only (see SPEC/deferred-e-pharmacy.md).
- Not multi-branch yet — schema carries `workspace_id`/`branch_id` from day
  one, but the UI/UX for switching branches is v3.5.

## Source documents (do not duplicate, only reference)
- `/docs/prd/40Labs_PRD_v1_MVP.md` — requirements, P0/P1/P2, non-goals
- `/docs/business-mechanism/40Labs_Business_Mechanism_v1.md` — locked business logic
- `/docs/competetive-reports/` — market context, why features exist
- `packages/types` — canonical TS types (once built) — CONTEXT/03-DATA-MODEL.md is a summary only

## Build order (locked)
1. Inventory
2. Sales / POS
3. Customers
4. Purchases
5. Lab module (Orders → Samples → Results → Report)
6. Dashboard (reads from the above — build last)
7. Settings
8. Scheduling / Notifications / Reports (polish layer)

Auth screens and e-pharmacy are explicitly OUT of this order — see SPEC/ for why.