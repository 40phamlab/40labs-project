# 03 — Screen Specs

Each section: purpose, components, hub API, permissions, offline behavior, PIN gates, states not covered by the mockup (need approval before building). Status: 🟢 mockup exists · 🟡 mockup exists but needs a decision · 🔴 no design yet.

## #pair 🟡
Purpose: one-time pairing to a pharmacy hub.
Components: CameraView (QR only) with ScanFrame (corner brackets + scan line), caption "scan to connect", app title, 40Labs wordmark ("4" green, "0" orange, "Labs" text color).
Flow: scan -> parse and validate `orbit://pair?...` (https only) -> pin -> POST /api/pairing/pair {sessionId, token, deviceLabel, deviceType:"phone"} -> store credential -> Home. Default device label from expo-device, editable later in Settings.
Offline: needs the hub on the same LAN. Not on the pharmacy Wi-Fi -> "Connect to the pharmacy Wi-Fi, then scan again."
Not in mockup (need text wireframes): camera permission denied, invalid/expired QR (one generic message), not on LAN, pairing in progress, success. Optional later: manual code entry.

## #home 🟡
Header: "{name} - {job role}", notification dot (count), connection dot + label. Tapping the bell opens Notifications.
Today card: Sales, Patients, Samples, Results, Stocks, Alert (definitions in 00-OVERVIEW Open decision 5). Tapping a stat opens History filtered to it (Stocks -> View Stock low-stock filter, Alert -> Notifications Alerts).
Tiles (2 columns, 3 rows) and the gate for each:
| Tile | Permission | Hub route | Queue offline | Notes |
|---|---|---|---|---|
| Add Stock | can_update_stock | POST /stock/receipts | yes | Receive against an existing Medicine: batch number, expiry, quantity, optional photo of delivery note. NOT adjustments (adjustments are PIN-gated and desktop-first) |
| Add Patient | can_manage_customers (new) | GET/POST /customers | yes | Shared Customer record: search by phone first, then create; never duplicate |
| Sale Product | can_create_sale (new) | POST /sales | NO | Hub does stock check, tax, fiscalization, receipt |
| View Stock | can_view_stock (new) | GET /stock | read-cache | Search by name or barcode; shows quantity, batch/expiry |
| Record Result | can_record_lab_result (new) | POST /lab/results | yes | Against a collected sample / lab order; not "override" (that is can_override_lab_result, PIN-gated) |
| Collect Sample | can_add_lab_sample | POST /lab/samples | yes | Link to existing patient; optional photo |
Disabled-tile behavior in 02-DESIGN-TOKENS.md. Permissions refetched on resume.
Offline (unreachable): header shows muted dot; Today shows cached values labeled "as of {time}"; hub-dependent tiles disabled; queueable tiles stay enabled.
Each tile opens a flow with no mockup yet: 🔴 Add Stock form, Add Patient form, Sale cart/payment, Stock list/detail, Record Result form, Collect Sample form. Each needs a text wireframe approved before building.

## #history 🟡
Purpose: this staff user's recent actions (sales, stock receipts, patients added, samples, results), newest first, last 30 days, paginated. Source `GET /api/v1/activity` (new; the audit log is not a general activity feed: it only holds PIN-gated actions).
Components: ScreenHeader, FilterChips (default All; proposed: Sales, Stock, Patients, Lab), HistoryRow (type icon, title, subject, time, status chip: done / pending / failed).
Offline: show cached page plus local outbox items as "pending" (tap -> retry / view error).
Not in mockup: empty state, row detail, failed-item actions.

## #notifications 🟡
Purpose: internal staff messages and alerts, distinct from the desktop `notifications` table (external gov/customer/marketing/business).
Filters: All (everything addressed to me, including broadcasts), Role (addressed to my job role), Direct (addressed to me; mockup label "Uni").
Rows: sender, subject/body preview, time, severity (alert rows use danger accent), unread marker.
"New" FAB menu: Broadcast (all staff), Role Based (pick job role), Direct (pick staff from roster), Alert (high-severity; audience picker). Permission can_send_notifications (new); default: Broadcast, Role Based and Alert require it, Direct does not (confirm).
Compose: audience picker, subject, body, send. Queueable offline? No: notifications are sent only while connected.
Delivery: see 01-ARCHITECTURE "Notifications delivery". Mark read on open (PATCH).
Not in mockup: detail view, compose screen, empty state, send success/failure.

## #settings 🟡
Rows from the mockup: Server, User, Role, Theme, Data. Additions needed: Language (Swahili/English).
- Server: list of paired hubs, active one marked "active". MVP supports one active server but storage is keyed by businessId so multiple can be added later. Tap -> server detail (hub name, endpoint, connection state, "Remove server" which deletes the credential locally).
- User: name (read-only, assigned by owner). Role: job role (read-only).
- Theme: dark/light toggle only.
- Data > "Clear all data": see Open decision 10.
- Permissions are shown read-only somewhere (suggested: under Server detail, "What this device can do") so staff understand disabled tiles. Needs approval.

## Components to build first (shared)
ScreenHeader, StatusDot, CountBadge, Card, Tile (enabled/disabled/pressed), Chip (selected/unselected), Fab + FabMenu, BottomTabBar, ScanFrame, EmptyState, InlineError. All in dark and light.