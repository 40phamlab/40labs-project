# 40Labs API Core reference

The Admin Web API's current route-by-route contracts, authorization matrix, and unavailable operations are documented in [ADMIN_WEB_API_STATUS.md](ADMIN_WEB_API_STATUS.md).

This reference describes the API currently mounted by `services/api-core`. It is an implementation inventory, not a claim that every planned MVP domain is available. The service currently exposes activation, device credentials, device cloud sync, infrastructure probes, and the platform admin console. Core Desktop's operational workflows are local SQLite/Tauri APIs; they do not currently have corresponding cloud REST endpoints.

## Conventions

- JSON requests and responses use `Content-Type: application/json`, except gzip-compressed sync push requests.
- Admin errors are generally `{ "error": { "code": string, "message": string } }`. Activation/device errors are `{ "error": string, "message": string, "retry_after"?: number }`. Some admin handlers still return bare status codes; see the limitations section.
- Authentication failures return HTTP 401; role-policy failures return HTTP 403. Database failures should return HTTP 500. HTTP 429 may include `Retry-After`.
- UUIDs and timestamps are represented as strings. Pagination is explicitly documented per endpoint.
- CORS is configured for the Admin Web origin. It is not a substitute for authentication.

## Authentication schemes

| Scheme | Used by | Credential |
|---|---|---|
| Public | health, activation, admin login/MFA challenges | No credential. Activation is rate-limited and OTP-gated. |
| Device bearer | `/v1/sync/*`, `/v1/business/verification` | `Authorization: Bearer <device access token>` issued by device enrollment. Claims scope every operation to the enrolled device, workspace, business, and branch. |
| Admin session | `/admin/v1/*` except login/MFA challenge routes | `admin_session` HttpOnly cookie, or `Authorization: Bearer <session-id>`. Admin sessions expire after 8 hours. Role policy is default-deny. |
| Activation signing key | `GET /healthz/sms` | `Authorization: Bearer <ACTIVATION_SIGNING_KEY>` |

## Health and activation

### `GET /healthz`

Public liveness check. No request body. Returns `200 {"status":"ok"}`.

### `GET /readyz`

Public readiness check; verifies database connectivity. Returns `200 {"status":"ready"}` or `503` if unavailable.

### `GET /healthz/sms`

Requires activation signing key bearer authentication. Sends an SMS provider probe. Returns `200 {"sender_ok": boolean, "status_id": integer}` when the probe completes; `401` for an invalid key.

### `POST /api/v1/activation/otp/request`

Public, rate-limited. Request: `{ "phone": string }` (Tanzanian mobile number). Returns `200 {"status":"otp_sent","expires_in_secs":300}`. Errors include `400` invalid phone/disabled service/daily limit, `429` rate limit, `502` or `503` SMS provider failure.

### `POST /api/v1/activation/otp/verify`

Public, rate-limited by the challenge flow. Request: `{ "phone": string, "code": string }`. Returns `200 {"verification_token": string}`. Invalid, expired, consumed, or exhausted challenges return `400`.

### `POST /api/v1/activation/register`

Public; requires an unused verification token. Request fields: `verification_token` (string), `business_name` (string, max 160), `owner_first_name` (string, max 80), `owner_last_name` (string, max 80), `owner_email` (optional email string), `terms_accepted` (boolean, must be true), `terms_version` (string, max 40), `terms_locale` (string, max 20), and `terms_text_sha256` (64 hexadecimal characters). Returns `200 {business_id, workspace_id, branch_id, activation_grant}`. Invalid data/token returns `400`; a concurrently consumed token returns `409`. Token consumption and business creation use a transaction.

## Device registration and cloud synchronization

### `POST /v1/devices/enroll`

Public grant exchange. Request: `{ "activation_grant": string, "device_id": string }` (unknown fields rejected). Returns `{device_id, access_token, refresh_token, token_type, expires_in, refresh_expires_at}`. Invalid/expired grant or device conflicts return an error.

### `POST /v1/devices/refresh`

Public refresh-token exchange. Request: `{ "device_id": string, "refresh_token": string }` (unknown fields rejected). Returns the same credential response as enrollment. Credentials are rotated by the implementation; invalid or revoked credentials are rejected.

### `GET /v1/health`

Public sync service liveness. Returns `{ "status": "ok", "time": string }`.

### `POST /v1/sync/push`

Requires device bearer auth. Accepts JSON or gzip-compressed JSON (decompressed limit 1 MiB). Request schema: `{device_id: string, app_version?: string, changes: [{change_id: string, entity: string, entity_id: string, version: integer, operation: string, payload: object}]}`. Entity-specific validation is applied by the sync validator. Returns `{acks: [{change_id, status, reason?}], server_cursor: string}`. Changes are applied in per-change savepoints within one transaction; rejected changes are acknowledged individually. Device ID and all database operations are checked against token scope.

### `POST /v1/sync/heartbeat`

Requires device bearer auth. Request: `{device_id: string, pending_count: integer, app_version?: string}`. Returns `{ "status":"heartbeat_acknowledged" }`. A request device ID or stored scope that does not match claims is rejected.

### `GET /v1/business/verification`

Requires device bearer auth. No request body. Returns `{status, labs_verified, tmda_registered, rejection_reason?, updated_at}` for the business/workspace/branch in the token claims.

## Admin Web API (`/admin/v1`)

### Authentication and sessions

`POST /admin/v1/auth/login` — Public. Request `{email: string, password: string}`. Returns `{mfa_required: true, challenge_id: string, enrollment_required?: boolean, otpauth_url?: string}`. Invalid credentials return `401`; throttling returns `429`.

`POST /admin/v1/auth/totp` — Public MFA challenge. Request `{challenge_id: string, code: string}`. On success returns `{success: true, role: string}` and sets the `admin_session` cookie. Invalid challenge/code returns `401`; throttling returns `429`.

`POST /admin/v1/auth/recovery` — Public MFA recovery challenge. Request `{challenge_id: string, code: string}`. Returns `{success: true, role: string}` and sets the session cookie. A recovery code is consumed once. Invalid challenge/code returns `401`.

`GET /admin/v1/me` — Admin session; all active roles. Returns `{id, email, role}`.

`POST /admin/v1/auth/logout` — Admin session; all active roles. Revokes the current session and clears its cookie. Returns an empty success response.

`GET /admin/v1/auth/sessions` — Admin session; all active roles. Lists the current administrator's sessions as `[{id, expires_at, ip?, user_agent?, revoked_at?}]`.

`POST /admin/v1/auth/sessions/{session_id}/revoke` — Admin session; all active roles, owner-scoped. No body. Revokes the selected session. Returns success or `404` when it is not owned by the caller.

`POST /admin/v1/auth/recovery-codes/regenerate` — Admin session; all active roles. No body. Invalidates previous recovery codes and returns `{recovery_codes: string[]}` (shown once).

### Admin role permissions

| Resource | super_admin | admin | reviewer | viewer |
|---|---|---|---|---|
| Auth/session operations | read/write/manage | read/write/manage | write (plus own session listing/revoke) | write (plus own session listing/revoke) |
| Businesses | read/write/manage | read/write/manage | read | read |
| Analytics/overview | read/write/manage | read | read | read |
| Sync | read/write/manage | read/write | read | unavailable |
| Infrastructure | read/write/manage | read | read | unavailable |
| Logs | read/write/manage | read | unavailable | unavailable |

The authorization middleware maps HTTP method and path to a permission; unmapped routes are denied. `GET` is read, the verification action and sync device revoke are writes. Admin business data belongs to platform administration, not a tenant-scoped workspace session.

### Business registry and verification

`GET /admin/v1/businesses` — Admin session; businesses:read. Query: `status?`, `q?`, `region?`, `tier?`, `sort?` (`name|business_id|region|tier|created_at|last_sync`), `direction?` (`asc|desc`), `page?` (default 1), `limit?` (default 25, max 100). Returns `{items: [{business_id,name,region,tmda_number,tier,verification_status,last_sync,created_at}], total, page, limit, total_pages}`.

`GET /admin/v1/businesses/{business_id}` — Admin session; businesses:read. Returns `{business_id,name,region,tmda_number,tier,verification_status,rejection_reason,created_at}` or `404`.

`GET /admin/v1/businesses/{business_id}/stock` — Admin session; businesses:read. Query: `page?` (default 1), `page_size?` (default 25, max 100). Returns `{summary:{item_count,low_stock_count,expiring_soon_count},items:[{medicine_id,batch_number,expiry_date,buy_price,sell_price,quantity,low_stock_threshold}],total,page,page_size}`.

`GET /admin/v1/businesses/{business_id}/sync` — Admin session; businesses:read. Returns `{devices:[{device_id,last_seen_at,outbox_pending,app_version}],changes:[{change_id,entity,entity_id,version,received_at}]}`. Changes are limited to 20 newest.

`GET /admin/v1/businesses/{business_id}/activity` — Admin session; businesses:read. Returns `{activity:[{action,admin,business_id,payload,created_at}]}` (newest 100).

`POST /admin/v1/businesses/{business_id}/verification` — Admin session; businesses:write (admin/super_admin). Request `{decision:"verified"|"rejected"|"suspended",reason?:string}`; reason required for rejected/suspended. Returns `{success:true,status}`. Unknown business is `404`; invalid decision/reason is `400`. Verification update and audit insertion share a transaction.

### Analytics and operational summaries

All require Admin session and analytics:read.

`GET /admin/v1/overview` — Query-free. Returns the persisted summary KPI object and `needs_attention` records defined by the current admin web implementation.

`GET /admin/v1/analytics/revenue` — Query `range?`, `group?`; returns persisted revenue series and summary values.

`GET /admin/v1/analytics/products` — Query `metric?`, `limit?`; returns persisted product ranking values.

`GET /admin/v1/analytics/growth` — Query `range?`; returns persisted business growth series.

The concrete response fields for these analytics handlers are implementation JSON and are not yet defined as typed shared contracts. Do not interpret unavailable summary rows as zero-valued business facts.

### Sync administration

`GET /admin/v1/sync/devices` — Admin session; sync:read. Query pagination/filtering is handler-defined. Returns `{devices:[...]}` from registered sync devices.

`GET /admin/v1/sync/changes` — Admin session; sync:read. Query pagination/filtering is handler-defined. Returns `{changes:[...]}` from persisted sync change records.

`GET /admin/v1/sync/failures` — Admin session; sync:read. Query pagination/filtering is handler-defined. Returns `{failures:[...]}` from persisted sync failures.

`POST /admin/v1/sync/devices/{device_id}/revoke` — Admin session; sync:write (admin/super_admin). No body. Revokes the selected device credential; response is a success object or an error.

### Infrastructure monitoring

All require Admin session. `GET /admin/v1/infra/health` and `/infra/health/history` require infrastructure:read; `/infra/devices` also requires infrastructure:read; `/infra/logs` requires logs:read.

`GET /admin/v1/infra/health` — No query. Returns `{overall,last_checked,checks:[{check,status,latency_ms,detail,checked_at}],state_changes:[...]}` from persisted probe records.

`GET /admin/v1/infra/health/history` — Query `check?` (default `db`), `hours?` (default 24). Returns `{check,history:[{latency_ms,status,checked_at}]}`.

`GET /admin/v1/infra/devices` — No query. Returns `{devices:[{device_id,workspace_id,business_id,last_seen_at,outbox_pending,app_version,business_name,region,status}]}`.

`GET /admin/v1/infra/logs` — Query `level?` (comma-separated), `source?`, `business_id?`, `since?` (`1h|24h|7d|RFC3339`), `q?`, `cursor?` (`RFC3339|id`), `limit?` (default 50, max 100). Returns `{data:[{id,ts,level,source,message,business_id,device_id,meta}],next_cursor?}`. Message text is redacted before return.

## Planned domains unavailable in API Core

The following requested application APIs are **not implemented** in `services/api-core`; there is no HTTP method, authentication/permission policy, request schema, or response schema to call. Their local database migrations/types do not constitute a cloud API. Do not use guessed paths or treat this table as an endpoint contract.

| Domain | Status |
|---|---|
| Workspace and branch CRUD | Unavailable; registration creates initial workspace/branch only. |
| Application users, roles, and permissions | Unavailable; admin console users are platform operators, not workspace users. |
| Customers | Unavailable. |
| Inventory, stock batches, and stock mutations | Unavailable as consumer APIs; admin business stock is read-only. |
| Suppliers and purchases | Unavailable. |
| Sales, payments, and dispensing | Unavailable. |
| Laboratory orders, samples, and results | Unavailable. |
| Tenant reports and operational summaries | Unavailable; admin platform analytics are not tenant reports. |
| Business device management CRUD | Unavailable; enrollment/refresh and admin read/revoke are the only device operations. |
| Business audit-record API | Unavailable; platform admin audit rows are only surfaced through business activity. |
| Administrative business management CRUD | Unavailable beyond platform business registry read and verification decision. |

## Contract and implementation gaps

- `packages/types` now contains shared contracts for the Admin Web identity, session, and business list/detail responses. Many admin analytics, sync, and infrastructure responses remain untyped and must be added before their consumers can claim shared-contract coverage.
- `api-spec.yaml` describes the older activation/health surface and is not yet generated from all current routes. This file is the current route inventory; OpenAPI parity is outstanding.
- Some handlers still suppress query failures or emit bare status codes instead of the common error body. The routes should not be considered compliant with the requested consistent-error contract until those handlers are corrected.
- No integration suite currently covers all listed domains. Existing API tests cover selected activation, admin security, device security, sync, SMS, and database integrity paths only.
