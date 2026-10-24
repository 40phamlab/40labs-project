# 40Labs Cloud Sync API Specification

## Authentication
All authenticated endpoints require an `Authorization: Bearer <device_token>` header where the token contains device claims (`workspace_id`, `business_id`, `device_id`).

---

## Endpoints

### 1. Health Check
- **URL**: `GET /v1/health`
- **Auth**: None (Public)
- **Response (`200 OK`)**:
  ```json
  {
    "status": "ok",
    "time": "2026-10-24T15:00:00Z"
  }
  ```

### 2. Push Sync Changes
- **URL**: `POST /v1/sync/push`
- **Auth**: Required (Device JWT)
- **Limits**: Maximum 500 changes per push, maximum 1 MB payload size (gzip supported with decompression size cap).
- **Request Body**:
  ```json
  {
    "device_id": "dev-001",
    "batch_id": "batch-uuid",
    "app_version": "0.1.0",
    "changes": [
      {
        "change_id": "chg-1",
        "entity": "business",
        "entity_id": "biz-1",
        "op": "upsert",
        "version": 1,
        "payload": { ... },
        "created_at": "2026-10-24T15:00:00Z"
      }
    ]
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "acks": [
      {
        "change_id": "chg-1",
        "status": "applied",
        "reason": null
      }
    ],
    "server_cursor": "2026-10-24T15:00:00Z"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Missing or invalid token.
  - `409 Conflict`: Device mismatch (workspace pinned to a different device_id).
  - `413 Payload Too Large`: Exceeds 1 MB limit or 500 changes.

### 3. Device Heartbeat
- **URL**: `POST /v1/sync/heartbeat`
- **Auth**: Required (Device JWT)
- **Request Body**:
  ```json
  {
    "device_id": "dev-001",
    "pending_count": 5,
    "app_version": "0.1.0",
    "last_ack_at": "2026-10-24T14:00:00Z"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "status": "heartbeat_acknowledged"
  }
  ```

### 4. Business Verification Status
- **URL**: `GET /v1/business/verification`
- **Auth**: Required (Device JWT)
- **Response (`200 OK`)**:
  ```json
  {
    "status": "pending_review",
    "labs_verified": true,
    "tmda_registered": false,
    "rejection_reason": null,
    "updated_at": "2026-10-24T15:00:00Z"
  }
  ```
