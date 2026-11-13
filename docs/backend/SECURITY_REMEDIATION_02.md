# API Core Security and Data Isolation Remediation — Update 02

Date: 2026-11-13
Branch: `main`
Scope: Current-turn API Core Admin RBAC, MFA/session state, distributed throttling, production configuration, seed-secret output, and audit status. Device JWT and sync isolation implementation was already present in commit `43365d3` and was reviewed, not replaced here.

## Changes made

- Central default-deny Admin route authorization maps HTTP method/path to resource and action. Explicit policies exist for `super_admin`, `admin`, `reviewer`, and `viewer`; unknown roles and unmapped routes return forbidden.
- Added migration `0007_admin_security.sql` for durable one-time login challenges, rate-limit buckets, TOTP replay step, and hashed recovery-code records. It is additive and does not delete or reset customer data.
- Admin login challenges are stored in PostgreSQL with expiry and single-use consumption. TOTP step validation and session creation now use database state and transaction boundaries; a previously accepted TOTP time step cannot be reused.
- Added high-entropy, SHA-256-hashed recovery codes. Authenticated users can replace their own code set; each code is consumed once at the recovery login endpoint, which requires a live password challenge and creates a new session.
- Activation and Admin shared rate limits use atomic PostgreSQL upserts and fail closed when the limiter DB operation fails. Login is limited by normalized email and direct TCP peer IP; TOTP is limited by both challenge and account, and recovery by challenge. OTP failed-attempt increments and successful consume/token issuance are atomic.
- Production startup now validates supported `APP_ENV`, an HTTPS origin without path/query/credentials, 32-byte TOTP encryption key material with minimum byte diversity, activation/device signing secrets with minimum byte diversity, and disabled Admin debug OTP. The known development device key is rejected in production. Production Compose injects the TOTP key from a secret file and requires the Admin Web origin.
- `admin-seed` is development-only, reads the password from `ADMIN_SEED_PASSWORD` (16+ chars), clears MFA enrollment on reseed, and no longer prints a password or MFA secret.
- Updated API auth documentation, the Admin runbook, and the remediation status table in `BACKEND_AUDIT.md`.

## Verification performed

- `cargo fmt --all -- --check`: passed.
- `cargo check -p api-core`: passed (pre-existing dead-code/unused-mut warnings remain in `sync/apply.rs` and `sync/validate.rs`).
- `cargo test -p api-core --lib`: passed, 12 passed / 0 failed.
- `cargo test -p api-core --test admin_security_test -- --test-threads=1`: passed, 4 passed / 0 failed, including recovery-code single-use, TOTP replay, session revocation, role denial, and cross-instance shared rate limiting.
- `cargo test -p api-core`: passed against the isolated PostgreSQL database, all targets: lib 12, activation 4, Admin security 4, existing Admin 11, device isolation 1, SMS 8, sync 3; 43 passed / 0 failed, plus 0 doc tests.
- Migration 0007 applied successfully through the full integration suite. Docker Desktop had stopped during an earlier attempt; after it was restored, an initial recovery test issue was traced to reusing a SQLx pool across per-test Tokio runtimes. Tests now create/close per-test pools and serialize migration setup with a PostgreSQL advisory lock. Focused and full suites pass after that fix.
- Existing compile warnings in sync payload fields and `sync/validate.rs` remain outside this scoped change.

## Remaining limitations and required follow-up

1. Keep the passing PostgreSQL integration suite in CI and verify it with the project's actual production PostgreSQL version/settings.
2. Add production-grade recovery delivery and password-reset/re-enrollment policy. Current recovery codes provide one-time MFA bypass after successful password login; they do not reset lost passwords.
3. Add an Admin Web recovery-code entry path; this turn adds and tests the API route, but does not change the Admin Web login interface.
4. Design trusted proxy client-IP propagation before relying on per-IP rate controls behind a reverse proxy. The current implementation uses the TCP peer and deliberately ignores spoofable forwarded headers.
5. Add retention monitoring for rate-limit buckets and expired login/recovery challenge rows; verify concurrent database behavior under load. Expired buckets are opportunistically deleted by a subset of limiter calls.
6. Add encrypted TOTP key rotation/re-encryption support; changing `TOTP_ENC_KEY` without re-encrypting stored factors will invalidate MFA secrets.
7. Add session metadata capture, explicit all-session revocation/account-disable tests, Admin audit events for recovery-code regeneration/consumption, and reviewer/viewer business-specific grant scopes.
8. Desktop cloud sync is authorized as a device principal bound to workspace/business/branch; it does not yet carry a server-authenticated employee/user identity or enforce per-user cloud permissions. Preserve local offline auth while designing any future per-user cloud policy.
9. Add a route-by-role integration matrix for every Admin endpoint and verify CORS/cookie/CSRF behavior with the real Admin Web deployment origin.
10. Implement database least-privilege runtime roles/RLS, backups/restore, and full Desktop sync coverage as still open in `BACKEND_AUDIT.md`.

No production deployment or production secret was modified. There is no claim here that the current unverified PostgreSQL integration suite passes.
