# Implementation Plan - Stock Tab Functionality & UI Fixes

This plan outlines the steps to inspect, fix, and enhance the Stock (Inventory) tab, analytics, movement, performance, expiry, tables, and quick search in `apps/core-desktop`.

## User Review Required

> [!IMPORTANT]
> - **Stock Value Metric**: Replaces `THAMANI YA MAUZO` (Sales Revenue) with `THAMANI YA STOCK` (Total Inventory Cost Valuation: $\sum \text{quantity} \times \text{buy\_price}$ for available active/non-expired stock).
> - **Movement Tab**: Integrates backend stock movement / audit log / adjustment tracking to display real inventory transaction history with filters and search.
> - **Performance Tab**: Activates 7D, 30D, and 90D date-range controls and calculates real inventory performance (fast/slow movers, turnover, inventory value over time) without hardcoded figures.
> - **Expiry Tab & Filters**: Ensures correct date calculations, multi-batch handling, status filtering, and branch-level data isolation.

## Open Questions

- None. All requirements align with existing backend models (`inventory_item`, `medicine`, `stock_adjustment`, `audit`) and frontend design tokens.

## Proposed Changes

### 1. Inventory Valuation & Stock Value Metric (`apps/core-desktop`)
- Update KPI calculation logic in `computeStockAnalytics.ts` and UI components (`StockKpiStrip.tsx`, `InventorySidebar.tsx`, etc.) to use `THAMANI YA STOCK` (`stockValueBuy`).
- Exclude expired, damaged, or deactivated inventory from active stock valuation.
- Ensure correct TZS formatting and dynamic updates on mutations.

### 2. Movement Tab & Backend Integration (`apps/core-desktop` & `src-tauri`)
- Enhance backend inventory services and frontend `MovementTab` / `inventoryApi` to fetch real movement records (stock additions, sales deductions, purchases, adjustments, returns, transfers).
- Implement working date-range filters, movement-type filters, search, and pagination.

### 3. Performance Tab & Date Range Controls (`apps/core-desktop`)
- Wire up 7D, 30D, and 90D date-range selectors to recalculate metrics dynamically.
- Implement robust calculations for fast-moving items, slow-moving items, stock turnover, and inventory value over time with division-by-zero safeguards.

### 4. Table & Quick Search Enhancements (`apps/core-desktop`)
- Audit and fix all tables across Overview, Movement, Performance, and Expiry tabs (sorting, filtering, search, pagination, empty states, mutation refresh).
- Ensure Quick Search panel supports name, generic name, SKU, and status filters (Expired, Low Stock, Stock Out, All Active) combined without conflict.

### 5. Expiry View & Branch Isolation (`apps/core-desktop` & `src-tauri`)
- Refine expiry calculations, days-remaining logic, and batch separation.
- Ensure branch-level data isolation and correct handling of items without expiry dates.

### 6. Testing & Verification
- Add/update unit tests for stock valuation, movement history, performance metrics, date ranges, expiry calculations, and quick search.
- Run frontend tests and Tauri backend tests.

## Verification Plan

### Automated Tests
- Run frontend Vitest tests: `pnpm test` (or vitest execution).
- Run Rust unit tests for inventory repo and service: `cargo test` in `src-tauri`.

### Manual Verification
- Inspect Inventory Dashboard UI via Tauri/browser preview, verifying metric label change (`THAMANI YA STOCK`), table interactions, date range toggles (7D/30D/90D), movement records, and quick search filters.
