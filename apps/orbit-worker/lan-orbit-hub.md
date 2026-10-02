# LAN Hub — Step 0 hardening (prerequisite for Orbit Worker)

[PHASE: MVP] · Status: 🟡 0A ready (pure bug fix) · 0B/0C need Sairiamu's sign-off on ADR 0001 (credential scheme; PRD §7.2 PIN-gating confirmation)
Context file: `CONTEXT/05-LAN-ORBIT.md` · Decision record: `docs/adr/0001-orbit-lan-hub.md`

## Problem
The Orbit pairing server added in commit 97306f9 cannot pair (separate state), doesn't verify tokens, lets the phone choose its own permissions, issues no credential, and has no PIN gate or TLS. Orbit Worker (RN) cannot be built on it.

## Chosen approach (three reviewable steps)
- **Step P (preflight, one tiny commit):** core-desktop's `tsconfig.json` lists `node` in `types` but `@types/node` is not declared for the package, so `pnpm --filter @40labs/core-desktop build` fails on a clean install (TS2688). Fix: `pnpm --filter @40labs/core-desktop add -D @types/node@^22`. Verified: build passes once added.
- **Step 0A — correctness:** single shared LanServerState; token checked and session consumed atomically; owner chooses user_id + permissions at session creation; typed permissions struct; `PairedDevice` TS type aligned with Rust.
- **Step 0B — transport & auth:** replace TCP loop with Axum; per-device credential (hash at rest); auth + permission middleware; routes: `GET /api/pairing/health`, `POST /api/pairing/pair`, `GET /api/v1/devices/me`, `POST /api/v1/devices/me/heartbeat`; pair brute-force backoff; interface-based local IP detection; audit rows for paired/blocked/unblocked/removed.
- **Step 0C — PIN gate & TLS:** `pin_service` shared by Tauri commands and LAN routes; persisted lockout; wire `authorized_pin`; gate device remove/block (settings.md); self-signed TLS with fingerprint in QR.

## Alternatives rejected
- Keep raw TCP and patch it: rejected, partial reads break on real Wi-Fi and every future route would re-implement auth by hand.
- Cloud relay for Orbit: rejected, violates LAN-only boundary and offline-first.
- Separate api-core process on the LAN: rejected for MVP, a second process to install/keep running at the pharmacy; the services layer is already shared, so embedding costs nothing later to move out.
- Device keypair signed requests: viable, deferred; with pinned TLS a hashed bearer credential is simpler and RN-friendly. Revisit if a threat model needs request-level non-repudiation.

## Assumptions to confirm (Sairiamu)
1. Persistent pairing never bypasses PIN gates (PRD §7.2).
2. Device block/remove/permission edits are PIN-gated on desktop (settings.md says remove/block).
3. Self-signed TLS with QR-carried fingerprint is acceptable (vs. plain HTTP on LAN).
4. Existing paired devices from earlier builds must re-pair after 0B (they have no credential).

## Non-goals
Business routes over LAN, RN app code, phone-side pinning, cloud sync, multi-branch UX, any aMob/web-app work.

## API deps (all new, Step 0 only)
`GET /api/pairing/health` · `POST /api/pairing/pair` · `GET /api/v1/devices/me` · `POST /api/v1/devices/me/heartbeat`. Desktop UI keeps using Tauri invoke.

## Offline behavior
Entirely local. No internet needed for pairing, auth, PIN checks, or TLS.

## PIN gates
Device remove/block, permission change, any stock adjustment / refund / PO approval / interaction override reached over LAN (enforced in services). PIN verified for the user bound to the device, never a user named by the phone.

## Design tokens
Desktop UI changes limited to DevicesPanel pairing flow (staff user + permission pickers before QR). Existing tokens only (02-DESIGN-TOKENS.md).

## Data model
`paired_device` gains `credential_hash TEXT` (nullable; NULL rows can never authenticate). Add persisted PIN-attempt/lockout storage (workspace_id + branch_id on it). All new tables carry workspace_id + branch_id.

## Acceptance (done = all true, with real test output)
Scan a QR from a second device on the LAN → pairs once, second use of same QR fails; device with can_adjust_stock but wrong PIN is rejected; owner Block/Remove denies the very next request; plain-HTTP to the TLS port fails; cert fingerprint identical across app restarts; `pnpm test`, desktop build, `cargo test -p core-desktop` green.
