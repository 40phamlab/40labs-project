# SPEC — Dashboard

**Status:** 🟡 → 🟢 once pasted (variant confirmed) · **Phase:** MVP · Build LAST

## Purpose
Owner's private operational view — sales, stock, lab reporting. NOT the
platform-wide Admin view (that's a separate app, Admin Web App).

## Confirmed variant
Variant B from the design draft: Monthly Profit, Profit, Today's Sales,
Transactions, Supplier Debt, Customer Debt, Customer Balance, Inventory
Value, QuickActions (New Sale/Add Patient/Add Stock/View Reports),
Business Health (Total Stock/Categories/Empty/Expire), Patients in Track,
Pending (Purchase Orders/ePharmacy/40Labs — read-only status links).

## Components
- KPICardRow
- BusinessHealthPanel
- PatientsInTrackPanel
- QuickActionsGrid
- PendingPanel

## API deps
All READ-ONLY aggregation endpoints. Do not create new write paths here —
Dashboard only queries data already written by Inventory/Sales/Purchases/Lab.
- GET /dashboard/summary (aggregates the above)

## Offline behavior
Fully offline — all source data is local SQLite. No live network dependency
for any KPI.

## PIN gates
None — read-only screen. QuickActions route to the PIN-gated flows already
defined in their respective specs.

## Design tokens
Standard KPI card styling. Status ring (the red donut in the draft) —
color meaning not yet defined, flag in PROGRESS.md before building it;
don't default it to `color-danger` without confirming what it represents.

## Data model reference
Reads from Sale, InventoryItem, Purchase, Customer, LabOrder — writes nothing.