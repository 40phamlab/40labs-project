# SPEC — Lab Module

**Status:** 🟢 · **Phase:** MVP · **Priority: build with care — this is the moat**

## Purpose
Order → Sample → Result → Report, linked to the SAME Customer record and
(where applicable) the same prescription/Sale used by the pharmacy side.
No competitor in the region offers this at SME scale (competitive report
Gap 1).

## Components
- LabDashboard (Pending/Overdue TAT/Critical Vals/Completed — per draft)
- OrderList (Today/Last week/Last month/Online/Forwarded/Unsolved tabs)
- SampleTracking
- ResultEntry / ReportGeneration (Typst PDF)
- TestCatalog
- QC/Equipment (later polish, not P0)
- LabAnalytics (later polish, not P0 — no AI features ship in MVP)

## API deps
- POST /lab/orders (links to customer_id, optional sale_id)
- POST /lab/orders/:id/sample
- POST /lab/orders/:id/result
- POST /lab/orders/:id/report (Typst-generated PDF)

## Offline behavior
Full order→sample→result flow works offline. Report PDF generation is local
(Typst), no external service dependency. Sync is silent/background.

## PIN gates
Result entry/override = PIN-gated if it deviates from expected reference
range (interaction-override pattern, same class of action as pharmacy
overrides).

## Design tokens
Standard card tokens. Critical values use `color-danger`.

## Data model reference
`LabOrder` → `LabSample` → `LabResult` → `LabReport`, linked `Customer`,
optional `Sale` link. CustomerSearch component is SHARED with sales-pos.md.