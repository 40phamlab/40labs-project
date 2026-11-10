# API Core device authentication contract

API Core accepts sync traffic only from enrolled Core Desktop instances. Admin Web uses its separate admin-session authentication; it does not use device bearer tokens. No other consumer is supported by this contract.

## Enrollment and credential lifecycle

1. Desktop completes the existing phone OTP and registration exchange. API Core returns a signed, version 2 activation grant.
2. The grant is Ed25519 signed and contains `business_id`, `workspace_id`, `branch_id`, `phone_hash`, `issued_at`, `expires_at`, `issuer`, `audience`, and `version`. It is audience-bound to `40labs-desktop-device-enrollment`, expires within five minutes, and can be consumed once by `/v1/devices/enroll`.
3. Desktop sends the activation grant and its stable keychain-backed `device_id` to `POST /v1/devices/enroll`. The API confirms all scope fields against `business_registry`, records the enrolled device and grant use in one transaction, and returns an access token plus refresh token.
4. Access tokens are standard compact JWTs, signed HS256 with a configured server secret. Header: `alg=HS256`, `typ=JWT`, `kid=<configured key id>`. Claims: `iss=40labs-api-core`, `aud=40labs-sync`, `sub=<device_id>`, `jti`, `iat`, `exp`, `ver=1`, `device_id`, `business_id`, `workspace_id`, `branch_id`. Access lifetime is 15 minutes. The API verifies signature, algorithm, issuer, audience, issue time, expiration, maximum lifetime and token version on every protected request, then checks enrollment state and scope in PostgreSQL.
5. Refresh tokens are 256-bit random URL-safe values. Only SHA-256 hashes are stored server-side. `POST /v1/devices/refresh` rotates the refresh token atomically; refresh lifetime is 90 days. A token cannot be refreshed twice.
6. Admins with the `admin` role revoke devices through `POST /admin/v1/sync/devices/{device_id}/revoke`. Revocation sets `revoked_at`, increments `token_version`, and invalidates refresh state. Existing access tokens fail the DB enrollment check immediately.

Desktop stores the stable device ID and returned credentials in the OS keyring. Local SQLite operations remain offline-first and do not require a valid network token. A lost keyring/device requires a new enrollment; unsigned legacy bearer tokens are intentionally rejected.

## Key configuration and rotation

Configure `DEVICE_TOKEN_SIGNING_KEY_ID` to the active key ID and `DEVICE_TOKEN_SIGNING_KEYS` as a JSON map from key ID to hexadecimal random keys of at least 32 bytes. `_FILE` variants are supported for secret-file injection. Production startup fails closed without a valid active key. To rotate, deploy the new key while retaining the previous key in the map, change the active key ID, wait at least the 15-minute maximum access lifetime (plus deployment skew), then remove the old key. Removal immediately rejects tokens signed with that key. Never use the development default in production. Device access JWTs are symmetric HS256 and the signing secret must remain server-only.

Activation grants continue to use the configured Ed25519 activation signing key/public key pair; changing that key requires updating the Desktop verification key in a coordinated release.

## Scope and sync behavior

All sync identity comes from the verified JWT and the matching active `device_enrollments` row. Push and heartbeat reject a body `device_id` mismatch. Changes must carry `entity_id == payload.id` and exact authenticated workspace/branch scope; business updates additionally require the authenticated business. Upserts lock/check existing ownership and never update ownership columns. Parent inventory ownership is checked for prices/history. Sync idempotency is unique by `(device_id, change_id)` and stores a payload digest and outcome. Push processing is a PostgreSQL transaction with per-change savepoints, so a failed change does not partially mutate its records.

## Migration and rollback

`0006_device_credentials.sql` is an additive SQLx migration; it preserves stored business, device telemetry and change history, adds enrollment/grant tables and sync result metadata, backfills business/branch when a registry row is available, and changes sync idempotency to a device-scoped key. Take a verified backup before deployment. Do not roll back by dropping credential tables or truncating sync data. If rollback is necessary, first stop API writers, preserve `device_enrollments` and migrated sync rows, and restore a tested pre-migration backup into a separate database; then deploy the prior binary against the restored DB. There is no destructive automatic down migration.

## Verification

Run `cargo test -p api-core` with `API_CORE_TEST_DATABASE_URL` pointed at a disposable PostgreSQL database. The integration suite applies the same foundation and SQLx migrations before exercising enrollment-state authentication and sync isolation. Never point the test variable at a production or developer data database.
