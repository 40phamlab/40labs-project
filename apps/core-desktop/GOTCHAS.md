# 40LabsCore — Gotchas & Traps

Things that look obviously right but aren't. Add to this file whenever you encounter traps during development.

1. **Don't build Dashboard first.** It's a pure read-aggregate of Inventory/Sales/Purchases/Lab.
2. **CustomerSearch is ONE component**, used by both Sales/POS and Lab.
3. **Sync status is a dot, never a blocking modal or banner.**
4. **PIN gates are server-enforced, always.**
5. **AppearancePanel is dark/light toggle ONLY.** No custom color theming sliders.
6. **e-pharmacy is not a storefront in MVP.**
7. **workspace_id + branch_id on every new table, no exceptions.**
8. **Claymorphism is depth, not decoration.** Max 2 shadow layers per element.
9. **stock_adjustment.audit_log_id has no DB-level foreign key.** Enforce at application layer inside a transaction.
10. **Tailwind v4 `@source` directive**: Any package under `packages/*` containing `className` strings needs an explicit `@source` directive in `apps/core-desktop/src/App.css` so Tailwind compiles the classes correctly.
11. **Theme Initialization**: Theme is initialized immediately at boot in `main.tsx` from `localStorage` (`40labs_theme`) to prevent any visible flash of incorrect theme.
12. **Flex Shrink / Min-width Constraints**: Always ensure flex container children include `min-w-0` and `min-h-0` to prevent table and panel blowouts in responsive viewports.
