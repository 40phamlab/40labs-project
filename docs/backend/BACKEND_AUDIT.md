# 40Labs Backend Infrastructure Audit

Repository: 40phamlab/40labs-project
Checkout: C:\dev\40Labs, HEAD is refs/heads/main
Audit date: 2026-11-10
Scope: API Core, PostgreSQL, SQLite/SQLx, migrations, endpoint/security, sync, infrastructure/deployment, Admin backend, and integration with Core Desktop and Admin Web. Only Core Desktop and Admin Web are treated as API Core consumers. Other apps/future integrations are excluded.
Method: Source/config inspection. No live deployment, production secrets, or production DB accessed. No tests/builds were run; proposed tests below are not represented as passed.

## Executive summary

API Core is one Rust/Axum service backed by PostgreSQL. It implements activation, a limited sync protocol, and a substantial Admin Web API. Core Desktop's operational source of truth is its per-installation SQLx/SQLite database. The inspected desktop API references show activation and Ed25519 grant verification, but no end-to-end client for the mounted cloud sync push route. Admin Web pages use React Query and call API Core. Sync authentication is critically broken: device bearer tokens are unsigned base64 JSON claims. Anyone can fabricate a workspace/business/device identity and invoke sync routes. Sync also accepts client-controlled branch IDs and can change cloud-row ownership on ID conflict. Do not expose sync endpoints to untrusted networks until these are fixed.

Other high-priority risks: production Compose omits Admin Web origin and TOTP encryption key, causing localhost CORS fallback and a known hardcoded TOTP key; Admin RBAC distinguishes admin only for business-verification POST while all roles can read platform-wide records/logs; idempotency can falsely acknowledge rejected or unrelated changes as applied; Core Desktop sync coverage/integration is incomplete; and analytics treats device-submitted summaries as revenue truth. No production migration state, backup, live deployment, or test result was verified.

Finding counts: P0 1, P1 7, P2 6, P3 2. Findings are source-audit conclusions, not dynamic exploit results.

## Actual architecture

    Core Desktop (Tauri/Rust) -- local SQLx --> SQLite (local operational system of record)
       | activation/grant HTTP integration
       | intended cloud sync (outbox exists; end-to-end API client not found)
       v
    API Core (one Rust/Axum process) -- SQLx --> PostgreSQL
       | activation OTP --> NextSMS or console/test provider
       | admin cookie session --> Admin Web React/React Query

Only api-core is an implemented service under services/. sync-service, notification-service and ai-service are placeholders, not independently deployed implementations evidenced in the source tree. PostgreSQL stores activation registry, Admin identities/sessions, platform ops and the partial cloud sync model. SQLite stores desktop operational pharmacy/lab data. Admin Web has no direct DB connection. Root PROJECT.md and 40labs-monorepo-structure.md describe planned services and wider product architecture. No docs/architecture directory exists in this checkout; API docs are under services/api-core/docs and are stale in several places.

## Backend inventory

| Component | Responsibility / status | Data |
|---|---|---|
| services/api-core | Axum routes for activation, device sync, admin, health; OTP provider selection | PostgreSQL |
| services/sync-service | Placeholder directory; no executable found | None |
| services/notification-service | Placeholder; only OTP delivery is integrated in API Core | None |
| services/ai-service | Future placeholder | None |
| infra/docker/compose.dev.yml | PostgreSQL 16 + API; host ports loopback-bound; dev credentials | Dev only |
| infra/docker/compose.prod.yml | Postgres + API, secrets, persistent named volume, non-root/read-only API, dropped capabilities and bounded JSON logs | No backup/restore or monitoring service configured |
| packages/types | TypeScript domain contracts; not generated from Rust/OpenAPI | Contract duplication risk |
| packages/api-client | Small pairing/device-me wrapper. Its route paths are not implemented by API Core | No production Core Desktop Rust call site found |
| Core Desktop | Tauri commands/repositories use SQLite for sales, inventory, customers, lab, audit, etc.; activation client verifies signed grants | Real persisted local records |
| Admin Web | Account, overview, business list/detail, analytics, sync, infrastructure/logs, login use API queries | SQL-backed reads; derived/cache metrics |

## Database schema and migrations

### PostgreSQL

At startup, main.rs executes infra/db/postgres/0001_sync_foundation.sql as raw SQL, then SQLx runs services/api-core/migrations. The raw foundation file is not a versioned SQLx migration. It uses idempotent DDL, but creates business_registry before API migrations add fields. There is a separate initial business_registry definition in service migration 0001, so the effective schema depends on the raw foundation running first. API startup aborts on a migration error. No dedicated migration job or separate runtime/migrator role is defined in source.

| Migration | Purpose / application |
|---|---|
| infra/db/postgres/0001_sync_foundation.sql | business_registry, cloud inventory/prices/history/daily summaries, sync_changes/devices. Raw SQL on every API startup, not in SQLx history. |
| services/api-core/migrations/0001_activation.sql | OTP challenges, verification tokens, initial registry definition. SQLx startup migration. |
| 0002_admin_ops.sql | Admin users/sessions, verification, immutable admin audit, health checks, ops events. |
| 0003_sync_ops.sql | Device telemetry columns and backfill. |
| 0004_analytics_indexes.sql | Analytics indexes. |
| 0005_admin_business_fields.sql | Business name/region/tier/update/TMDA fields. |

PostgreSQL tables: business_registry, cloud_inventory_items, cloud_prices, cloud_price_history, cloud_daily_summaries, sync_changes, sync_devices, otp_challenge, verification_token, admin_users, admin_sessions, business_verification, admin_audit_log, infra_health_checks, ops_events.

### SQLite

There are 31 numbered files under infra/db/sqlite-schema/migrations. apps/core-desktop/src-tauri/src/db.rs sets WAL/foreign keys, uses SQLx migrator, and has special reconciliation for migration 0010. Release mismatch fails closed and leaves data untouched. A debug-only mismatch path closes and removes the development DB before retrying. This behavior is material to data preservation and must stay environment-gated. The actual installed versions/checksums in production or user DBs were not inspected.

| Versions | Migration files |
|---|---|
| 0001–0008 | 0001_init.sql; 0002_lab_order_cancelled_status.sql; 0003_lab_sample_status.sql; 0004_supplier_follow.sql; 0005_notifications.sql; 0006_scheduling.sql; 0007_notification_messages.sql; 0008_auth.sql |
| 0009–0016 | 0009_auth_pin_nullable.sql; 0010_business_registration_fields.sql; 0011_integrations_config.sql; 0012_lab_operations.sql; 0013_staged_notification_attachments.sql; 0014_appearance_system_and_language.sql; 0015_partner_facilities.sql; 0016_notification_threads.sql |
| 0017–0024 | 0017_threads.sql; 0018_dispensing_instructions.sql; 0019_scheduling_enabled_and_attachments.sql; 0020_medicine_image_path.sql; 0021_sample_expiry_and_events.sql; 0022_lab_reports.sql; 0023_marketplace_preview.sql; 0024_lab_workflow_runs.sql |
| 0025–0031 | 0025_lab_stage_attachments.sql; 0026_sync_foundation.sql; 0027_sync_fixup.sql; 0028_branch_code_unique.sql; 0029_app_user_blocked_fields.sql; 0030_user_totp.sql; 0031_idempotency_cache.sql |

SQLite schema families: business/branch/owner/users/credentials/recovery/TOTP/devices/permissions; customer, medicine, inventory, adjustments, prices, sales/lines/receipts; lab catalog/orders/samples/results/reports/QC/workflow/events; suppliers/purchases/marketplace preview; notifications/messages/attachments/threads; schedules; integrations; audit log; sync state/outbox/idempotency; dormant marketplace profiles/listings. These local tables are not all synchronized to API Core.

## Mounted API endpoint inventory

Methods and prefixes are based on Axum routers mounted by services/api-core/src/main.rs and nested admin router. SQL-backed means PostgreSQL; derived metrics may still originate from client-submitted aggregates.

| Method/path | Auth and authorization | Behavior/data |
|---|---|---|
| GET /healthz | Public | Static liveness |
| GET /readyz | Public | PostgreSQL and required-table checks |
| GET /healthz/sms | Bearer equals activation signing key | SMS health/status |
| POST /api/v1/activation/otp/request | Public; per-process phone/IP limits and DB daily count | Stores challenge and sends OTP |
| POST /api/v1/activation/otp/verify | Public; OTP/expiry/attempt/consumed checks | Consumes OTP, creates hashed verification token |
| POST /api/v1/activation/register | Public with verification token | Creates/returns business/workspace/branch and Ed25519 grant |
| GET /v1/health | Public | Static status/time |
| POST /v1/sync/push | Bearer decoded as unsigned base64 device claims | Writes metadata and client-supplied business/inventory/price/history/daily summary rows |
| POST /v1/sync/heartbeat | Same unsigned claims | Upserts request-provided device telemetry |
| GET /v1/business/verification | Same unsigned claims | Registry lookup scoped by claims workspace/business |
| POST /admin/v1/auth/login | Public password; per-process email limiter/lockout | Argon2 verification and short-lived in-memory challenge |
| POST /admin/v1/auth/totp | Challenge + TOTP | 8-hour opaque DB session; HttpOnly SameSite=Strict cookie, Secure in production |
| POST /admin/v1/auth/logout | Valid session middleware | Revokes session and expires cookie |
| GET /admin/v1/auth/sessions | Valid session, no differentiated role | Own session list; insert path does not populate IP/user-agent |
| POST /admin/v1/auth/sessions/:session_id/revoke | Valid session; owner-scoped | Revokes own session |
| GET /admin/v1/me | Valid session | Current identity/role |
| GET /admin/v1/businesses | Valid session; all roles read | SQL-backed registry list |
| GET /admin/v1/businesses/:business_id | Valid session; all roles read | SQL-backed profile/verification |
| GET /admin/v1/businesses/:business_id/stock | Valid session; all roles read | Cloud inventory scoped through registry workspace/branch |
| GET /admin/v1/businesses/:business_id/sync | Valid session; all roles read | Device and recent sync rows scoped through registry |
| GET /admin/v1/businesses/:business_id/activity | Valid session; all roles read | Admin audit rows |
| POST /admin/v1/businesses/:business_id/verification | Valid session; role admin only | Verification update + audit insert |
| GET /admin/v1/overview | Valid session; all roles read | SQL aggregates/cache, heuristic active count, client-submitted summaries |
| GET /admin/v1/analytics/revenue | Valid session; all roles read | Aggregates submitted daily summaries |
| GET /admin/v1/analytics/products | Valid session; all roles read | Inventory/summary aggregates |
| GET /admin/v1/analytics/growth | Valid session; all roles read | Registry/sync aggregates |
| GET /admin/v1/sync/devices | Valid session; all roles read | Device telemetry |
| GET /admin/v1/sync/changes | Valid session; all roles read | Sync change ledger |
| GET /admin/v1/sync/failures | Valid session; all roles read | Sync-related ops events |
| GET /admin/v1/infra/health | Valid session; all roles read | Probe state/history |
| GET /admin/v1/infra/health/history | Valid session; all roles read | Probe latency/status history |
| GET /admin/v1/infra/devices | Valid session; all roles read | Device telemetry |
| GET /admin/v1/infra/logs | Valid session; all roles read | Ops events; redaction is unreliable |

Not API Core routes: packages/api-client defines /api/pairing/health, /api/pairing/pair, /api/v1/devices/me and /api/v1/devices/me/heartbeat; no matching API Core handlers are mounted. LAN routes belong to Core Desktop's LAN server.

### Data reality and client connections

- Admin Web account, overview, business list/detail, analytics, sync and infra/log screens call API Core using React Query and apiFetch. Data is generally live PostgreSQL, with cache/derived metrics. Revenue is based on client-submitted summaries; it is not recomputed from sale rows.
- Core Desktop modules with SQLite repositories/Tauri commands include business, branch, user/auth/recovery/device, customers, inventory/stock adjustments, sales, purchases/suppliers, laboratory orders/samples/results/reports/QC, notifications/messages/attachments, schedules, integrations, audit and sync state/outbox. These are persisted local workflows, not Admin Web cloud endpoints. Its inspected API client references are activation/grant code. Sync store/outbox and schema exist, but no end-to-end API Core push client call path was found. This is evidence of incomplete integration, not proof that no future or external transport exists.
- admin-demo-seed creates synthetic business/status/telemetry/summary/log records, guarded from APP_ENV=production. Startup also sends a hardcoded test SMS to 255712345678. No fixture substitution was found in Admin Web page query paths.

## Security findings

### P0-1 — Forged device token allows arbitrary sync identity

Evidence: services/api-core/src/auth/device.rs:25-55 decodes bearer as base64 JSON and contains a TODO to replace verification. There is no signature, expiry, issuer/audience, device registry check, or revocation. Sync handlers trust claims.

Impact/reproduction: base64-encode JSON with arbitrary nonempty workspace_id/business_id/device_id and call sync routes. The extractor accepts it. An attacker can impersonate another workspace and perform cloud writes; this is a critical tenant boundary failure.

Fix: signed short-lived tokens from server-controlled enrollment, strict issuer/audience/expiry, binding to enrolled device/workspace/business/branch, and revocation check. Do not authorize raw client claims.

Required tests: forged/tampered/expired/wrong issuer/wrong audience/revoked token rejection; valid token acceptance; cross-tenant reads and writes denied.

Files: services/api-core/src/auth/device.rs, activation/device provisioning routes, sync/push.rs, sync/apply.rs, Postgres auth/device migration, desktop token issuance/storage.

### P1-1 — Cross-branch writes and ownership reassignment

Evidence: DeviceClaims has no branch (auth/device.rs:10-14). apply_change validates workspace only (sync/apply.rs:132-169); inventory/price upserts accept payload branch and overwrite workspace/branch on conflict (apply.rs:247-255,309-315). Sync metadata writes empty branch IDs.

Impact: authorized device can send a different branch, and ID conflicts can reassign rows; P0 makes cross-workspace impersonation immediate too.

Fix: bind branch to trusted device context; enforce on every entity and conflict path; prevent payload ownership columns from changing.

Required tests: same-workspace branch isolation; cross-workspace conflicting IDs; valid branch success; mismatch rejected without mutation.

Files: auth/device.rs, sync/apply.rs, sync/push.rs, PostgreSQL schema/migration, desktop sync contract.

### P1-2 — Production config silently uses known defaults and localhost CORS

Evidence: infra/docker/compose.prod.yml:38-51 does not pass ADMIN_WEB_ORIGIN or TOTP_ENC_KEY. services/api-core/src/config.rs:69-70 defaults origin to http://localhost:5174 and TOTP key to a checked-in constant. Production startup validates activation signing key but not these values. main.rs admin-seed prints password and TOTP secret to stdout (lines 84-118).

Impact: hosted Admin Web is blocked by CORS absent undocumented external injection; stored TOTP secrets remain decryptable using known key. Key changes need re-enrollment/rotation handling.

Fix: require explicit production HTTPS origin and non-default TOTP secret; wire via production secrets; fail startup otherwise; document rotation and secure seed handling.

Required tests: production missing/default values fail; allowed CORS origin exact; TOTP encrypt/decrypt and rotation lifecycle.

Files: config.rs, main.rs, infra/docker/compose.prod.yml, deployment secrets/runbook.

### P1-3 — Admin RBAC missing for reads and non-verification capabilities

Evidence: services/api-core/src/admin/mod.rs:18-62 authenticates sessions but only restricts POST path containing verification to role admin. All roles can read all businesses, stock, sync, activity, analytics and logs. No government/enterprise access grant scopes found.

Impact: restricted/viewer accounts access platform-wide operational and business data; external roles are not limited to approved businesses or aggregates.

Fix: default-deny capability policy, per-role route access, scoped access grants and aggregate-only external query path.

Required tests: role-by-route matrix; IDOR business IDs; external scope; admin-only verification mutation.

Files: admin/mod.rs and all admin handlers, authz migration, account provisioning.

### P1-4 — Idempotency falsely acknowledges rejected/unrelated changes

Evidence: services/api-core/src/sync/apply.rs:107-129 inserts globally unique change_id before payload validation. Duplicate ID always returns applied without matching workspace/device/payload or stored outcome. Rejected validation returns normally after insert, and savepoint is released; a corrected retry is then acknowledged applied although not applied. batch_id/op are not semantically used; server_cursor is wall-clock time rather than durable cursor.

Impact: lost retries and divergent cloud/local state; global key collision can poison acknowledgments across tenants.

Fix: scope idempotency by authenticated workspace/device; persist actual outcome; validate before commit; stable cursor/sequence; validate operation and ownership.

Required tests: rejected then corrected retry; duplicate across tenant/device; duplicate applied payload; changed payload same key; rollback and cursor pagination.

Files: sync/apply.rs, sync/push.rs, sync/validate.rs, Postgres migrations, SQLite outbox contract.

### P1-5 — Request device ID is not bound to claim; device enrollment/revocation is absent

Evidence: sync/push.rs:62-95 checks claims but upserts req.device_id; heartbeat similarly takes body device ID (lines 170-190). `infra/db/postgres/0001_sync_foundation.sql` defines `device_id` as the `sync_devices` primary key and has no workspace uniqueness constraint, so the schema already permits multiple devices per workspace. The issue is the missing enrollment-to-claim check and revocation model, not device-row cardinality.

Impact: telemetry/device association can be spoofed; a valid multi-device schema row is not sufficient authentication or branch authorization.

Fix: derive device ID from verified context, reject body mismatch, bind each credential to its active enrollment and branch, and support revocation. Preserve the existing `device_id`-keyed multi-device model.

Required tests: body ID mismatch; concurrent devices; revoked device; no conflict reassignment.

Files: sync/push.rs, Postgres device enrollment migration, device enrollment routes and Admin revocation.

### P1-6 — Core Desktop has no observed end-to-end API sync path and server sync covers only five entities

Evidence: Core Desktop Rust references to API resolve to activation client/grant verification. Sync state/outbox/schema exist, but no call site for /v1/sync/push found. Server handles business, inventory_item, price, price_history and daily_summary only; no sales/receipts, customers, lab orders/results, or audit event sync.

Impact: no evidence local outbox is drained/acknowledged; Admin cloud view cannot reflect complete pharmacy/lab MVP truth.

Fix: define replication boundary; implement durable upload/ack/pull/cursor/conflict behavior and wire desktop outbox. Add required domain entities before representing cloud data as complete.

Required tests: offline write → upload → persisted ack → restart/retry; conflict/replay; sale and lab lifecycle; branch isolation; partial batch reject.

Files: apps/core-desktop/src-tauri/src/sync/* and service transport; services/api-core/src/sync/*; Postgres schema/migrations; shared client/types.

### P1-7 — Client-submitted summary is treated as platform revenue truth

Evidence: sync/apply.rs accepts daily_summary values; admin/analytics.rs aggregates cloud_daily_summaries. PostgreSQL cloud schema contains no synced sale/line records used for independent calculation.

Impact: an authorized client can alter summaries and inflate platform analytics; currently any forged identity can do so. This is live DB data but not independently verified sales.

Fix: label as submitted/unreconciled estimates or sync immutable sales/receipts and derive summaries on server with dedupe and audit.

Required tests: totals reconcile against sales; duplicate/out-of-order/correction behavior; unreconciled values not reported as verified revenue.

Files: sync/apply.rs, admin/analytics.rs, PostgreSQL migration, packages/types analytics contracts and Admin labels if estimate semantics selected.

### P2-1 — Rate limiting and lockouts are per-process

Evidence: RateLimiter and admin challenges/login failures/lockouts are memory state initialized in main.rs. OTP/admin limits split across replicas and reset on restart; TOTP handler has no separate distributed failure counter. OTP attempts are read then updated, permitting concurrent race.

Fix: shared atomic DB/cache counters, trusted proxy IP handling, challenge cleanup and conditional attempt updates.

Tests: multi-instance/restart limits, concurrent OTP/TOTP failures, proxy spoof resistance, expiry cleanup.

Files: ratelimit.rs, main.rs, routes/activation.rs, admin/auth.rs, migration/shared cache config.

### P2-2 — No backup/restore implementation found

Evidence: prod Compose persists a Postgres volume but no backup, WAL/PITR, off-host encrypted copy, retention or restore drill exists in infra inventory.

Impact: volume loss can remove all cloud registry/admin/sync data; recovery objectives are undefined.

Fix: managed Postgres or encrypted scheduled backup + WAL/PITR, retention/alerts and restore runbook.

Tests: isolated restore, integrity, retention, documented RPO/RTO exercise.

Files: infra/docker/compose.prod.yml or managed DB IaC, backup scripts/runbook, ops workflow.

### P2-3 — No least-privilege runtime DB role or DB-level tenant backstop found

Evidence: API applies DDL via runtime connection at startup; no separate role/grants or row-level security migrations found. Dev Compose uses postgres superuser. Production secret grants were not inspected and are not assumed to be superuser.

Impact: API compromise may gain DDL; application predicate omissions have no database tenant boundary backstop.

Fix: separate migrator/runtime accounts, least privilege, consider RLS with transaction scope, restrict DB network access.

Tests: runtime DDL denial; migration role success; RLS missing/wrong workspace/branch tests.

Files: new grants/RLS migration, main.rs migration startup, deployment workflow/Compose.

### P2-4 — Log redaction does not reliably remove secret values

Evidence: admin/infra.rs redact_text checks lowercased text but replaces case-sensitively; replacing the word token leaves the value after it, and uppercase variants remain. Sync error strings are also saved to ops_events/tracing. All authenticated roles may read logs.

Impact: credentials/identifiers in messages or provider/SQL errors can survive redaction and be returned from Admin API.

Fix: structured allow-listed fields; never log auth/body/secret values; robust case-insensitive key-value redaction; sanitize errors and role-restrict logs.

Tests: secret canaries in mixed-case headers/key-values never appear in stored log or response; DB errors omit bound values; unauthorized role cannot read.

Files: admin/infra.rs, sync/push.rs, admin/auth.rs, logging configuration/RBAC.

### P2-5 — Activation grant has no explicit expiry/audience/version

Evidence: grant.rs payload includes issued_at only; no expiry, issuer, audience, version or jti. Desktop verifies Ed25519 signature but API has no exchange/enrollment/revocation route; sync uses a different unsigned token.

Impact: copied signed grant has no explicit time limit and cannot support defined session/device lifecycle.

Fix: versioned grant with expiry/audience/device binding and one-time enrollment/exchange, revocation and key IDs/rotation.

Tests: expiry/replay/audience/key rotation and exchange/revocation.

Files: grant.rs, activation routes, desktop activation/http_client.rs, device enrollment schema/routes.

### P2-6 — API docs and OpenAPI materially drift from mounted routers

Evidence: API_INDEX/API_ADMIN describe admin management as unmounted although main.rs mounts current admin router. Shared api-client exposes endpoints absent in API Core. Sync contract docs omit required fields and do not surface unsigned token flaw.

Fix: generate/validate OpenAPI from actual route schemas and separate desktop LAN routes from API Core.

Tests: route/method/auth/payload parity in CI, schema contract tests.

Files: services/api-core/docs/openapi.yaml, API_INDEX.md, API_ADMIN.md, API_SYNC.md, packages/api-client, .github/workflows/ci.yml.

### P3-1 — Startup sends live SMS to a hardcoded number

Evidence: main.rs invokes provider send to 255712345678 during startup; production Compose configures live SMS.

Impact: restarts can send unsolicited SMS and incur cost; not a clean health probe.

Fix: provider config-only health check or explicit opt-in test recipient; no live sends on ordinary startup.

Tests: production startup makes zero SMS sends; configuration failures are reported safely.

Files: main.rs and SMS provider health interface/config.

### P3-2 — Ops health metric semantics and retention are hardcoded

Evidence: infra probe counts all sync_changes in last hour as failure count; code deletes health history after 7 days and ops events after 14 days. No metrics exporter/alert backend is configured.

Impact: dashboard may mislabel normal sync volume as failures; no alert or retention control.

Fix: count explicit rejection/error statuses, name metrics accurately, configure retention and export/alerts.

Tests: applied/rejected fixtures, retention boundaries, outage alert smoke.

Files: admin/infra.rs, sync status schema, prod monitoring config/runbook.

## Requested security checklist

| Area | Result |
|---|---|
| Forged device token | Confirmed P0: unsigned base64 claims accepted. |
| JWT/signature/expiration | Admin uses opaque random DB session, not JWT. Activation grant uses Ed25519 but has no expiry. Device bearer has no signature or expiry. |
| Session hijacking/revocation | Admin cookie HttpOnly/SameSite=Strict; Secure in prod; session expiry/revocation/disabled user checked. Logout and own session revocation exist. Device revocation absent. |
| Password/recovery | Admin Argon2. No Admin reset/recovery endpoint found. Desktop local recovery-code schema exists, not API Core recovery. Seed prints credentials/factor. |
| TOTP | totp-rs current code; encrypted AES-GCM code path; prod uses known fallback key unless separately injected. In-memory challenge and no distributed TOTP lockout. |
| RBAC | Only verification POST is admin-only; broad all-role reads. Device routes unauthenticated in practice due forged claims. |
| SQL injection | Inspected handler SQL uses binds/QueryBuilder; business sort is allow-listed; savepoint name is generated UUID. No injectable interpolation found in inspected paths. Source review, not scanner result. |
| Cross-workspace/branch | Confirmed risks: forged tenant claims, untrusted branch fields and ownership-changing upserts. |
| IDOR | Platform-wide business IDs readable by any authenticated admin role; no external grant scope. |
| File upload | No API Core upload route found. Desktop attachments are local functionality. |
| Secrets/logs | Checked-in TOTP fallback key; dev DB credential defaults; redaction flawed; explicit seed prints secrets. No .env/production secret values were read. |
| CORS/cookie | Single configured origin + credentials; prod compose omission falls back localhost. Cookie flags are mostly sound; no CSRF token, with JSON/CORS/SameSite as current controls. |
| Rate limit | Exists but per process, not durable/distributed. |
| Sync replay | Global change ID, rejected-ID poisoning, false applied ack, non-durable cursor. |
| DB permissions | No RLS/grants found; runtime applies migrations. Actual production grants unknown. |
| Backups | Persistent volume only; no backup/restore evidence. |

## Missing MVP functionality

1. Secure device enrollment/token issue/expiry/revocation and branch binding.
2. Complete sync read/pull, cursor, conflict resolution, retries and desktop outbox integration.
3. Cloud replication for key MVP sales/receipt, customer, lab and audit workflows.
4. Server-verified or explicitly unreconciled revenue analytics.
5. Admin least privilege and scoped Gov/Enterprise access approvals.
6. Admin password recovery, TOTP lifecycle/key rotation and session metadata.
7. Production migration job/least-privilege DB accounts and actual migration compatibility checks.
8. Backup/PITR, restore procedure and recovery objectives.
9. Production config fail-fast for Admin origin and TOTP key.
10. Generated shared API contracts and CI route/auth schema parity.

## Recommended implementation sequence / dependencies

1. Contain sync exposure, replace unsigned token parsing with signed enrolled-device auth. Nothing downstream is trustworthy until this is done.
2. Bind workspace/business/branch server-side and make every mutation/read and conflict path enforce scope; add isolation tests before re-enabling public sync.
3. Fix idempotency, actual result persistence, cursor and device identity semantics; then connect desktop outbox.
4. Make production config fail-closed, split DB roles, add backups and restore. Do before production customer data.
5. Enforce Admin capabilities/scopes and protect logs/business records.
6. Complete cloud MVP entity sync and offline/retry parity.
7. Reconcile analytics against authoritative sales or label summaries as estimates.
8. Add distributed abuse controls, safe logging, meaningful monitoring and remove live SMS startup probe.
9. Generate OpenAPI and enforce route/type parity in CI.

## Exact files to change

| Priority | Files |
|---|---|
| P0-1 | services/api-core/src/auth/device.rs; activation/device enrollment routes; sync/push.rs; sync/apply.rs; new Postgres auth/device migration; desktop token handling |
| P1-1 | auth/device.rs; sync/apply.rs; sync/push.rs; Postgres migration; shared sync contract |
| P1-2 | services/api-core/src/config.rs; main.rs; infra/docker/compose.prod.yml; deployment secret docs |
| P1-3 | services/api-core/src/admin/mod.rs and admin/auth.rs, businesses.rs, analytics.rs, sync.rs, infra.rs; authz migration |
| P1-4 | services/api-core/src/sync/apply.rs, push.rs, validate.rs; Postgres migration; SQLite outbox contract |
| P1-5 | services/api-core/src/sync/push.rs; Postgres sync schema/migration; device enrollment and Admin views |
| P1-6 | apps/core-desktop/src-tauri/src/sync/* and transport scheduling; services/api-core/src/sync/*; Postgres migration; packages/api-client and shared types |
| P1-7 | services/api-core/src/sync/apply.rs; src/admin/analytics.rs; Postgres migration; packages/types analytics contract |
| P2-1 | services/api-core/src/ratelimit.rs, main.rs, routes/activation.rs, admin/auth.rs; shared limiter/migration |
| P2-2 | infra/docker/compose.prod.yml or managed DB IaC; new backup scripts/runbook and operations workflow |
| P2-3 | New DB grants/RLS migration; services/api-core/src/main.rs migration deployment; deployment workflow/Compose |
| P2-4 | services/api-core/src/admin/infra.rs, sync/push.rs, admin/auth.rs; logging config and RBAC |
| P2-5 | services/api-core/src/grant.rs; routes/activation.rs; apps/core-desktop/src-tauri/src/activation/http_client.rs; enrollment schema/routes |
| P2-6 | services/api-core/docs/openapi.yaml, API_INDEX.md, API_ADMIN.md, API_SYNC.md; packages/api-client; .github/workflows/ci.yml |
| P3-1 | services/api-core/src/main.rs; SMS provider health/config interface |
| P3-2 | services/api-core/src/admin/infra.rs; sync status schema; monitoring config/runbook |

## CI and verification state

The only checked-in workflow found is .github/workflows/ci.yml. It installs Node/pnpm, builds Core Desktop frontend and runs pnpm test. It does not set up Rust, run API Core tests, compile SQLx, start PostgreSQL to apply migrations, verify OpenAPI parity, or run Docker/restore tests. API tests exist at services/api-core/tests/{activation_test,admin_test,sms_test,sync_test}.rs. SQLite DB/migration tests are in apps/core-desktop/src-tauri/src/db.rs. Their pass/fail state is unverified here.

## Limitations

This report audits checked-out source/config, not a remote clone, deployed binary, production DB/migration history, network surface, or production secret values. SQL injection review is source-based. Confirm findings against the deployed image/config and applied schema before closure.
