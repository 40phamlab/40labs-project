# 40LabsCore — Data Model Summary (Pointer Document)

This is a SUMMARY for context/orientation only. The canonical source is
`packages/types` (TypeScript) once built, and the SQLite/Postgres schema
files under `infra/db/`. If this file and the real schema ever disagree,
the real schema wins — update this file, don't trust it blindly.

## Shared entities (exist ONCE, referenced everywhere — never duplicated)
- `Customer` — shared across POS + Lab. One record per patient per business.
- `Medicine` — shared catalog entry (name, generic name, category, unit).
- `InventoryItem` — batch/expiry-tracked stock, references `Medicine` + `branch_id`.
- `User` — SUDO owner or staff, PIN-gated, device-bound (Orbit Worker pairing).

## Core transactional entities
- `Sale` / `SaleLine` — POS transaction. Feeds revenue-based tier enforcement
  directly from the ledger (never self-reported).
- `FiscalReceipt` — TRA EFD/VFD outbox entry. Signed locally, queued, submitted
  to TRA when connectivity returns. Every `Sale` produces exactly one of these.
- `LabOrder` → `LabSample` → `LabResult` → `LabReport` — linked to `Customer`
  and optionally a `Sale`/prescription. This chain is the core moat — no
  competitor in the region links these to a shared pharmacy record.
- `Purchase` / `PurchaseOrder` — supplier-side, feeds Supplier Debt KPI.
- `AuditLog` — immutable, append-only. Every PIN-gated action writes exactly
  one entry here. No update, no delete, ever — enforced at the DB layer, not
  just the API layer.

## Every table, without exception
- `workspace_id` (active from day one)
- `branch_id` (reserved, unenforced until v3.5 multi-branch — but present now)

## Reserved-but-inert (schema exists, no live logic — do not build UI for these yet)
- aMob/PatientProfile fields (dormant until aMob ships, post-MVP)
- Public Web App listing fields (dormant until Web App ships, post-MVP)
- Verification badge fields (Admin-side review workflow can exist per PRD
  P0-15, but public badge DISPLAY is deferred)

## Status
`packages/types` not yet scaffolded. Do not let CONTEXT-level docs (this file
or any SPEC file) become the de facto schema — that's how types drift. First
real build task should be `packages/types`, generated FROM the PRD + this
summary, not the other way around.