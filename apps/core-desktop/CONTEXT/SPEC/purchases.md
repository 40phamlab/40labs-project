# SPEC — Purchases

**Status:** 🟢 · **Phase:** MVP

## Purpose
Supplier-side stock intake, feeds Supplier Debt KPI on Dashboard and
Inventory stock levels.

## Components
- SupplierList/Search (with TMDA/TRA verification badge display — read-only
  badge, verification workflow itself lives in Admin Web App per PRD P0-15,
  not built here)
- ProductCatalogFromSupplier (browse supplier's listed products)
- PurchaseCart / PurchaseOrderForm
- PurchaseHistory (Recently / Pending / Completed tabs)

## API deps
- GET /suppliers, GET /suppliers/:id/products
- POST /purchase-orders
- GET /purchase-orders?status=pending|completed

## Offline behavior
Draft POs can be created offline; submission to a supplier (if supplier is
another 40Labs Business ID) queues until connectivity returns. Local stock
receipt (GRN) always works offline regardless of PO submission status.

## PIN gates
PO approval above owner-set threshold = PIN-gated, server-enforced.
TODO: [Server enforcement endpoint /api/purchases/approve step-up verification] [PHASE: marketplace-preview]

## Future Cloud Endpoints (DRAFT — Not Implemented)
- `POST /orders`: Submit purchase order to cloud marketplace backend.
- `GET /orders/:id`: Fetch order status and synchronization state.
- `POST /orders/:id/events`: Record local order lifecycle event rows (sent, confirmed, completed, cancelled).

## Design tokens
Verification badge uses `color-primary` (verified) — do not invent a new
badge color; reuse the semantic token.

## Data model reference
`Purchase`/`PurchaseOrder`, `InventoryItem` (receipt updates this)