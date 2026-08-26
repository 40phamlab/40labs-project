# SPEC Index — 40LabsCore

Status legend: 🟢 Ready to build · 🟡 Needs one decision first · 🔴 Deferred

| Spec file                  | Feature            | Status | Notes |
|-----------------------------|--------------------|--------|-------|
| `inventory.md`             | Inventory           | 🟢 | Build first |
| `sales-pos.md`              | Sales / POS         | 🟢 | Shares Customer picker with Lab |
| `customers.md`              | Customers            | 🟢 | |
| `purchases.md`              | Purchases            | 🟢 | Feeds Supplier Debt KPI |
| `lab-module.md`             | Lab (Orders→Report) | 🟢 | Core moat — build with care |
| `dashboard.md`              | Dashboard             | 🟡 | Build last; variant B (with Customer Debt/Balance) confirmed |
| `settings.md`               | Settings              | 🟢 | |
| `scheduling-notifications.md` | Scheduling/Notifications | 🟢 | Polish layer, after core loop works |
| `deferred-auth.md`          | Sign In / Role screen | 🔴 | Blocked — see file for reason |
| `deferred-e-pharmacy.md`    | e-pharmacy panel      | 🔴 | Post-MVP per Business Mechanism §2.1 |

Only 🟢 items go into the current sprint. 🟡 needs Sairiamu's one-line
confirmation before build starts (already given verbally for dashboard
variant — formalize here once you paste this file). 🔴 items should not
be touched by a coding agent without an explicit unblock instruction.