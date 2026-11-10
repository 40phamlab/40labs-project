# Security Remediation 01 — Device Authentication and Tenant Isolation

Date: 2026-11-10
Branch: `main`
Scope: API Core device authentication, device enrollment/revocation, PostgreSQL sync writes, and the Core Desktop credential handoff. No production data or production secrets were changed.

## Executive summary

The unsigned Base64 JSON device bearer was replaced with server-issued HS256 JWT access credentials backed by a PostgreSQL enrollment record. Activation grants are now versioned, issuer/audience-bound, short-lived Ed25519 credentials consumed once at enrollment. Refresh tokens are random, hashed at rest, and rotated. Every authenticated device request verifies JWT signature, algorithm, issuer, audience, expiry, issue time, maximum lifetime, token format version, device token version, enrollment state, and the database-bound business/workspace/branch/device tuple.

Sync push and heartbeat now require the body device ID to match the authenticated device. Sync writes check exact workspace and branch scope, check existing record ownership before updates, derive ownership and source-device fields from verified claims, and transact each push with savepoints. Change idempotency is device-scoped and binds a digest of the accepted payload. An admin-role-only revocation endpoint invalidates access and refresh credentials.

The new API Core PostgreSQL integration test passed against a disposable PostgreSQL 16 container. The API Core full suite and Core Desktop Rust compilation passed. The initial integration runs exposed previously broken database type/schema assumptions; those are corrected in migration `0006` and the sync payload decoding.

## Credential and route contract

| Route | Method | Authentication | Behavior |
|---|---|---|---|
| `/api/v1/activation/otp/request` | POST | Public; phone/IP rate limits | Existing OTP request |
| `/api/v1/activation/otp/verify` | POST | Public; OTP code | Issues temporary verification token |
| `/api/v1/activation/register` | POST | Verification token | Returns version 2, five-minute Ed25519 activation grant |
| `/v1/devices/enroll` | POST | One-time signed activation grant | Confirms registry scope, consumes grant, enrolls device, returns 15-minute access JWT and 90-day refresh token |
| `/v1/devices/refresh` | POST | Device ID plus rotating refresh token | Checks enrollment/revocation/expiry and rotates token atomically |
| `/v1/sync/push` | POST | Active enrolled-device JWT | Tenant/branch-checked mutation batch |
| `/v1/sync/heartbeat` | POST | Active enrolled-device JWT | Updates only the authenticated device telemetry row |
| `/v1/business/verification` | GET | Active enrolled-device JWT | Reads only the authenticated business/workspace/branch record |
| `/admin/v1/sync/devices/{device_id}/revoke` | POST | Admin Web session; `admin` role | Revokes one device and increments its device token version |

JWT header: `alg=HS256`, `typ=JWT`, `kid=<key id>`. Claims: `iss=40labs-api-core`, `aud=40labs-sync`, `sub=device_id`, `jti`, `iat`, `exp`, `ver=1` (JWT contract version), `device_ver` (enrollment version), and the device/business/workspace/branch identifiers. Device credentials are never derived from request-supplied scope. Desktop stores credentials in the operating-system keyring; local SQLite workflows remain available offline.

## Findings addressed

### P0 — Forged device authentication and untrusted identity

**Before:** `services/api-core/src/auth/device.rs` accepted unsigned Base64 JSON claims. Any caller could mint a workspace/device identity.

**Change:** `services/api-core/src/auth/device.rs`, `services/api-core/src/config.rs`, `services/api-core/src/routes/device.rs`, and `services/api-core/src/main.rs` now issue and verify standard HS256 JWTs and look up active device enrollments on every authenticated request. Production startup fails closed unless an active 32-byte-or-longer signing key is configured. Key IDs support staged rotation; unknown/removed IDs fail verification.

**Tests:** fabricated Base64 rejected, changed JWT rejected, expired token rejected, wrong issuer/audience rejected, unsupported JWT version/unknown key rejected, valid signed token accepted, and revoked enrollment rejected.

### P0 — Workspace/branch data leakage or reassignment through sync

**Before:** sync scope did not include branch; entity upserts could update owner fields, and checks were not uniform across business, inventory, prices, price history, and daily summaries.

**Change:** `services/api-core/src/sync/push.rs` and `services/api-core/src/sync/apply.rs` use verified claim scope. Payload scope must match the claims; business updates use authenticated business ID. Existing IDs and parent inventory rows are checked for workspace and branch ownership before update. Upserts do not update ownership fields. Source device IDs come from claims. Unambiguous existing record ownership cannot be reassigned by ID. Failed change work is rolled back to its savepoint. Request-body device ID mismatch is rejected for push and heartbeat.

**Tests:** PostgreSQL route integration exercises valid enrollment, two devices in distinct scopes, body device impersonation, cross-workspace push, cross-branch push, an existing record ID collision from another tenant, successful authorized-branch inventory upsert, revoked device rejection, and persisted-record unchanged assertions for denied changes.

### P1 — Replay and duplicate mutation ambiguity

**Before:** sync idempotency used globally unique change IDs and did not bind retries to original scope/content or consistently retain an outcome.

**Change:** `services/api-core/migrations/0006_device_credentials.sql` scopes the primary key to `(device_id, change_id)` and stores payload digest/status/reason. A retry with different tenant, entity, version, ID, or payload is a conflict. A same-content retry returns the prior status.

**Test coverage:** migration applied in isolated PostgreSQL and integration push behavior exercised; additional explicit same-ID/different-payload replay assertions remain in the follow-up list.

### P1 — No supported enrollment, refresh, or revocation lifecycle

**Change:** version 2 activation grants expire within five minutes and are single-use. New enrollment, refresh rotation, and admin revocation routes are mounted. Desktop validates the signed scope against the registration response, enrolls its stable keyring-backed device ID, stores the credentials in the OS keyring, and has a refresh command that replaces credentials after rotation. No unsigned fallback remains.

**Test coverage:** grant signing/tamper tests, token verification tests, seeded enrolled-device acceptance/revocation integration. Enrollment-route replay, refresh rotation, and admin-role revocation route integration tests remain follow-up items.

### P1 — Sync implementation/schema mismatch blocked valid updates

**Evidence:** the disposable PostgreSQL run found `business_registry.version` and fields used by the business sync handler were absent, cloud timestamp columns were bound as text, and cloud entity versions were PostgreSQL `INTEGER` while handlers decoded `i64`.

**Change:** migration `0006_device_credentials.sql` adds the business sync and verification columns additively and widens cloud entity versions to `BIGINT`. `services/api-core/src/sync/apply.rs` decodes timestamps/date values to matching chrono types and binds authenticated device identity. Valid inventory apply now succeeds in PostgreSQL integration.

## Migration inventory and safety

Created `services/api-core/migrations/0006_device_credentials.sql` as a SQLx versioned migration. It adds device enrollment and consumed-grant tables, enrollment/revocation/refresh metadata, device business binding, sync result/digest columns, branch backfill only when registry mapping is unambiguous, tenant indexes, the business sync columns, and type widening. Existing customer rows and sync history are retained. It drops/replaces only the sync idempotency primary-key constraint; because the previous primary key guaranteed unique `change_id`, all pre-existing rows remain representable under the new composite key.

`services/api-core/src/migrations.rs` keeps the existing raw foundation SQL for pre-SQLx installations and runs subsequent changes with SQLx tracking. No destructive down migration is provided. Before deployment, take and verify a backup. Rollback requires stopping writers and restoring a tested pre-migration database backup to a separate target before deploying the old binary; do not drop enrollment/history tables as rollback.

## Tests and verification

Executed on this worktree:

- `rustfmt --edition 2021 --check` on all changed Rust source and test files — passed.
- `cargo check -p api-core` — passed (existing dead-code/unused-mut warnings remain in sync payload definitions).
- `cargo test -p api-core` — passed: 7 library tests, 4 activation tests, 11 admin tests, 1 PostgreSQL security integration test, 8 SMS tests, 3 sync tests; doc tests passed.
- PostgreSQL integration ran with `API_CORE_TEST_DATABASE_URL` pointed to a disposable PostgreSQL 16 Docker container with no persistent volume. The test applied the raw foundation and all SQLx migrations from a fresh schema.
- `cargo check --manifest-path apps/core-desktop/src-tauri/Cargo.toml` — passed after the final Desktop refresh/registration changes; the intermediate private-interface warning was corrected.
- `docker compose --env-file infra/docker/.env.example -f infra/docker/compose.dev.yml config --quiet` — passed.

No claim is made that the entire repository test suite or production deployment was exercised. No production database, production credentials, or production deployment was touched.

## Remaining risks and coverage gaps

1. No API Core sync-pull/read endpoint or Desktop HTTP sync transport was found in the current implementation; Desktop local outbox remains offline-first. Device auth is ready for protected calls, but the future sync transport must use the stored bearer and refresh before expiry.
2. Enrollment and refresh routes have no dedicated route-level rate limiter. Refresh-token entropy and hashing reduce guessing risk, but rate limiting and abuse monitoring should be added.
3. PostgreSQL tenant rules are enforced in the API; database row-level security and separate least-privilege DB roles are not introduced here. A compromised API database credential can bypass handler predicates.
4. `ApiError::Database` currently serializes database error details to callers. This is an existing API-wide behavior and should be changed to generic client errors with detailed server-side logging.
5. Integration coverage exercises authenticated verification reads and the inventory upsert path. Price, history, summary, business handler, enrollment replay, refresh rotation, and admin revocation route need explicit end-to-end regression cases, even though their authorization checks were updated.
6. Key rotation requires retaining old verification keys only for the access-token lifetime; activation Ed25519 public-key rotation requires a coordinated Desktop release. Production operators must provision the new device-token secret file before deploying the configured Compose stack.

## Prioritized implementation plan

| Priority | Work | Dependencies | Files |
|---|---|---|---|
| P0 | Land signed enrollment and tenant-safe sync implementation; verify production key provisioning before deployment | Migrations and secret delivery must precede API rollout; Desktop release must precede enrollment cutover | `services/api-core/src/auth/device.rs`, `services/api-core/src/grant.rs`, `services/api-core/src/config.rs`, `services/api-core/src/routes/device.rs`, `services/api-core/src/sync/push.rs`, `services/api-core/src/sync/apply.rs`, `services/api-core/migrations/0006_device_credentials.sql`, `infra/docker/compose.prod.yml`, `infra/docker/secrets/device_token_signing_keys.txt` (deployment-created, not created by this task), Desktop paths below |
| P1 | Add explicit integration tests for refresh rotation, grant replay, admin revocation roles, price/history/summary/business ownership, and idempotency digest conflicts | Disposable PostgreSQL test DB and signed enrollment fixture | `services/api-core/tests/device_security_test.rs`, `services/api-core/src/routes/device.rs`, `services/api-core/src/admin/sync.rs`, `services/api-core/src/sync/apply.rs` |
| P1 | Connect the Desktop sync worker to protected API push/heartbeat and automatic refresh without making local operations online-dependent | Device credential storage and refresh contract delivered by this change | `apps/core-desktop/src-tauri/src/sync/`, `apps/core-desktop/src-tauri/src/activation/http_client.rs`, `apps/core-desktop/src-tauri/src/commands/registration_cmd.rs`, `apps/core-desktop/src-tauri/src/security/keystore.rs`, `packages/api-client/` |
| P2 | Add server-side rate limits/abuse telemetry for enrollment and refresh; add least-privilege database roles or RLS | Production deployment topology and tenant policy review | `services/api-core/src/routes/device.rs`, `services/api-core/src/config.rs`, `infra/db/postgres/`, `infra/docker/compose.prod.yml` |
| P2 | Stop exposing SQL driver details in client responses | Central error contract review | `services/api-core/src/error.rs`, API error tests |
| P3 | Add migration upgrade rehearsal with production-sized anonymized data and restore rehearsal | Backup and staging DB | `services/api-core/migrations/0006_device_credentials.sql`, `services/api-core/src/migrations.rs`, deployment runbooks |

## Exact files changed in this remediation

- `services/api-core/Cargo.toml`, `Cargo.lock`
- `services/api-core/src/auth/device.rs`, `src/config.rs`, `src/grant.rs`, `src/lib.rs`, `src/main.rs`, `src/migrations.rs`
- `services/api-core/src/routes/activation.rs`, `src/routes/device.rs`, `src/routes/mod.rs`
- `services/api-core/src/admin/mod.rs`, `src/admin/sync.rs`
- `services/api-core/src/sync/apply.rs`, `src/sync/push.rs`
- `services/api-core/migrations/0006_device_credentials.sql`
- `services/api-core/tests/activation_test.rs`, `tests/sync_test.rs`, `tests/device_security_test.rs`
- `services/api-core/docs/DEVICE_AUTH.md`, `docs/API_AUTH.md`, `docs/API_SYNC.md`, `docs/openapi.yaml`
- `apps/core-desktop/src-tauri/src/activation/dev_client.rs`, `activation/http_client.rs`, `activation/mod.rs`
- `apps/core-desktop/src-tauri/src/commands/registration_cmd.rs`, `security/keystore.rs`, `src/lib.rs`
- `infra/docker/compose.dev.yml`, `compose.prod.yml`, `.env.example`
- `docs/backend/SECURITY_REMEDIATION_01.md`
- `docs/backend/BACKEND_AUDIT.md` (corrected the device-cardinality statement against the foundation schema)
