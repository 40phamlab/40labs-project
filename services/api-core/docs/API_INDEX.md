# API Master Index — 40Labs Core API

**Base URLs:**
- Local Development: `http://localhost:3000`
- Docker Container: `http://api-core:3000`
- Cloud Production: `https://api.40labs.co.tz`
- Orbit Worker LAN Server: `https://<desktop-ip>:4040` (or `http://localhost:4040`)

**Versioning Policy:** URL prefix versioning (`/api/v1/...` or `/v1/...`).

## Status Legend
- **LIVE:** Mounted in `main.rs` and fully reachable.
- **IMPLEMENTED-UNMOUNTED:** Rust code/handlers exist in modules, but not registered via `.merge()` or `.nest()`.
- **STUB:** Returns mock or TODO response.
- **PLANNED:** Specified in architecture/PRD only, no backend implementation.

## Master Endpoint Table

| Method | Path | Module | Auth | Status | Doc Link |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/healthz` | Health | None | **LIVE** | [API_INDEX.md](API_INDEX.md) |
| `GET` | `/readyz` | Health | None | **LIVE** | [API_INDEX.md](API_INDEX.md) |
| `GET` | `/healthz/sms` | Health | Bearer (Signing Key) | **LIVE** | [API_INDEX.md](API_INDEX.md) |
| `POST` | `/api/v1/activation/otp/request` | Activation | None (Rate Limited) | **LIVE** | [API_AUTH.md](API_AUTH.md#post-apiv1activationotprequest) |
| `POST` | `/api/v1/activation/otp/verify` | Activation | None | **LIVE** | [API_AUTH.md](API_AUTH.md#post-apiv1activationotpverify) |
| `POST` | `/api/v1/activation/register` | Activation | None | **LIVE** | [API_AUTH.md](API_AUTH.md#post-apiv1activationregister) |
| `GET` | `/v1/health` | Sync | None | **LIVE** | [API_SYNC.md](API_SYNC.md) |
| `POST` | `/v1/sync/push` | Sync | Device Token (`Authorization: Bearer <token>`) | **LIVE** | [API_SYNC.md](API_SYNC.md#post-v1syncpush) |
| `POST` | `/v1/sync/heartbeat` | Sync | Device Token (`Authorization: Bearer <token>`) | **LIVE** | [API_SYNC.md](API_SYNC.md#post-v1synccheartbeat) |
| `GET` | `/v1/business/verification` | Business / Admin | Device Token (`Authorization: Bearer <token>`) | **LIVE** | [API_SYNC.md](API_SYNC.md#get-v1businessverification) |
| `POST` | `/suppliers/:id/follow` | Suppliers | Session / Device | **IMPLEMENTED-UNMOUNTED** | [API_SUPPLIERS.md](API_SUPPLIERS.md#post-suppliersidfollow) |
| `DELETE` | `/suppliers/:id/follow` | Suppliers | Session / Device | **IMPLEMENTED-UNMOUNTED** | [API_SUPPLIERS.md](API_SUPPLIERS.md#delete-suppliersidfollow) |
| `GET` | `/suppliers/followed` | Suppliers | Session / Device | **IMPLEMENTED-UNMOUNTED** | [API_SUPPLIERS.md](API_SUPPLIERS.md#get-suppliersfollowed) |

## Changelog
- **v0.1.0 (2025-02):** Initial API baseline supporting NextSMS OTP activation, Ed25519 activation grants, gzip-compressed push sync protocol, and device token authentication.

## Known Drift / Gaps (Severity P0 - P2)
1. **P0 — Unmounted Supplier Router:** `suppliers.rs` module defines follow/unfollow handlers and repository traits, but the router is never `.merge()`-ed in `main.rs`.
2. **P1 — PIN Enforcement Client-Side Only:** Server-side Axum endpoints do not enforce Self PIN vs. SUDO PIN step-up; PIN verification is currently handled entirely within the Tauri desktop frontend (`core-desktop`).
3. **P1 — Admin Router Missing in Axum:** While business verification status can be queried via `/v1/business/verification`, the administrative management router (business approval/rejection, metrics, TOTP admin auth) is not implemented in `api-core` Axum backend.
