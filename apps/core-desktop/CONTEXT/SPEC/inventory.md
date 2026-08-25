# SPEC — Inventory

**Status:** 🟢 Build first · **Phase:** MVP

## Purpose
Batch/expiry-tracked stock management, TMDA-compliant, shared source of
truth for Medicine + InventoryItem records used by Sales and Lab.

## Components
- InventoryList (search, filter by category, expired/low-stock badges)
- InventoryItemForm (add/edit — batch number, expiry, buy/sell price, unit)
- StockAdjustment (PIN-gated)
- ExpiredStockView / LowStockView

## API deps (design in services/api-core, not built yet — see PROGRESS.md)
- GET/POST /inventory
- PATCH /inventory/:id
- POST /inventory/:id/adjust (PIN-gated)
- GET /inventory/expired
- GET /inventory/low-stock

## Offline behavior
Full CRUD works with zero internet, SQLite is source of truth. Stock
adjustment PIN check happens against local cached auth rules; audit log
entry written locally, syncs silently.

## PIN gates
Stock adjustment = PIN-gated. Add/edit new item = not PIN-gated (routine
staff task per owner-defined permission set).

## Design tokens
`color-danger` for expired, `color-accent` for low-stock, `font-mono` for
batch numbers and prices.

## Data model reference
`Medicine`, `InventoryItem` — see CONTEXT/03-DATA-MODEL.md