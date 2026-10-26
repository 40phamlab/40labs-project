# Admin Web UI Spec

## Layout (mirror core-desktop shell)
- Left **sidebar** (collapsible, 240px / 72px icon-only), same item style, active indicator, and clay elevation as core-desktop. Copy the shell pattern from `apps/core-desktop`, extracting shared pieces into `packages/ui-components`.
- Top bar: page title, global search (businesses by name / Business ID / TMDA number), environment badge (PROD / STAGING), theme toggle, account menu (Logout).
- Content area: page header + **tabs** (underline style, same as desktop) + body.
- Language: English only for admin (internal tool). No i18n work.

## Sidebar items
| Item | Route | Tabs inside |
|---|---|---|
| Overview | `/` | none |
| Businesses | `/businesses`, `/businesses/:id` | list: All / Pending / Verified / Rejected. detail: Profile / Stock & Prices / Sync / Activity |
| Analytics | `/analytics` | Revenue / Products / Growth |
| Sync | `/sync` | Devices / Recent Changes / Failures |
| Infra | `/infra` | Health / Heartbeats / Logs |
| Account | `/account` | Profile / TOTP / Sessions |

## Page specs

### Overview
KPI cards (use KPITile): Registered businesses, Verified %, Pending verification, Active businesses (synced in last 24h), Total sales today (platform, TZS), Open infra alerts.
Below: 30-day signups line chart; platform daily sales bar chart; "Needs attention" list (pending verifications oldest first, devices not synced >48h, failing health checks).
Each KPI card links to the relevant filtered page.

### Businesses (list)
Table: Business ID (mono), name, region, TMDA number, tier, verification status chip, last sync, created. Server-side pagination (25/page), sort, search, status filter. Row click opens detail.

### Business detail
- **Profile:** registration data, TMDA number, owner name, contact, tier, modules (pharmacy/lab). Verification panel with buttons Verify / Reject / Suspend. Reject and Suspend require a reason text. Confirmation modal. Shows who decided and when.
- **Stock & Prices:** from synced stock/price: item count, low-stock count, expiring in 90 days count, table of items (name, qty, buy/sell price, expiry). Read-only. No customer data.
- **Sync:** devices for this business, last sync time, outbox lag, last 20 sync changes (entity, op, time).
- **Activity:** admin actions on this business from audit log.

### Analytics (simple, aggregated, no ML)
- **Revenue:** platform revenue by day/week (range picker 7/30/90d), by region, tier distribution.
- **Products:** top 20 medicines by units sold platform-wide; top 20 by revenue; most stocked-out (from daily_summary).
- **Growth:** signups per week, activation rate (registered then first synced sale), verified vs unverified.
Use Recharts; one chart per card; each has a table toggle. Charts must also render in dark mode.

### Sync
- **Devices:** table from `sync_devices`: business, device label, app version, last seen, queue depth, status chip (healthy <1h, stale <48h, offline >48h).
- **Recent Changes:** latest `sync_changes` (entity, op, business, time), filter by entity.
- **Failures:** rejected/conflicted pushes with reason, grouped by business.

### Infra
- **Health:** live status board, see `ADMIN_INFRA_MONITORING.md`.
- **Heartbeats:** device heartbeats timeline.
- **Logs:** filterable log viewer.

### Account
Profile, enroll/reset TOTP (reset requires password), active sessions with revoke.

## States and behavior
- Polling via React Query `refetchInterval`: Infra 15s, Overview 60s, others on focus. Pause when document hidden.
- Skeleton loaders, never spinner-only. Empty states with one line of text. Error state with Retry.
- Timestamps shown in Africa/Dar_es_Salaam with relative time tooltip; money as `TZS 1,250,000` in JetBrains Mono.
- All tables: sticky header, keyboard focusable rows.
