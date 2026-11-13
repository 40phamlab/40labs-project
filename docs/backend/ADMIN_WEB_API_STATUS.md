# Admin Web API Core reference and completion status

This reference covers the platform administration API mounted by API Core at `/admin/v1`. Admin Web calls these routes through its same-origin-configured API client; it has no PostgreSQL connection or database credentials. Protected routes use the opaque `admin_session` HttpOnly cookie. The login routes issue an MFA challenge, then TOTP or a recovery code creates the session. Cookies are `SameSite=Strict`, eight hours, and `Secure` in production.

## Shared behavior

- JSON requests use `Content-Type: application/json`. Successful responses are JSON unless stated otherwise.
- Protected requests require an active, unexpired, unrevoked admin session. Expiration/revocation returns `401`; Admin Web clears the session view and returns to login.
- The centralized default-deny RBAC policy in `services/api-core/src/admin/mod.rs` applies to every protected route. `super_admin` may access all mapped resources; `admin` may read/manage businesses, read analytics/infra/logs, read admin users, and revoke devices; `reviewer` may read businesses, analytics, sync, and infra; `viewer` may read businesses and analytics. All roles may use their own auth/session routes. Only `super_admin` may manage administrative users and read the administrative audit log. Unknown roles and unmapped routes are denied.
- Paginated endpoints default to `page=1`, `limit=25`; `limit` is 1–100. Invalid query/body fields return `400` with `{ "error": { "code": string, "message": string } }`. Database errors return `500` and are not converted into empty results. Missing resources return `404`; authorization failures return `403`; conflicting state changes return `409`.
- All administrative mutations write audit rows transactionally where the operation has a business/admin/device audit event.

## Authentication and sessions

| Method and path | Authentication / permission | Request | Success | Errors / status |
|---|---|---|---|---|
| `POST /admin/v1/auth/login` | Public; rate limited | `{email:string,password:string}` | `200 {mfa_required:true,challenge_id:string,enrollment_required?:boolean,otpauth_url?:string}` | `400` invalid fields; `401` invalid credentials; `429` rate limit; `500` storage/crypto failure |
| `POST /admin/v1/auth/totp` | Public challenge exchange | `{challenge_id:string,code:string}` | `200` session user payload and `Set-Cookie: admin_session=…` | `400` malformed; `401` invalid/expired challenge or code; `409` replayed TOTP step; `429`; `500` |
| `POST /admin/v1/auth/recovery` | Public challenge exchange | `{challenge_id:string,code:string}` | `200` session user payload and session cookie | `401` invalid/expired/used code; `429`; `500` |
| `POST /admin/v1/auth/logout` | Any active admin session; Auth write | No body | `200 {success:true}` and cookie cleared | `401`; `500` |
| `GET /admin/v1/me` | Any active admin session; Auth read | None | `{id,email,role}` | `401`; `500` |
| `GET /admin/v1/auth/sessions` | Any active admin session; Auth read; own sessions only | None | `{sessions:[{id,created_at,expires_at,ip,user_agent,revoked_at}]}` | `401`; `500` |
| `POST /admin/v1/auth/sessions/{session_id}/revoke` | Any active admin session; own session only | None | `200 {success:true}` | `404` session does not belong to caller or is absent; `401`; `500` |
| `POST /admin/v1/auth/recovery-codes/regenerate` | Any active admin session; Auth write | None | `{recovery_codes:string[]}` | `401`; `500` |

The first login for an admin without a confirmed TOTP enrollment returns `enrollment_required:true` and an `otpauth_url`. Enrollment is confirmed after a valid TOTP. The encrypted secret and confirmation timestamp are stored server-side. Existing encrypted secrets are preserved by migration `0010_admin_totp_enrollment.sql` and treated as previously enrolled.

## Business registry and verification

| Method and path | Authentication / permission | Request and query | Success response | Errors / status |
|---|---|---|---|---|
| `GET /admin/v1/businesses` | Session; Businesses read | `status?`, `q?`, `region?`, `tier?`, `sort?`, `direction?`, `page?`, `limit?` | `{items:[{business_id,name,region,tmda_number,tier,verification_status,last_sync,created_at}],total,page,limit,total_pages}` | `400`, `401`, `403`, `500` |
| `GET /admin/v1/businesses/{business_id}` | Session; Businesses read | None | `{business_id,name,region,tmda_number,tier,verification_status,rejection_reason,created_at}` | `401`, `403`, `404`, `500` |
| `GET /admin/v1/businesses/{business_id}/stock` | Session; Businesses read | `page?`, `page_size?` (1–100) | `{summary:{item_count,low_stock_count,expiring_soon_count},items:[{medicine_id,batch_number,expiry_date,buy_price,sell_price,quantity,low_stock_threshold}],total,page,page_size}` | `400`, `401`, `403`, `404`, `500` |
| `GET /admin/v1/businesses/{business_id}/sync` | Session; Businesses read | None | `{devices:[{device_id,last_seen_at,outbox_pending,app_version}],changes:[{change_id,entity,entity_id,version,received_at}]}` | `401`, `403`, `404`, `500` |
| `GET /admin/v1/businesses/{business_id}/activity` | Session; Businesses read | None | `{activity:[{action,admin,business_id,payload,created_at}]}` (latest 100) | `401`, `403`, `404`, `500` |
| `POST /admin/v1/businesses/{business_id}/verification` | Session; Businesses write (`admin` or `super_admin`) | `{decision:"verified"|"rejected"|"suspended",reason?:string}`; reason required for rejected/suspended | `{success:true,status}` | `400` invalid decision/reason; `401`, `403`, `404`, `500`; update and audit are one transaction |

## Workspaces and branches

| Method and path | Authentication / permission | Request and query | Success response | Errors / status |
|---|---|---|---|---|
| `GET /admin/v1/workspaces` | Session; Businesses read | `q?`, `page?`, `limit?` | `{items:[{workspace_id,name,branch_count,created_at}],page,limit,total,total_pages}` | `400`, `401`, `403`, `500` |
| `GET /admin/v1/workspaces/{workspace_id}/branches` | Session; Businesses read | `page?`, `limit?` | `{workspace_id,items:[{business_id,branch_id,name,region,verification_status,created_at}],page,limit,total,total_pages}` | `400`, `401`, `403`, `404`, `500` |

Workspace/branch writes are **unavailable**: API Core has no canonical administrative create/update/delete operation for these registry entities. These reads are projections of the PostgreSQL business registry.

## Devices and cloud synchronization

| Method and path | Authentication / permission | Request and query | Success response | Errors / status |
|---|---|---|---|---|
| `GET /admin/v1/sync/devices` | Session; Sync read | None | `{devices:[{device_id,workspace_id,business_id,business_name,region,last_seen_at,outbox_pending,app_version,status}]}` | `401`, `403`, `500` |
| `POST /admin/v1/sync/devices/{device_id}/revoke` | Session; Sync write (`admin` or `super_admin`) | None | `{device_id,revoked:true}` | `401`, `403`, `404`, `500`; device revocation and audit are transactional |
| `GET /admin/v1/sync/changes` | Session; Sync read | `entity?`, `business_id?`, `page?`, `page_size?` (1–100) | `{data:[{change_id,entity,entity_id,device_id,workspace_id,business_name,version,received_at}],page,page_size,total}` | `400`, `401`, `403`, `500` |
| `GET /admin/v1/sync/failures` | Session; Sync read | None | `{failures:[{business_id,count,failures:[{message,device_id,ts,meta}]}]}` (latest 50 matching sync warning/error/rejection/conflict events) | `401`, `403`, `500` |

Device status is derived from persisted last-seen timestamps: healthy under one hour, stale under 48 hours, offline otherwise. It is an operational categorization, not a device-reported field. Pending outbox is nullable when the database has no value.

## Operational analytics

| Method and path | Authentication / permission | Request and query | Success response | Errors / status |
|---|---|---|---|---|
| `GET /admin/v1/overview` | Session; Analytics read | None | `{kpis:{registered_businesses,verified_percentage,pending_count,active_businesses,platform_sales_today,open_infra_alerts},signups_per_day:[{date,count}],platform_daily_sales:[{date,revenue}],needs_attention:[{type,id,name,description,time,link}]}` | `401`, `403`, `500` |
| `GET /admin/v1/analytics/revenue` | Session; Analytics read | `range=7d|30d|90d`, `group=day|week|region` | `{range,group,revenue_data:[{bucket,revenue,region,tier}],tier_distribution:Record<string,number>}` | `400`, `401`, `403`, `500` |
| `GET /admin/v1/analytics/products` | Session; Analytics read | `metric=units|revenue|stockouts`, `limit=1..50` | `{metric,limit,products:[{medicine_id,units?,revenue?,stockouts?}]}` | `400`, `401`, `403`, `500` |
| `GET /admin/v1/analytics/growth` | Session; Analytics read | `range=7d|30d|90d` | `{range,signups_per_week:[{week,signups}],activation_rate_pct,total_registered,activated_businesses,verified_count,unverified_count}` | `400`, `401`, `403`, `500` |

Revenue and activity are computed from synchronized PostgreSQL summaries/records. The products `revenue` metric currently means **current inventory retail value** (`quantity × sell_price`), not realized sales revenue. Product units and stockout metrics are current inventory aggregates. Transaction-level sales, dispensing, supplier purchases, laboratory workflows, and pharmacy reports are not exposed as Admin Web analytics endpoints in this API phase.

## Infrastructure and audit

| Method and path | Authentication / permission | Request and query | Success response | Errors / status |
|---|---|---|---|---|
| `GET /admin/v1/infra/health` | Session; Infrastructure read | None | `{overall:"ok"|"degraded"|"down"|"unknown",last_checked,checks:[{check,status,latency_ms,detail,checked_at,uptime_24h?}],state_changes:[{level,source,message,ts}]}` | `401`, `403`, `500` |
| `GET /admin/v1/infra/health/history` | Session; Infrastructure read | `check?`, `hours=1..720` | `{check,history:[{latency_ms,status,checked_at}]}` | `400`, `401`, `403`, `500` |
| `GET /admin/v1/infra/devices` | Session; Infrastructure read | None | `{devices:[{device_id,workspace_id,business_id,last_seen_at,outbox_pending,app_version,business_name,region,status}]}` | `401`, `403`, `500` |
| `GET /admin/v1/infra/logs` | Session; Logs read (`reviewer` cannot read logs) | `level?` (comma-separated), `source?`, `business_id?`, `since?` (`1h|24h|7d|RFC3339`), `q?`, `cursor?` (`RFC3339|id`), `limit?` (1–100) | `{data:[{id,ts,level,source,message,business_id,device_id,meta}],next_cursor?}` | `400`, `401`, `403`, `500`; returned messages are redacted |
| `GET /admin/v1/audit-log` | Session; Logs read (`super_admin` only) | `page?`, `limit?`, `target_type?`, `action?` | `{data:[{id,admin_email,action,target_type,target_id,payload,created_at}],page,limit,total,total_pages}` | `400`, `401`, `403`, `500` |

Health status and uptime derive from persisted probe rows. No probe history produces `unknown`/null values rather than fabricated green status. Infrastructure device records share the sync-device database source.

## Administrative users and roles

| Method and path | Authentication / permission | Request and query | Success response | Errors / status |
|---|---|---|---|---|
| `GET /admin/v1/admin-users` | Session; AdminUsers read (`admin` and `super_admin`) | `q?`, `page?`, `limit?` | `{items:[{id,email,role,disabled_at,created_at}],page,limit,total,total_pages}` | `400`, `401`, `403`, `500` |
| `PATCH /admin/v1/admin-users/{admin_id}` | Session; AdminUsers manage (`super_admin` only) | `{role?:"super_admin"|"admin"|"reviewer"|"viewer",disabled?:boolean}`; at least one field | `{id,role,disabled}` | `400` invalid/empty input; `401`, `403`, `404`, `409` self/last-super-admin safeguard; `500`; update and audit are transactional |

Creating/inviting administrative users is **unavailable**; seed/bootstrap is the only current account creation path. MFA reset and credential reset by another administrator are also unavailable.

## Incomplete API operations

The following requested operations do not have API Core support and must not be represented as working Admin Web controls:

- Workspace/branch create, edit, archive, and delete.
- Administrative user invitation/creation, password reset, and TOTP reset by another admin.
- Device metadata editing or deletion. Revocation is available.
- Synchronization replay, conflict resolution, and manual retry.
- Transaction-level operational analytics for sales/dispensing, purchases, lab orders/results, and reports; existing aggregate screens use the real synchronized data currently available and must describe the metric semantics above.
- Cloud/LAN service health beyond probes configured and persisted by API Core. No uptime is claimed without probe history.
- Business verification history beyond the audit/activity records currently written by this API.

These are intentionally documented as unavailable rather than synthesized from local UI state or demo data.
