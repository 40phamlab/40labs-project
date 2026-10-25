# API Suppliers Module — 40Labs Core API

## Overview
The suppliers module handles supplier follow relationships (`supplier_follows` table).
**Status:** IMPLEMENTED-UNMOUNTED (Rust code exists in `services/api-core/modules/suppliers.rs`, but the router is not `.merge()`-ed into `main.rs`).

---

### POST /suppliers/:id/follow
**Status:** IMPLEMENTED-UNMOUNTED   **Phase:** Phase 2B (Suppliers & Purchasing)
**Source:** `services/api-core/modules/suppliers.rs:follow_supplier_handler`
**Purpose:** Create a follow relationship between a workspace/branch and a supplier.
**Auth:** Session / Device token
**Scoping:** Workspace ID required in payload.

**Request:**
- **Path Params:** `id` (Supplier ID)
- **Body JSON:**
```json
{
  "workspace_id": "ws_123456",
  "branch_id": "branch_123"
}
```

**Response (201 Created):**
```json
{
  "id": "00000102-0003-4008-0000-000000000005",
  "workspace_id": "ws_123456",
  "branch_id": "branch_123",
  "supplier_id": "sup_999",
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-01-01T00:00:00.000Z"
}
```

---

### DELETE /suppliers/:id/follow
**Status:** IMPLEMENTED-UNMOUNTED   **Phase:** Phase 2B
**Source:** `services/api-core/modules/suppliers.rs:unfollow_supplier_handler`
**Purpose:** Unfollow a supplier.
**Query Params:** `workspace_id=ws_123456`
**Response (204 No Content):** Empty.

---

### GET /suppliers/followed
**Status:** IMPLEMENTED-UNMOUNTED   **Phase:** Phase 2B
**Source:** `services/api-core/modules/suppliers.rs:get_followed_suppliers_handler`
**Purpose:** List all suppliers followed by a workspace.
**Query Params:** `workspace_id=ws_123456`
**Response (200 OK):** Array of `SupplierFollow` objects.
