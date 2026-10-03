# LAN Orbit Hub API Specification

## Endpoints

### 1. `GET /api/v1/devices/me`
- **Auth**: Bearer token (Device credential hash).
- **Purpose**: Returns current device information, assigned user, permissions, and business context.
- **Response Shape**:
```json
{
  "device": {
    "id": "string",
    "deviceLabel": "string",
    "deviceType": "phone",
    "status": "active"
  },
  "permissions": {
    "can_view_stock": true,
    "can_create_sale": true,
    "can_manage_customers": true,
    "can_record_lab_result": true,
    "can_send_notifications": true
  },
  "user": {
    "id": "string",
    "name": "string",
    "role": "string"
  },
  "businessName": "string"
}
```

### 2. `POST /api/v1/devices/me/heartbeat`
- **Auth**: Bearer token (Device credential hash).
- **Purpose**: Updates last connected timestamp for the paired device.
- **Response Shape**:
```json
{
  "status": "ok",
  "deviceId": "string",
  "timestamp": "iso-8601"
}
```

### 3. `GET /api/v1/staff/roster`
- **Auth**: Bearer token (Device credential hash).
- **Purpose**: Returns active staff roster for assignment / notifications.
- **Security Constraints**: NEVER returns PIN hashes, phone numbers, or secrets.
- **Response Shape**:
```json
[
  {
    "id": "string",
    "displayName": "string",
    "jobRole": "string"
  }
]
```

### 4. `GET /api/v1/me/summary`
- **Auth**: Bearer token (Device credential hash).
- **Purpose**: Returns today's summary metrics (sales, patients, samples, results, lowStockCount, alerts, unreadNotifications) based on Africa/Dar_es_Salaam calendar day.
- **Response Shape**:
```json
{
  "sales": 0,
  "patients": 0,
  "samples": 0,
  "results": 0,
  "lowStockCount": 0,
  "alerts": 0,
  "unreadNotifications": 0
}
```

### 5. `GET /api/v1/activity`
- **Auth**: Bearer token (Device credential hash).
- **Purpose**: Returns current staff user's recent actions (sale, stock_receipt, patient_added, lab_sample, lab_result) newest first within a 30-day window, supporting cursor pagination.
- **Response Shape**:
```json
{
  "items": [
    {
      "id": "string",
      "type": "sale | stock_receipt | patient_added | lab_sample | lab_result",
      "title": "string",
      "subject": "string",
      "createdAt": "iso-8601",
      "status": "done | pending | failed"
    }
  ],
  "nextCursor": "string | null"
}
```

### 6. `GET /api/v1/staff-notifications`
- **Auth**: Bearer token (Device credential hash).
- **Purpose**: Returns staff notifications visible to the current user (broadcasts, role-matching, direct messages to user, and alerts), supporting cursor pagination and read state (`isRead`).
- **Response Shape**:
```json
{
  "items": [
    {
      "id": "string",
      "senderUserId": "string",
      "senderName": "string",
      "audience": "broadcast | role | direct | alert",
      "targetRole": "string | null",
      "targetUserId": "string | null",
      "severity": "info | alert",
      "subject": "string",
      "body": "string",
      "createdAt": "iso-8601",
      "isRead": false
    }
  ],
  "nextCursor": "string | null"
}
```

### 7. `POST /api/v1/staff-notifications`
- **Auth**: Bearer token (Device credential hash).
- **Headers**: `Idempotency-Key` (optional string or UUID).
- **Purpose**: Creates a new staff notification (broadcast, role, direct, or alert).
- **Permission**: Requires `can_send_notifications: true` for broadcast, role, and alert audiences. Direct messages do not require `can_send_notifications`.
- **Audit Logging**: Writes an audit log entry for broadcast and alert notifications.
- **Request Body**:
```json
{
  "audience": "broadcast | role | direct | alert",
  "targetRole": "string | null",
  "targetUserId": "string | null",
  "severity": "info | alert",
  "subject": "string",
  "body": "string"
}
```
- **Response Shape**: Created notification object.

### 8. `PATCH /api/v1/staff-notifications/:id/read`
- **Auth**: Bearer token (Device credential hash).
- **Purpose**: Marks a staff notification as read for the current staff user.
- **Response Shape**:
```json
{
  "status": "ok",
  "id": "string",
  "readAt": "iso-8601"
}
```

### 9. `GET /api/v1/stock`
- **Auth**: Bearer token (Device credential hash).
- **Purpose**: Returns list of inventory items with medicine details, supporting `search` and `lowStock` query parameters.
- **Response Shape**: Array of inventory items with embedded medicine info.

### 10. `GET /api/v1/stock/:id`
- **Auth**: Bearer token (Device credential hash).
- **Purpose**: Returns single inventory item and medicine details by ID.

### 11. `POST /api/v1/stock/receipts`
- **Auth**: Bearer token (Device credential hash).
- **Headers**: `Idempotency-Key` (optional string or UUID).
- **Purpose**: Receives stock against inventory / medicine. Requires `can_update_stock` permission. Writes audit log.
- **Request Body**: `AddStockRequest` (medicineName, genericName, category, unit, batchNumber, expiryDate, buyPrice, sellPrice, quantity, lowStockThreshold).
- **Response Shape**: Created stock item and medicine info.

### 12. `GET /api/v1/lab/orders`
- **Auth**: Bearer token (Device credential hash).
- **Purpose**: Returns list of lab orders.

### 13. `POST /api/v1/lab/samples`
- **Auth**: Bearer token (Device credential hash).
- **Headers**: `Idempotency-Key` (optional string or UUID).
- **Purpose**: Collects lab sample for an order. Requires `can_add_lab_sample` permission.

### 14. `POST /api/v1/lab/results`
- **Auth**: Bearer token (Device credential hash).
- **Headers**: `Idempotency-Key` (optional string or UUID).
- **Purpose**: Records lab result for an order. Requires `can_record_lab_result` permission.

### 15. `GET /api/v1/customers`
- **Auth**: Bearer token (Device credential hash).
- **Purpose**: Returns list of customers, supporting optional `search` query parameter.

### 16. `POST /api/v1/customers`
- **Auth**: Bearer token (Device credential hash).
- **Headers**: `Idempotency-Key` (optional string or UUID).
- **Purpose**: Creates a new customer or detects duplicate phone number (returning 409 Conflict with existing customer data). Requires `can_manage_customers` permission.

### 17. `POST /api/v1/sales`
- **Auth**: Bearer token (Device credential hash).
- **Headers**: `Idempotency-Key` (mandatory UUID).
- **Purpose**: Creates a sale server-side (calculating prices, totals, and tax on the hub). Requires `can_create_sale` permission. Idempotent against lost responses using `Idempotency-Key`.
- **Request Body**:
```json
{
  "customerId": "string | null",
  "items": [
    {
      "inventoryItemId": "string",
      "quantity": 1
    }
  ],
  "paymentMethod": "cash | mobile_money | card",
  "discountAmount": 0
}
```
- **Response Shape**: Created Sale object with calculated lines, totals, and grand total.





