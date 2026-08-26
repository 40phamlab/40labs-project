# 40LabsCore — Gotchas & Traps

Things that look obviously right but aren't. Add to this file whenever
you or the coding agent almost makes one of these mistakes.

1. **Don't build Dashboard first.** It's the visual entry point but it's a
   pure read-aggregate of Inventory/Sales/Purchases/Lab. Building it first
   means faking data shapes you'll have to redo.

2. **CustomerSearch is ONE component, used by both Sales/POS and Lab.**
   If you find yourself writing a second "search for a customer" component,
   stop — you're duplicating the shared-record principle the whole platform
   depends on.

3. **Sync status is a dot, never a blocking modal or banner.** This is a
   trust-critical UX rule, not a style preference — Maisha Meds and others
   fail here on connectivity-heavy days; our whole pitch is that offline
   never blocks work.

4. **PIN gates are server-enforced, always** — even on desktop, even though
   there's no "untrusted device" concern like Orbit Worker has. The rule
   is uniform across surfaces on purpose, so nobody has to remember which
   surface is the exception.

5. **AppearancePanel is dark/light toggle ONLY.** The original design draft
   shows custom primary/secondary/font theming sliders — that contradicts
   the locked "simplified to dark/light only" decision. If you see those
   sliders in a future design pass, that's the design drifting from the
   locked decision, not a new requirement — flag it, don't just build it.

6. **e-pharmacy is not a storefront in MVP.** Any live order count, revenue
   figure, or working "Online Store" toggle on that screen is out of scope
   — see SPEC/deferred-e-pharmacy.md.

7. **workspace_id + branch_id on every new table, no exceptions**, even
   for something that feels obviously single-branch right now (e.g.
   Notification, Schedule — new entities not yet in 03-DATA-MODEL.md).


   8. **Claymorphism is depth, not decoration.** The visual direction is soft
   shadows + pressed/inset states (see 02-DESIGN-TOKENS.md → Elevation) —
   NOT screws, panel texture, or hardware metaphors, even though the
   original reference (Misso/SysMonitor console) uses those. If you catch
   yourself adding a decorative icon that mimics a physical fastener or
   material texture, stop and check with Sairiamu first — that's a scope
   decision, not a styling default. Max 2 shadow layers per element;
   heavier stacking looks muddy and costs render performance for no gain.

   9. **stock_adjustment.audit_log_id has no DB-level foreign key.** Insert
   order requires writing audit_log first, then stock_adjustment
   referencing it, inside one transaction — enforce this at the
   application layer, not the schema. Forgetting this breaks the
   "every PIN-gated action writes exactly one audit_log entry" rule
   silently.