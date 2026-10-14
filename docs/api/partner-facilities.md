# Partner Facilities REST API Contract & Specification

Partner Facilities enable 40Labs businesses (pharmacies, clinics, hospitals, labs) to collaborate, share stock-outs, forward urgent requests, and resolve operational issues with neighboring facilities.

## Endpoints

### 1. List Partner Facilities
- **Method / Route**: `GET /partner-facilities`
- **Description**: Returns all partner facilities registered for the active workspace and branch.
- **Response**: `200 OK` -> Array of `PartnerFacility` objects.

### 2. Create Partner Facility
- **Method / Route**: `POST /partner-facilities`
- **Description**: Registers a new partner facility (either linked to a 40Labs Business ID `AFYA-XXXX` or entered manually with name, type, and WhatsApp `PhoneInput`).
- **Payload**: `CreatePartnerFacilityPayload`
  ```json
  {
    "partner_business_id": "AFYA-2847",
    "name": "Amani Pharmacy",
    "type": "pharmacy",
    "contacts": { "mobile": "+255754123456", "whatsapp": "+255754123456" },
    "region": "Mbeya",
    "district": "Mbeya City"
  }
  ```
- **Response**: `201 Created` -> Created `PartnerFacility` object.

### 3. Update Facility Status (Block / Unblock)
- **Method / Route**: `PATCH /partner-facilities/:id`
- **Description**: Updates facility status between `'active'` and `'blocked'`.
- **Payload**: `{ "status": "blocked" | "active" }`
- **Response**: `200 OK`

### 4. Remove Partner Facility
- **Method / Route**: `DELETE /partner-facilities/:id`
- **Description**: Soft archive / remove partner facility.
- **Response**: `204 No Content`
