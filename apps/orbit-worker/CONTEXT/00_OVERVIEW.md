# 00 — Orbit Worker Overview

Status: design handed over (5 mockups: Pair, Home, History, Notifications, Settings). Hub LAN hardening (Step 0A/0B/0C) is a prerequisite for anything beyond the shell.

## Purpose
Staff do point-of-work tasks from their phone inside the pharmacy: receive stock, collect lab samples, record results, look up stock, add patients, make quick sales, read and send internal staff notifications. Free, opt-in, LAN-only by design (a security boundary, not a limitation to fix).

## Users
Pharmacy staff added by the owner (SUDO). Job roles seen in the mockups: pharmacist ("Anna - pharmacist"); lab technician and cashier are expected. Owner defines per-device permissions on the desktop (DevicesPanel).

## Screen inventory (from mockups)
| Screen | Mockup elements | Spec section |
|---|---|---|
| Pair | Camera viewport with orange corner frame and scan line, caption "scan to connect", app name "Orbit Worker", 40Labs wordmark | 03-SCREENS #pair |
| Home | Header (user - role, notification dot with count, connection dot "active"), "Today" card (Sales, Patients, Samples, Results, Stocks, Alert), 6 action tiles (Add Stock, Add Patient, Sale Product, View Stock, Record Result, Collect Sample), 4-tab bottom bar | #home |
| History | Title, filter chip "All", list of cards | #history |
| Notifications | Filter chips All / Role / Uni, list, "New" floating button opening menu: Broadcast, Role Based, Uni, Alert | #notifications |
| Settings | Server ("Grace pharmacy", active), User, Role, Theme, Data > Clear all data | #settings |
Bottom bar = 4 tabs: Home, History, Notifications, Settings (icons in the mockup are unlabeled circles; icons + visible labels are required).

## MVP scope
In: pairing, Home, Settings, History, staff Notifications (receive + send), Add Stock (receive), Collect Sample, Record Result, View Stock, Add Patient, Sale Product.
Out (do not build): PIN-gated adjustments/refunds/PO approval flows on Orbit (PIN pad component is built when the first gated action needs it), aMob, patient-facing anything, cloud/WhatsApp from the phone, background push off-LAN, multi-branch UX.

## Build order (each item = vertical slice, see CLAUDE.md workflow)
- **S0 Spike (blocking): phone-side TLS pinning to the hub's self-signed certificate** on Android and iOS with an Expo dev client. Deliver: a minimal app that scans a QR, pins, and calls GET /api/pairing/health over HTTPS, plus a written verdict. Most RN pinning libraries pin a public-key hash and still expect the chain to validate, which a self-signed cert will not. The result decides what the QR `fp` field carries (certificate hash vs SPKI hash) and whether a small native Expo module is needed. Report this to Sairiamu before Step 0C closes.
1. Shell: Expo dev client, expo-router with 4 tabs, theme provider (dark/light), i18n, fonts, empty screens.
2. Pairing: scan -> claim -> SecureStore -> Home. Connection state machine and the Settings > Server row.
3. Home header + Today card (read-only) and Settings (User/Role/Theme/Language/Data).
4. History (read-only) and Notifications (receive), then Notifications send.
5. View Stock (read), then Add Stock (idempotent write with outbox), Collect Sample, Record Result.
6. Add Patient (shared Customer, duplicate-safe).
7. Sale Product last: depends on the hub's fiscal outbox and payment-method spec being solid.

## Open decisions (agent uses the stated default until Sairiamu changes it)
1. **Job role field.** `UserRole` is only `sudo | staff`, but the UI shows "pharmacist" and has "Role Based" notifications. Default: hub adds a `job_role` on users (pharmacist | lab_technician | cashier | other); Orbit shows it as "Role"; schema change needs approval.
2. **New permission keys** (existing: can_update_stock, can_adjust_stock, can_issue_refund, can_approve_po, can_add_lab_sample, can_override_lab_result, can_view_reports). Default additions: can_view_stock, can_create_sale, can_manage_customers, can_record_lab_result, can_send_notifications. Must be added to the hub's typed permissions struct and DevicesPanel.
3. **Staff notifications are a new hub entity**, not the existing `notifications` table (that one is gov/customers/marketing/business with amob/whatsapp/sms/email channels). Default: `staff_notifications` with audience = broadcast | role | user, severity = info | alert, with workspace_id + branch_id.
4. **"Uni" label.** Interpreted as unicast (message to one staff member). Default UI label: "Direct" (Swahili in i18n file). Confirm.
5. **Today card scope.** Default: Sales, Patients, Samples, Results = this staff user's own count today; Stocks = number of low-stock items; Alert = open alerts addressed to this user/role. Counts only; no TZS revenue unless can_view_reports.
6. **Connection dot colors.** Mockup shows orange for "active". Default: connected = accent orange labeled Active; connecting = pulsing outline; offline = muted gray; revoked/blocked = danger red plus a full-screen explanation (the one exception to "status is a dot, never a modal").
7. **Offline writes.** Default: stock receipts, lab samples, results and patient adds go through an idempotent outbox; **sales do not queue** (a sale needs the hub for stock check and fiscalization), and the Sale tile is disabled while the hub is unreachable.
8. **Light theme.** No light palette exists in `packages/design-tokens`. A provisional one is in 02-DESIGN-TOKENS.md; ship dark first and treat light as provisional until approved.
9. **Language switch.** Not in the mockup; Swahili-first requires one. Default: a Language row in Settings.
10. **Clear all data.** Default: blocked while the outbox has unsynced items (shows count, offers "retry sync" and "discard and clear"); clears cache, history, notifications, outbox and the server credential (device must be re-paired); the owner still sees the device in DevicesPanel until removed.
11. **Navigation/styling libs.** Defaults: expo-router, StyleSheet + typed theme object (NOT NativeWind: desktop is on Tailwind v4 and NativeWind v4 targets Tailwind v3).