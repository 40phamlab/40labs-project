# Core Desktop Registration Forensic Report

**Audit target:** `main` at `180c48a34021361eee3d182d3a83460835d34652` (2026-11-13)  
**Scope:** `apps/core-desktop`, activation contract in `services/api-core`, SQLite migrations in `infra/db/sqlite-schema`.  
**Audit mode:** no source files were modified. This report is the only added file.

## Finding summary

The source establishes a production configuration defect that can fully explain the reported failure: Core Desktop reads `API_BASE_URL` from the process environment and silently defaults to `http://127.0.0.1:3000`. The checked-in Tauri bundle configuration does not set `API_BASE_URL`, and an installed desktop app normally has no API server listening on its own loopback port. If the installer/launcher does not inject this variable, registration reaches Rust and fails at `activation_client.register()` while trying to POST to the local machine. This is a **confirmed source-level misconfiguration, conditional on the deployment environment**; installer/runtime environment was not available to verify whether it injects the variable.

The supplied generic Swahili error is separately explained by error serialization: Rust returns `AuthErrorResponse { code, retryAfterSecs }` without a message; `TermsStep` only reads `err.message` when the rejection is an `Error` and otherwise looks for `err.code` at the top level, falling back to the generic `registrationFailed` translation. This hides the stage and safe error code for the common serialized IPC rejection shape.

The activation endpoints and grant contract do match in the checked-in API source. SQLite INSERT shapes appear compatible with the latest migration schema by static comparison. The audit cannot confirm an observed customer failure stage without the installed app's `API_BASE_URL`, registration diagnostic log, API logs, or reproduction credentials. No registration integration tests currently exercise the end-to-end command with a mocked activation client.

## Exact execution chain

1. `RegistrationWizard` keeps owner verification `{token, phone}` and credentials in component state. The Terms step receives these values.
2. `TermsStep.handleCommit` first checks `navigator.onLine`, verifies that the verification phone and current store phone normalize to the same national digits, and computes SHA-256 over the locally defined Swahili terms text using `globalThis.crypto.subtle.digest`.
3. It submits the token, account credentials, business and owner fields, acceptance flag, `TERMS_VERSION` (`1.0`), locale (`sw-TZ`), and digest through `registrationApi.commitRegistration` to `authApi.registrationCommit` and Tauri `registration_commit` IPC.
4. Rust parses and validates required fields and normalizes owner/business phones, then calls activation `POST /api/v1/activation/register`.
5. Rust reads/creates a stable cloud device ID in the OS keychain, calls `POST /v1/devices/enroll` with the activation grant, then writes returned cloud credentials to the keychain.
6. Only then does Rust begin a local SQL transaction. It hashes the password and inserts owner, SUDO `app_user`, business, password credential, eight recovery codes, bound device, and main branch, then commits.
7. On success it returns camelCase `businessId`, `workspaceId`, `branchId`, and `recoveryCodes`. The UI accepts the business ID aliases but expects `recoveryCodes`; it shows the recovery-code/access step and attempts automatic login.
8. Automatic login success invalidates `auth_status`. `AuthGate` reads status and requires both business and active bound-device state to enter the registered flow; after login, PIN/recovery/onboarding gates apply.

## Detailed findings

### P0 — installed API base URL defaults to local loopback

`src-tauri/src/lib.rs` uses `std::env::var("API_BASE_URL").unwrap_or_else(...)` with `http://127.0.0.1:3000`. `activation/client.rs` passes that value to the HTTP client unless development activation is explicitly enabled by `DEV_ACTIVATION=1`; release builds cannot use that dev client. `tauri.conf.json` contains no environment configuration or production API URL. Therefore a normally launched installed application with no injected environment variable attempts activation against its own loopback. Failure occurs at **activation register**, before device ID/keychain work and before any SQLite transaction.

Evidence: `apps/core-desktop/src-tauri/src/lib.rs`; `src-tauri/src/activation/client.rs`; `src-tauri/src/activation/http_client.rs`; `src-tauri/tauri.conf.json`.

**Deployment condition to verify:** inspect the actual installer/launcher and runtime environment for `API_BASE_URL`. No installer-provided value was found in the checked-in Core Desktop configuration searched during this audit. Do not treat the local fallback as a production endpoint.

### P1 — IPC error details are reduced to generic UI copy

Rust's `AuthErrorResponse` serializes a code and optional retry interval, not a human message. `registration_cmd` deliberately maps errors to this response, and DB errors are mapped to `INTERNAL_ERROR`. The frontend catches the rejection but only uses `.message` for `Error` instances; for object-shaped Tauri rejections it reads `.code`, which may itself be unavailable at the top level depending on Tauri's rejection representation. It then falls back to the generic translated message. Thus the shown text does not identify whether the failure was activation, grant validation, keystore, schema/constraint, or another stage.

Registration-stage diagnostics are emitted to the app log, with stage and outcome and no payload values, but this does not correct the user-visible generic message. Error text from activation is logged by `%e`; the activation client currently includes up to 300 chars of upstream response body for registration/OTP errors, so logging policy should be reviewed to ensure future upstream errors cannot echo tokens or personal data.

Evidence: `src-tauri/src/auth/error.rs`; `src-tauri/src/commands/registration_cmd.rs`; `src/api/client.ts`; `src/features/auth/steps/TermsStep.tsx`; `src-tauri/src/debug.rs`.

### P1 — cloud enrollment and keychain writes precede local transaction

Activation registration, cloud enrollment, and cloud credential persistence happen before `pool.begin()`. A subsequent SQLite failure rolls back local rows but cannot roll back the external API or OS keychain. API code does support phone-based registration resume with a newly verified token and rotates enrollment credentials for the same stable device ID and same business scope, which mitigates some retries. It does not make the combined cloud/keychain/SQLite operation atomic. In particular, an enrollment can be consumed and credential write can fail, or credentials can be updated and a later DB insert/commit can fail. Local transaction rollback prevents partial owner/business/user rows, but leaves cloud state and possibly credentials behind. A retry may recover for a same-phone/same-device scenario, but this is not guaranteed across keychain loss, device changes, scope conflict, or a retry after local commit succeeded but the UI timed out.

There is no idempotency key/local registration journal in the commit flow. API-side same-phone retry reuses the registry IDs; local INSERTs then use new owner/user IDs and hit unique business ID and/or workspace username constraints if a prior local commit already succeeded. UI has a timeout recovery check (`auth_status`), which handles some but not all process interruption scenarios.

### P1 — account provisioning and first login are separate; success path not proven

On command success, `TermsStep` moves to `AccessStep`, which calls `auth_login` with the just-collected username/password. `auth_status` returns `deviceBound`, business, and session metadata; `AuthGate` invalidates it after registration completion/login. Source inspection shows the required state is created in the same SQLite transaction, but there is no registration integration test proving the sequence, no test proving immediate login against a committed registration, and no runtime database from the affected installation was available. Do not conclude the app transition is verified from code alone.

## Activation API and cryptographic contract

- API source registers `POST /api/v1/activation/otp/request`, `/api/v1/activation/otp/verify`, `/api/v1/activation/register` in `services/api-core/src/routes/activation.rs`.
- Device router registers `POST /v1/devices/enroll` and `/v1/devices/refresh` in `services/api-core/src/routes/device.rs`. These match the Rust client paths; the missing `/api` prefix on device endpoints is intentional and documented in API docs.
- Rust uses snake_case JSON fields by default. The API request fields and response fields match the Rust structs (`verification_token`, `terms_*`, `business_id`, `workspace_id`, `branch_id`, `activation_grant`). Device credential response fields also match `DeviceCredentials`.
- The API signs grant version 2 using issuer `40labs-api-core`, audience `40labs-desktop-device-enrollment`, and five-minute expiration. The Rust verifier checks Ed25519 signature, issuer, audience, version, issued-at skew, expiration, max lifetime (10 minutes), and response scope equality. API device enrollment performs its own signature and registry/scope checks and consumes a grant once.
- Development Rust fallback public key is derived from an all-zero signing seed. Production requires `ACTIVATION_PUBKEY`; no production key wiring was found in checked-in Tauri config. Runtime setup is required. Do not ship the development key as production trust configuration.
- API server signing-key configuration and HTTP availability are external deployment dependencies. The repository establishes routes and contract, not that production service is reachable or configured.

## Final terms step and registration payload

- `getTermsTextSha256` uses Web Crypto SHA-256 and UTF-8 `TextEncoder`. Tauri's app origin is a secure local application context in supported Tauri platforms, where Web Crypto is expected to be available; this was not runtime-tested on the affected build. A thrown digest error is logged as `terms_hash/failed` and shown from its exception before Rust invocation.
- Version `1.0`, locale `sw-TZ`, and the digest are sent. API validates digest length/hex and accepted terms. Rust defaults missing terms fields, but the UI supplies them.
- Owner token is checked for presence and its captured phone matches the current owner phone after local normalization. API validates token existence, expiry, and single use. The API associates the resulting registry with token phone hash; the commit payload separately supplies `owner_phone`, but Rust does not compare it to a phone claim (the raw verification token is opaque to desktop). This is a data-integrity gap to fix, but it is not shown to cause this reported failure.
- Rust validates username regex and password byte length (12–128), required owner/business names, terms acceptance, and Tanzanian mobile prefix/length. `TermsStep` passes all required fields by source inspection.

## SQLite schema comparison

Schema source is `infra/db/sqlite-schema/migrations/`, loaded by `src-tauri/src/db.rs` with SQLx. Latest migration is `0034_branch_business_scope.sql`.

| Registration write | Schema check |
|---|---|
| `owner` | Required ID, workspace, branch, first/last name, phone all supplied; timestamps supplied; nullable email; no uniqueness preventing duplicate owner rows. |
| `app_user` SUDO | Required scope, username/name/full_name/role/role_preset supplied; active and must-change supplied; `owner_id` references inserted owner. Unique `(workspace_id, username)` can reject duplicate retry. |
| `business` | Required ID/scope/business_id/name/contact_mobile supplied; `business_id` unique; role scopes/tier and timestamps supplied; owner FK references inserted owner; registration extension columns originate in 0008/0010 and are present. SQL has 29 placeholders and 29 `.bind()` calls by static count. |
| `user_credential` | Repository insert supplies user/scope/password hash/timestamps; pin nullable and other counters default. User FK references inserted SUDO. |
| `recovery_code` | Repository supplies all required fields, hashed code, one of eight records per ID; user FK references inserted SUDO. |
| `bound_device` | Required fields supplied; `public_key` is the literal `mock_pubkey`; user FK references inserted SUDO. This means the local “bound” device does not store a real device public key and merits security review. |
| `branch` | Required ID/scope/business/name/code/status supplied; referenced business is inserted earlier. Latest trigger checks business workspace equality, which supplied IDs satisfy. `branch_id` is intentionally the API branch ID in both branch row ID and branch_id. |

No obvious bind-count or NOT NULL mismatch was found in static inspection. SQLite unique constraints can reject repeat commits. Existing DB upgrade logic reconciles migration 0010 only when all registration columns already exist, then runs migrations; `db.rs` has migration tests, but not a registration-on-fresh-and-upgraded-database test.

## Evidence limitations and tests

The repository has a phone-normalization unit test in `registration_cmd.rs`, activation grant verification tests, API registration validation tests, and SQLite migration/reconciliation tests. It does **not** have deterministic registration command tests with mocked activation/keychain dependencies for the ten requested success/failure cases, nor registration response IPC serialization tests. Static review cannot establish which stage failed for the reported production session.

No new tests were added or run because this phase prohibits source modification and the checked-in test surface does not provide an end-to-end registration harness. The requested matrix remains unverified:

1. fresh successful registration / existing upgraded database / immediate login;
2. invalid token and owner phone;
3. activation unavailable and device enrollment failure;
4. keystore failure;
5. SQLite constraint and transaction rollback;
6. duplicate retry/idempotency;
7. serialized registration response.

Recommended reproduction on an isolated test machine: build the exact target commit, launch the installed app with no `API_BASE_URL`, complete registration through owner OTP, and inspect the app's `registration.log` for the last `registration_*` stage plus API server access logs. Expected source behavior with no local API listener is `activation_register/failed`, with no cloud-device or SQLite writes. Repeat with the real deployment URL and test-only activation credentials/mock server to identify any later-stage failure. Do not use a production owner phone or grant for this reproduction.

## Root-cause conclusion

**Confirmed from source:** absent environment injection, installed Core Desktop points activation traffic at `127.0.0.1:3000`; the generic UI error hides structured failure codes and stage details.  
**Not confirmed from available evidence:** that the affected installation lacked `API_BASE_URL`, and therefore that activation-register failure is the actual observed stage.  
**Not implicated by static checks:** endpoint path mismatch, grant issuer/audience/version mismatch, obvious registration SQL placeholder mismatch, or missing latest schema columns.  
**Potential follow-on defects:** irreversible cloud/keychain side effects before local commit, weak end-to-end retry idempotency, and a placeholder local bound-device public key.

## Recommended fixes, ordered

1. **P0:** make production API configuration explicit and fail-fast; inject a verified HTTPS API base URL in release builds/package configuration. Keep loopback fallback restricted to development.
2. **P0:** add mocked `ActivationClient` and injectable/test keystore seams to cover the requested registration matrix on fresh and upgraded SQLite schemas; test actual Tauri serialization response shape.
3. **P1:** normalize IPC errors from string/object/serialized forms into safe `{code, stage}` errors; show localized code-specific text, and keep details in redacted diagnostics. Do not expose payload secrets or raw upstream body.
4. **P1:** implement a durable registration attempt/idempotency state machine so cloud enrollment, credentials, and SQLite can be retried/reconciled without duplicate owner/user/business rows; include recovery for interrupted processes and distinguish committed local state from pending cloud state.
5. **P1:** persist/verify actual device public key rather than `mock_pubkey`; ensure local `bound_device` reflects the identity enrolled with API.
6. **P2:** bind owner phone to the server-verified token claim or return a signed/opaque claim that desktop can verify; ensure email/phone normalization and ownership match remain consistent.

## Working tree note

The checkout had three pre-existing local modifications when audited: `src-tauri/src/activation/http_client.rs`, `src-tauri/src/auth/engine.rs`, and `src/features/auth/steps/AccessStep.tsx`. This report's target is committed `HEAD`; those edits were not used as evidence for the main-branch conclusions and were left untouched.
