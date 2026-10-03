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
