# SPEC — Sales / POS

**Status:** 🟢 · **Phase:** MVP

## Purpose
Core transaction loop. Must complete a full sale (dispense, print receipt,
update stock) with zero internet, 100% of the time — this is the platform's
core trust promise (PRD Goal 1).

## Components
- SaleCart (line items, qty stepper, subtotal/tax/discount, grand total)
- CustomerSearch (SHARED component — also used by Lab module, do not fork)
- MedicineSearch (queries InventoryItem, shows stock level inline)
- PaymentMethodSelect
- ReceiptPreview / FiscalReceiptStatus (sync dot, never blocking)

## API deps
- POST /sales
- GET /sales/:id
- (fiscal) POST /sales/:id/fiscal-receipt — queues to outbox if offline

## Offline behavior
Sale completes fully offline: SQLite write, local stock decrement, local
receipt print. FiscalReceipt entry queues in local outbox table, submits
to TRA automatically on reconnect — zero user action required, zero
blocking error state.

## PIN gates
Refund = PIN-gated, server-enforced. Discount above owner-set threshold =
PIN-gated (threshold value TBD — flag in PROGRESS.md if not yet decided).

## Design tokens
`color-primary` confirm/complete actions, `font-mono` for all prices/totals.

## Data model reference
`Sale`, `SaleLine`, `FiscalReceipt`, `Customer`, `Medicine`, `InventoryItem`