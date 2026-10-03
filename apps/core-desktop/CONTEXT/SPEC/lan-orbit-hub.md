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
