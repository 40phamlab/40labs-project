# API Conventions — 40Labs Core API

## 1. Authentication Header Formats
- **Device Token (Sync & LAN):** `Authorization: Bearer <base64url-encoded-json-claims>`
- **Admin / Internal Health Check:** `Authorization: Bearer <ACTIVATION_SIGNING_KEY>`
- **Activation / Registration:** Unauthenticated public endpoints (secured via phone OTP and rate limiting).

## 2. Workspace and Branch Scoping
- Every mutation and sync payload is scoped to a `workspace_id` and optionally a `branch_id`.
- `DeviceClaims` extracted from the Bearer token enforce workspace isolation.
- Cross-workspace data access is rejected with `401 Unauthorized` or `403 Forbidden`.

## 3. ID Formats & Naming
- **Business ID:** Human-readable alphanumeric string format matching regex `AFYA-[A-HJ-NPR-TV-Z2-3456789]{6}` (e.g., `AFYA-7K9M2P`).
- **Workspace ID / Branch ID:** Prefixed UUID / string identifiers (e.g., `ws_123456...`, `branch_123456...`).
- **Entity IDs:** UUID v4 strings (e.g., inventory item IDs, change IDs).

## 4. Timestamps & Timezones
- All timestamps in JSON request/response bodies use **RFC 3339** format with timezone (e.g., `2025-02-15T10:30:00Z`).
- **Local Timezone Rule:** Tanzania business operations operate in `Africa/Dar_es_Salaam` (UTC+3) for daily summaries (`summary_date` YYYY-MM-DD), while server logs and sync cursors record UTC.

## 5. Money & Currency (TZS)
- Tanzanian Shilling (TZS) amounts are stored as **integers** (representing minor units or whole TZS units depending on domain schema, e.g., buy_price/sell_price as integer TZS).
- No floating-point arithmetic is used for monetary values.

## 6. Pagination, Filtering & Sorting
- Push sync uses cursor-based synchronization (`server_cursor` timestamp string).
- List queries accept standard query parameters (e.g., `workspace_id`).

## 7. Idempotency Keys
- Push synchronization uses unique `change_id` (UUID) per item.
- Server maintains a `sync_changes` idempotency table. Duplicate `change_id` submissions return status `applied` without re-executing business logic.

## 8. Rate Limits
- OTP requests: Strict rate limiting of **3 requests per phone hash per hour** and **10 requests per IP address per hour**.
- Daily OTP cap: Configured via `OTP_DAILY_MAX` (default 200 per day).
- Exceeded limits return HTTP `429 Too Many Requests` with a `Retry-After` header.

## 9. Standard Error Envelope
All error responses return a JSON object structured as follows:
```json
{
  "error": "ERROR_CODE_STRING",
  "message": "Human-readable description of the error",
  "retry_after": 60
}
```

### Full Error Code Catalog
| HTTP Status | Error Code | Description / Condition |
| :--- | :--- | :--- |
| `400` | `BAD_REQUEST` | Malformed JSON, missing required fields, or validation failure. |
| `400` | `INVALID_PHONE` | Phone number failed Tanzanian MSISDN normalization (+255...). |
| `401` | `UNAUTHORIZED` | Missing or invalid Authorization header / device token. |
| `403` | `FORBIDDEN` | Insufficient permissions or role scope. |
| `404` | `NOT_FOUND` | Requested entity or business not found. |
| `409` | `CONFLICT` | Device pinning mismatch or duplicate constraint violation. |
| `429` | `RATE_LIMIT_EXCEEDED` | Rate limit exceeded (includes `retry_after` seconds). |
| `502` | `SMS_PROVIDER_ERROR` | NextSMS gateway responded with an error. |
| `503` | `SMS_PROVIDER_UNAVAILABLE` | NextSMS gateway unreachable or rate limited. |
| `500` | `DATABASE_ERROR` | SQLx database execution error. |
| `500` | `INTERNAL_ERROR` | Unexpected server-side internal error. |

## 10. Soft-Delete (`deleted_at`) & Version Semantics
- Entities support optimistic concurrency via an incrementing `version: i64` field.
- Soft deletion is indicated by setting `deleted_at` to an RFC 3339 timestamp.
