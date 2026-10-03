# 05 — LAN Hub & Orbit Worker (durable domain context)

Referenced per-task. Not auto-loaded. Facts verified against commit 651662a (2026-10-02). Delete a "Known defect" line only when its fix is merged and tested.

## What this subsystem is
Orbit Worker is a free, opt-in staff phone app (React Native + Expo, `apps/orbit-worker`, not yet built). It talks ONLY to the pharmacy's desktop (40LabsCore) over the local network. LAN-only is a deliberate security boundary: staff cannot reach business data from outside the building. The desktop is the hub; SQLite on the desktop is the single source of truth. Orbit holds no replica, only a small idempotent outbox for writes.

## Product rules (locked; sources: Business Mechanism §2.2, PRD P0-9/P0-10, settings.md)
- Pairing: QR scan once per device. After that the device reconnects automatically without re-confirmation, until the owner blocks or removes it.
- Device trust ≠ authorization. A paired device gets in the door only. Permissions are owner-defined per device and re-read from SQLite on every request. Every PIN-gated action stays PIN-gated on Orbit, verified server-side (PRD §7.2 asks Sairiamu to confirm this as final; treat as the working rule).
- Owner controls (DevicesPanel): Active / Recently connected / All; Remove, Block, edit permissions. Per settings.md, device remove/block are PIN-gated.
- Only the owner (SUDO) creates staff users and decides which staff user + permission set a pairing QR grants. The phone never chooses its own identity or permissions.
- Typical Orbit actions: stock update/add, quick sale, add lab sample, photo capture (delivery notes, lab samples).

## Where it lives today (apps/core-desktop)
- `src-tauri/src/services/lan_server.rs` — LanServerState (in-memory pairing sessions, 5-minute TTL), hand-rolled TCP/HTTP listener on 0.0.0.0, `/api/pairing/health` and `/api/pairing/pair` only.
- `src-tauri/src/commands/devices_cmd.rs` — Tauri commands for the desktop UI (initiate pairing, list, block, unblock, remove, update permissions).
- `src-tauri/src/models/device.rs`, `repositories/device_repo.rs` — `paired_device` table (id, workspace_id, branch_id, user_id, device_label, device_type, status, permissions_json, last_connected_at, paired_at, updated_at).
- `src/api/devicesApi.ts` (invoke + mock fallback), `src/features/settings/components/DevicesPanel.tsx`, `src/components/QrCodeSvg.tsx`.
- Default permission keys today: can_update_stock, can_adjust_stock, can_issue_refund, can_approve_po, can_add_lab_sample, can_override_lab_result, can_view_reports (stored as free-form JSON).

## Known defects (as of 651662a)
1. LAN server builds its own LanServerState; sessions created by the desktop UI (AppState's copy) are invisible to it → pairing always fails.
2. Pair handler passes an empty token to validate_and_consume_session and ignores the result → token never verified, session never consumed (one QR can pair many devices in 5 min).
3. Pair request body supplies user_id and permissions → a phone can grant itself any identity/privileges.
4. Pairing issues no credential; no authenticated LAN route exists; permissions are not enforced on any LAN route.
5. Hand-rolled HTTP parsing (single 4 KB read, no Content-Length handling); Axum is the intended stack but is not in Cargo.toml. JSON error bodies are built with format!.
6. get_local_ip routes to 8.8.8.8 and falls back to 127.0.0.1 → wrong QR on an isolated LAN.
7. Plain HTTP on 0.0.0.0, no TLS, no certificate pinning.
8. `authorized_pin` exists on RecordStockActionRequest but nothing reads it: no PIN gate is enforced anywhere yet.
9. `users.pin_hash` hashing scheme is unverified; sha2 is the only hashing dependency. If it is plain SHA-256 over a short PIN, it is brute-forceable from a copied DB.
10. audit_log has no DB-level protection (no triggers) against UPDATE/DELETE; immutability is convention only.
11. Schema lives in two places: inline in `src-tauri/src/db.rs` (CREATE TABLE IF NOT EXISTS) and `infra/db/sqlite-schema/migrations/` (three files numbered 0002). `CREATE TABLE IF NOT EXISTS` never alters an existing table, so adding columns needs a real migration path. Determine and document which source is authoritative before any schema change.

## Target design (see ADR 0001 and SPEC/lan-orbit-hub.md)
Embedded Axum server inside the Tauri process, sharing the same `services/` and SQLite pool as the Tauri commands. One authentication/permission middleware for all LAN routes. TLS with a self-signed certificate persisted in the app data dir; its SHA-256 fingerprint travels in the pairing QR for client-side pinning. Pair QR payload: `orbit://pair?endpoint=https://<ip>:<port>&sessionId=<uuid>&token=<random>&fp=<sha256-hex>`.

## Audit & PIN conventions to follow
- Insert-only audit via `AuditRepository::create`; find and copy the existing action-naming convention from current callers — do not invent a new one.
- Audit row + the action it records commit in one SQL transaction (GOTCHAS #9).
- PIN failures: count, lock out with a persisted lockout (survives restart), audit the failure without recording the PIN.
- LAN device credential: random 32 bytes from the OS CSPRNG, returned once at pairing, stored only as a SHA-256 hash. Never log it.

## Out of scope here
React Native app code, certificate pinning on the phone, business routes (inventory/sales/lab over LAN), cloud sync, aMob/web-app. Those get their own prompts after Step 0.
