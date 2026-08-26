# SPEC — Customers

**Status:** 🟢 · **Phase:** MVP

## Purpose
Single shared Customer record across POS and Lab — no duplicate patient
records per module (PRD Requirement P0-7).

## Components
- CustomerList (Today / Last Month / All / Reserved tabs — per design draft)
- CustomerProfile (purchase history + lab history in one view)
- DebtorsView / BalancesView (credit tracking)
- CustomerSearch — see sales-pos.md, this is the canonical instance

## API deps
- GET/POST /customers
- GET /customers/:id (returns combined POS + Lab history)
- GET /customers/debtors

## Offline behavior
Full CRUD offline. Combined history view reads local SQLite joins across
Sale and LabOrder tables.

## PIN gates
None for view/search. Editing a customer's debt/balance manually = PIN-gated.

## Design tokens
Standard card/list tokens. `color-accent` for outstanding balance indicators.

## Data model reference
`Customer` (single shared entity — see 03-DATA-MODEL.md)