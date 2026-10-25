# API Admin & Business Verification — 40Labs Core API

## Overview
Administrative operations govern business verification, compliance reviews (TMDA / Pharmacy Council), and system metrics.

## Endpoint Inventory

### GET /v1/business/verification
**Status:** LIVE   **Phase:** Phase 1 / Admin
**Source:** `services/api-core/src/sync/push.rs:verification_handler`
**Purpose:** Check business verification status for the authenticated workspace.
**Auth:** Device Token (`Authorization: Bearer <token>`)
**Roles:** Pharmacy Owner / Manager
**Scoping:** Filtered by workspace ID from claims.
**Offline behavior:** Cloud-only query.
**Audit:** Read operation (no mutation).

**Response (200 OK):**
```json
{
  "status": "pending_review",
  "labs_verified": true,
  "tmda_registered": false,
  "rejection_reason": null,
  "updated_at": "2025-02-15T08:00:00Z"
}
```

## Planned Admin Endpoints (Drift / Gaps)
The following administrative endpoints are currently **PLANNED** in backend design but not mounted in `api-core` Axum routing (admin actions are managed via direct DB maintenance or desktop local tooling):
- `GET /api/v1/admin/businesses` — List all registered businesses (Requires TOTP-mandatory admin auth).
- `POST /api/v1/admin/businesses/:id/verify` — Approve business verification status.
- `POST /api/v1/admin/businesses/:id/reject` — Reject business verification with reason.
- `GET /api/v1/admin/metrics` — System-wide metrics (active workspaces, daily active devices, OTP volumes).
