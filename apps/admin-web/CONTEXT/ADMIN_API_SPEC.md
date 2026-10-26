# Admin API Spec: `/admin/v1` (router in services/api-core)

Base: `services/api-core/src/admin/` (mod.rs, auth.rs, businesses.rs, analytics.rs, sync.rs, infra.rs).
All routes except `/healthz`, `/readyz`, and auth login require a valid admin session + completed TOTP.
Pagination: `?page=1&page_size=25` → `{ data: [], page, page_size, total }`. Errors: `{ error: { code, message } }`.

## Auth
| Method | Path | Notes |
|---|---|---|
| POST | /admin/v1/auth/login | email+password → `{ mfa_required: true, challenge_id }` |
| POST | /admin/v1/auth/totp | challenge_id + 6-digit code → session cookie (HttpOnly, Secure, SameSite=Strict) |
| POST | /admin/v1/auth/logout | |
| GET | /admin/v1/me | |
Rate-limit login (5/min/IP + per email). Lock account after 10 failures for 15 min. First admin created via CLI seed command, never via API.

## Overview
GET /admin/v1/overview → KPI numbers + `needs_attention[]`.

## Businesses
| Method | Path | Notes |
|---|---|---|
| GET | /businesses | filters: q, status, region, tier, sort |
| GET | /businesses/:business_id | profile + verification block |
| GET | /businesses/:business_id/stock | summary + paginated items (read-only) |
| GET | /businesses/:business_id/sync | devices + last changes |
| POST | /businesses/:business_id/verification | body `{ decision: "verified"|"rejected"|"suspended", reason? }`. Reason required for reject/suspend. Writes audit row in same transaction. Idempotent on same decision. |

New migration `0002_admin_ops.sql` (Postgres):
- `admin_users(id, email unique, password_hash argon2id, totp_secret_enc, role, disabled_at, created_at)`
- `admin_sessions(id, admin_user_id, expires_at, ip, user_agent, revoked_at)`
- `business_verification(business_id pk, status default 'pending', reason, decided_by, decided_at)`
- `admin_audit_log(id, admin_user_id, action, target_type, target_id, payload jsonb, created_at)` + triggers blocking UPDATE/DELETE
- `infra_health_checks`, `ops_events` (see ADMIN_INFRA_MONITORING.md)
Verify existing cloud business table for any overlapping verification columns first. Do not duplicate; flag if found.

## Analytics (aggregated only; computed from `daily_summary` + cloud mirror tables)
GET /analytics/revenue?range=7d|30d|90d&group=day|week|region
GET /analytics/products?metric=units|revenue|stockouts&limit=20
GET /analytics/growth?range=
Add indexes needed for these. Cache responses 60s in memory.

## Sync
GET /sync/devices, GET /sync/changes?entity=&business_id=, GET /sync/failures

## Infra
GET /infra/health, GET /infra/health/history?check=&hours=, GET /infra/heartbeats?business_id=, GET /infra/logs (see monitoring spec)

## Public (no auth, for orchestrators and uptime monitors)
GET /healthz → `200 {"status":"ok"}`, process alive only, no DB.
GET /readyz → `200/503`, checks DB, migration version, sync tables. No sensitive detail in the body.

## Security checklist
- CORS: allow only the admin-web origin from env `ADMIN_WEB_ORIGIN`
- Every query parameterized (sqlx); no string-built SQL
- No endpoint returns patient, customer, or prescription fields. Add a test that scans response JSON of every admin route for forbidden keys (`customer`, `patient`, `phone`, `prescription`)
- Admin routes mounted behind one middleware layer, not per-handler checks
