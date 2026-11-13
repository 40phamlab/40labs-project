# API Auth & Activation — 40Labs Core API

## Overview
Business onboarding and activation follows a 3-step cryptographic flow:
1. **OTP Request:** Client requests an OTP sent via NextSMS (or console provider in dev/test).
2. **OTP Verify:** Client submits the received OTP code, receiving a short-lived `verification_token`.
3. **Registration:** Client submits business details and the `verification_token`, receiving `business_id`, `workspace_id`, `branch_id`, and a cryptographically signed Ed25519 `activation_grant`.

The activation grant is now version 2 and expires within five minutes. Core Desktop validates the Ed25519 signature, issuer, audience, expiry and scope values before using the returned IDs. It exchanges the grant at `POST /v1/devices/enroll` and securely stores the returned signed device credentials in the OS keychain. API Core no longer accepts unsigned Base64 JSON bearer tokens. Full contract and key rotation instructions are in [DEVICE_AUTH.md](DEVICE_AUTH.md).

## Administrative authentication and authorization

Admin Web uses password plus TOTP at `POST /admin/v1/auth/login` and `POST /admin/v1/auth/totp`. Login challenges are stored in PostgreSQL, expire after five minutes and can be consumed once. TOTP acceptance records the accepted time step atomically; the same step cannot be used again. Recovery codes can be regenerated through authenticated `POST /admin/v1/auth/recovery-codes/regenerate` (shown once) and used at public `POST /admin/v1/auth/recovery` with a valid password challenge. Each recovery code is high entropy, stored as a SHA-256 digest, and consumed once.

Sessions are opaque random IDs in the `HttpOnly; SameSite=Strict` `admin_session` cookie; production adds `Secure`. Sessions expire after eight hours and can be revoked individually from the caller's own session list. Every protected Admin route is checked by the centralized default-deny policy in `src/admin/mod.rs`: `super_admin` has all mapped permissions; `admin` can read and mutate business verification, read analytics and infrastructure, and read/revoke devices; `reviewer` can read businesses, analytics, sync and non-log infrastructure; `viewer` can read businesses and analytics. All authenticated roles can log out and manage only their own sessions/recovery codes. Unknown roles and routes are denied.

Login, TOTP, recovery, and activation rate counters are PostgreSQL-backed and shared across API Core instances; if the limiter database write fails, the request is rejected. Do not enable OTP-code debug output. Seed a development admin with `ADMIN_SEED_PASSWORD` set in the process environment (minimum 16 characters) and `cargo run --bin api-core -- admin-seed --email ... --role admin`. The seed command refuses production, stores no TOTP secret, and never prints the password or MFA secret; first password login returns a one-time TOTP enrollment URL. Set `APP_ENV=production`, a real HTTPS `ADMIN_WEB_ORIGIN`, non-default `TOTP_ENC_KEY`, and signing keys through secret files; production startup fails closed when those are invalid.

---

### POST /api/v1/activation/otp/request
**Status:** LIVE   **Phase:** Phase 1 (Activation)
**Source:** `services/api-core/src/routes/activation.rs:request_otp`
**Purpose:** Request a 6-digit OTP code for a Tanzanian mobile phone number.
**Auth:** none (rate-limited by IP and phone hash)
**Roles:** Public / Unauthenticated
**Scoping:** None
**Offline behavior:** Cloud-only (requires network connectivity to API core and NextSMS).
**Audit:** None (OTP challenge logged to `otp_challenge` table).

**Request:**
- **Headers:** `Content-Type: application/json`
- **Body JSON:**
```json
{
  "phone": "0712345678"
}
```
*(Constraints: Tanzanian mobile number format; normalized to `+255712345678`)*

**Response (200 OK):**
```json
{
  "status": "otp_sent",
  "expires_in_secs": 300
}
```

**Errors:**
- `400 BAD_REQUEST`: OTP service disabled, daily limit reached, or invalid phone.
- `429 RATE_LIMIT_EXCEEDED`: Rate limit exceeded (3/hr per phone, 10/hr per IP).
- `502 SMS_PROVIDER_ERROR`: NextSMS gateway failure.

**Example (curl):**
```bash
curl -X POST http://localhost:3000/api/v1/activation/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "0712345678"}'
```

---

### POST /api/v1/activation/otp/verify
**Status:** LIVE   **Phase:** Phase 1 (Activation)
**Source:** `services/api-core/src/routes/activation.rs:verify_otp`
**Purpose:** Verify the 6-digit OTP code and issue a temporary verification token.
**Auth:** none
**Scoping:** None
**Request Body:**
```json
{
  "phone": "0712345678",
  "code": "123456"
}
```

**Response (200 OK):**
```json
{
  "verification_token": "a1b2c3d4-e5f6-7890-abcd-ef0123456789"
}
```

**Errors:**
- `400 BAD_REQUEST`: Invalid/expired code, already consumed, or max attempts (5) exceeded.

---

### POST /api/v1/activation/register
**Status:** LIVE   **Phase:** Phase 1 (Activation)
**Source:** `services/api-core/src/routes/activation.rs:register_business`
**Purpose:** Register a new business using a valid verification token, generating workspace, branch, business ID, and Ed25519 activation grant.
**Auth:** none (token-verified)
**Request Body:**
```json
{
  "verification_token": "a1b2c3d4-e5f6-7890-abcd-ef0123456789",
  "business_name": "Afya Bora Pharmacy",
  "owner_first_name": "Juma",
  "owner_last_name": "Mwinyi",
  "owner_email": "juma@afyabora.co.tz",
  "terms_accepted": true,
  "terms_version": "v1.0",
  "terms_locale": "sw",
  "terms_text_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

**Response (200 OK):**
```json
{
  "business_id": "AFYA-7K9M2P",
  "workspace_id": "ws_abcdef1234567890",
  "branch_id": "branch_1234567890abcdef",
  "activation_grant": "eyJidXNpbmVzc19pZCI6IkFGWUEtN0s5TTJQ... .sighex..."
}
```

**Errors:**
- `400 BAD_REQUEST`: Terms not accepted, invalid field validation, or invalid/expired token.
- `409 CONFLICT`: Token already used.
- `500 INTERNAL_ERROR`: Grant signing failure.
