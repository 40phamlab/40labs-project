# SPEC/auth.md — Authentication, Registration, Sessions & Step-up
**Version:** 1.1 · **Date:** Oct 2026 · **Phase:** 1 (MVP · 40LabsCore)
**Path:** apps/core-desktop/CONTEXT/SPEC/auth.md (add to 00-SPEC-INDEX.md)
**Supersedes:** auth.md v1.0 and SPEC/deferred-auth.md (mark deferred-auth.md "superseded").
**Authority:** If a design screen, an older doc, or existing code contradicts this spec, THIS SPEC WINS. Flag the conflict; never silently implement the other thing.

---

## 1. Locked decisions

| # | Decision |
|---|---|
| D1 | A user is not a business. A business is registered first; users exist only inside one business (`UNIQUE(workspace_id, username)`). No global user table. |
| D2 | Registration creates Business + Owner + first User (SUDO) in ONE atomic local transaction. |
| D3 | Registration requires internet once (SMS OTP + Business ID minting). Every other auth flow works fully offline. |
| D4 | Login = username + the user's own personal password. No avatar/user picker, no "remember me". |
| D5 | PIN = 6 digits, created by the USER at their FIRST LOGIN (never at registration, never by a SUDO). Used only for (a) step-up, (b) unlocking the SAME user's idle-locked session. A PIN never starts a session or switches users. |
| D6 | 1+ SUDO per business. The last active SUDO can never be demoted, disabled, or deleted (Rust check + DB trigger). |
| D7 | Recovery codes in v1: 8 single-use codes per SUDO, shown once. |
| D8 | Registration ends on the Login screen (no auto-session). |
| D9 | Device trust ≠ user identity ≠ authorization. Each is checked independently. |
| D10 | Selling is never blocked by sync lag. Offline-first is the platform's core promise. |
| D11 | Step-up has two tiers (Self / SUDO). Gating is always on in MVP; there is no off switch. |
| D12 | MVP storage is plain SQLite. SQLCipher is Phase 2. |
| D13 | "New Device" / device binding / data download is V2. The landing screen shows only "Get started". |
| D14 | The frontend never supplies actor, workspace, branch, or approver identity. Rust derives all of them from the session. |

---

## 2. Data model

All tables carry `workspace_id` + `branch_id` (including child tables). Schema source of truth: `infra/db/sqlite-schema/migrations/*.sql` via `sqlx::migrate!`. No inline `CREATE TABLE` in Rust. `0001_init.sql` was amended once in Phase 1A (pre-release) and is **frozen afterwards**.

**Business** (existing table, extended): `business_id` (server-minted `AFYA-` + 6 Crockford base32 chars, unique), `workspace_id`, name, `role_scopes` (pharmacy|lab, UI "Mode"), `business_type` (TEXT), `scale` (TEXT hint, never drives tier), logo, contact phone/email (unverified listing data), `owner_id`, `onboarding_state` (`registered|owner_first_login|setup_complete`), `idle_lock_minutes` (1–30, default 5), location (`country` default TZ, `address_region`, `address_district`, `address_street` = Mtaa, `address_ward` = Kata, `latitude?`, `longitude?`; `address_place` is legacy/unused by registration), payment profile (`lipa_namba?`, `payment_number?`), `declared_branch_count?` (hint only; creates no branches), terms (`terms_version`, `terms_locale`, `terms_text_sha256`, `terms_accepted_at`, `terms_accepted_by_user_id`). `tier` is ledger-derived and never written by auth.
**Owner:** first_name, last_name, phone (`phone_verified_at`), email. Profile only, not a login.
**app_user** (existing, extended): keeps `role` CHECK('sudo','staff'), `full_name` (display name, written ONLY by one Rust helper = first + " " + last), `active`. Adds `username` (immutable via trigger), `first_name`, `last_name`, `phone?`, `role_preset` (sudo|admin|pharmacist|lab_technician; app-validated, NO CHECK), `is_superintendent`, `owner_id?`, `must_change_credentials`, `last_login_at`, `created_by_user_id`. `pin_hash` is REMOVED from this table.
**user_credential:** `user_id` PK, `password_hash` NOT NULL, `pin_hash` **NULLABLE** (NULL = PIN not yet created), `failed_password_attempts`, `failed_pin_attempts`, `locked_until`, `password_changed_at`, `pin_changed_at`. Never serialized to the frontend; no credential/hash type exists in TypeScript.
**recovery_code:** `user_id`, `batch_id`, `code_hash`, `used_at`, `invalidated_at`.
**bound_device** (desktop binding; NOT `paired_device`, which is Orbit phones): `public_key`, `device_label`, `bound_by_user_id`, `bound_at`, `last_sync_at`, `status` (active|revoked), `revoked_at`.
**permission_grant:** atomic permission strings per user (canonical). `staff_permission_set` (7 booleans) is DEPRECATED but left in place for Orbit pairing until the Orbit phase.
**audit_log:** immutability triggers kept verbatim; action CHECK REMOVED (validity enforced by one Rust enum + TS union + parity test); `performed_by_user_id` NULLABLE (NULL = unauthenticated actor; attempted username in metadata); `authorized_by_user_id` is the step-up approver, server-derived.
**Session:** in-memory in Rust only. Never persisted.

DB triggers (backstop; Rust is primary): last-active-SUDO guard on UPDATE (role/active) and DELETE, scoped to the same `workspace_id`; username immutable.

---

## 3. Device state machine & app gate

`unbound` → registration wizard → `bound`. Landing is shown only when unbound. A bound device opens directly on Login showing "Karibu {business.name}". Theme and language toggles on landing are device-local (localStorage); after login, the business's `appearance_mode` wins. Swahili (sw-TZ) is the default, English secondary; every string is an i18n key.

**AuthGate order (from `auth_status`):** no business → Landing/Registration · no session → Login · session locked → LockScreen overlay · `must_change_credentials` → ForcedPasswordChange · PIN not set → CreatePin · SUDO with zero active recovery codes → RecoveryCodes · `onboarding_state = owner_first_login` → SetupWizard · else app shell. Global error handling: SESSION_LOCKED → LockScreen, SESSION_REQUIRED → Login, PIN_SETUP_REQUIRED → CreatePin.

---

## 4. Registration (online once)

| Step | Fields | Notes |
|---|---|---|
| 1 Business | name, type, email, phone, logo | Logo optional, PNG/JPEG ≤512 KB. NO OTP here |
| 2 Mode/Scale | Mode (pharmacy \| lab \| both → `role_scopes`), Scale | Scale options are i18n keys (small/medium/large placeholders). NO password |
| 3 Location | Nchi (fixed Tanzania), Mkoa, Wilaya, Mtaa, Kata, Wezesha GPS | Mkoa/Wilaya selects from a bundled dataset with an "Other" fallback; Mtaa/Kata free text. GPS best-effort, nullable, non-blocking |
| 4 Payments | Matawi, Lipa Namba, Payment number | All optional, "Skip" available, reconfigurable later in Settings |
| 5 Owner | first name, last name, phone, email, SMS OTP | The ONLY OTP in registration. Verifies owner phone |
| 6 Account | username, password, confirm | Creates the SUDO. NO PIN field |
| 7 Terms | consent sentence with links → modal | Modal: Terms & Conditions + Data & Privacy Policy; "Kubali" enabled after scroll-to-end; single checkbox; "Maliza" disabled until accepted |
| 8 Success | Business ID, username, recovery codes | Download/Print/Copy codes; Share applies to Business ID ONLY; required "I saved my codes" checkbox before "Anza" |

- Wizard state is in memory only; nothing is committed until step 7 "Maliza". No persisted drafts; secrets cleared on unmount, submit, and exit.
- Commit: obtain a signed `ActivationGrant` (cloud) → ONE local transaction: owner, business (`onboarding_state='registered'`, terms fields), SUDO `app_user`, `user_credential` (pin NULL), recovery codes, `bound_device` (public key), audit rows (audit-first). Any failure rolls back everything.
- Terms: record `terms_version`, locale, SHA-256 of the displayed text, timestamp, accepting user. Copy must NOT claim encryption at rest. Legal text is pending counsel review (launch blocker).
- `ActivationClient` / `OtpClient` are traits. Dev implementations compile ONLY under `cfg(debug_assertions)`; a release build must be unable to mint a Business ID offline. `HttpActivationClient` verifies the grant's Ed25519 signature with an embedded server public key before trusting any returned id.

---

## 5. Login, session, lock

- **Login:** normalize username → fetch → ALWAYS run an Argon2 verify (dummy hash for unknown users to equalize timing) → one generic `INVALID_CREDENTIALS`.
- **Password lockout:** 5 fails → 30 s · 6–7 → 5 min · 8–9 → 15 min · 10 → hard lock until a SUDO resets a staff user's credentials, or the SUDO uses a recovery code. Success resets counters. Counter update and audit row share one transaction.
- **Session:** a single in-memory current session {user_id, workspace_id, branch_id, role, started_at, last_activity, locked}. No token is sent to the frontend. Every command calls `require(permission)`, which: fails without a session or when locked; auto-locks when `now - last_activity > business.idle_lock_minutes`; re-reads `user.active` and `permission_grant` from the DB on EVERY call (no cached permissions); SUDO passes all permission checks. App restart ends the session.
- **Idle lock:** default 5 min, SUDO-configurable 1–30 (SUDO-tier). Unlock = same user's PIN. Frontend also locks on a timer; the backend is authoritative.
- **PIN failures:** unlock and step-up share `failed_pin_attempts`; 5 fails → session destroyed, full password login required.
- **Switch user / different person:** full username + password.
- **While `pin_hash IS NULL`:** every command fails with `PIN_SETUP_REQUIRED` except `auth_set_pin` and `auth_logout`.

**First-login sequence:** login → (if `must_change_credentials`) change password → create PIN → (SUDO with no active codes) generate and acknowledge recovery codes → (`owner_first_login`) setup wizard → app.

---

## 6. Credentials & policy

- **Password:** 8–128 chars, not equal to username, local common-password denylist (~1k). Argon2id, per-user salt, PHC strings, no pepper (keychain loss must never lock out passwords).
- **PIN:** exactly 6 digits; reject all-same, ascending/descending sequences, small trivial list. Stored as Argon2id(HMAC-SHA256(`pin_pepper`, user_id ∥ pin)).
- **Recovery code:** 10 chars Crockford base32 as `XXXXX-XXXXX`; plaintext shown once; stored as Argon2id.
- **Username:** trimmed, lowercased, `[a-z0-9._-]`, 3–32 chars, immutable (deactivate and recreate instead of renaming).
- **Argon2id params:** floor m=19 MiB, t=2, p=1; tune to ≈300 ms verify on the lowest-spec target; PHC-encoded so `needs_rehash` works.
- **Keystore (OS keychain via `keyring`):** random 256-bit master secret; HKDF-SHA256 → `pin_pepper`; `db_key_v1` reserved and UNUSED (Phase 2). Ed25519 device keypair, private key in a separate keychain entry, never in SQLite. Keychain unavailable → fail closed (no file fallback). Debug-only env override under `cfg(debug_assertions)`.
- **Keychain loss consequence:** all PINs become invalid; passwords still work. Recovery path: login with password → `auth_reset_own_pin(password, new_pin)`.
- **Secret hygiene:** payload structs with secrets use `Zeroizing` and a redacting `Debug`; no secrets in logs, errors, or frontend storage; compare in constant time.

---

## 7. Step-up (two tiers)

| Permission | Tier | TTL / uses |
|---|---|---|
| `inventory.adjust` (stock alteration) | SUDO | 60 s / 1 |
| `users.manage` (add, edit, disable, reset) | SUDO | 60 s / 1 (600 s / 10 uses ONLY while `onboarding_state != setup_complete`) |
| `branches.manage` (add branch) | SUDO | 60 s / 1 |
| `settings.manage` (payment profile, idle-lock changes) | SUDO | 60 s / 1 |
| `sales.refund`, `interaction.override`, `purchases.approve`*, `sales.discount` over threshold** | Self | 60 s / 1 |

*Defaulted to Self; one-line change. **Threshold TBD.

- **Self tier:** the acting user re-enters their own PIN.
- **SUDO tier:** if the actor is a SUDO, their own PIN suffices. Otherwise a SUDO approves at the terminal: the UI lists active SUDOs who have a PIN (`auth_list_approvers`), the approver is selected and enters their PIN.
- A grant is bound to (actor, permission, approver, optional target e.g. a stock item id), single-use, short-lived, held server-side. A grant for item A cannot authorize item B.
- **Wrong PIN:** counts against the ACTOR (`failed_pin_attempts`; 5 → actor session destroyed). The approver only gets backoff (30 s / 5 min / 15 min), never a hard lock, so staff cannot lock out a SUDO by guessing.
- **Audit:** `performed_by_user_id` = actor, `authorized_by_user_id` = approver (or actor for Self/own-SUDO), both derived from the consumed grant. The client can never supply either.
- UI pattern: the command returns `STEP_UP_REQUIRED {permission, tier}` → UI opens StepUpModal → `auth_step_up` → UI retries the original command once.

---

## 8. Permissions

Atomic strings (add no keys without flagging): `inventory.view|create|adjust`, `sales.create|discount|refund`, `purchases.create|approve`, `lab.order|result.enter`, `customers.view|edit|delete`, `reports.view|compliance`, `interaction.override`, `users.manage`, `branches.manage`, `devices.manage`, `settings.manage`.

Role presets are default bundles copied onto the user at creation, with per-user overrides (pending sign-off):
- **SUDO:** all, immutable.
- **Admin:** all except `devices.manage`; cannot create, edit, reset, disable, or change the role of any SUDO.
- **Pharmacist:** sales.create, inventory.view/create, customers.view/edit, purchases.create, lab.order, interaction.override.
- **Lab Technician:** lab.order, lab.result.enter, customers.view.

Command → permission mapping lives in `COMMAND_POLICY` (Phase 1D). Every Tauri command must have an entry (enforced by a test).

---

## 9. Reset & recovery

| Target | Who | How |
|---|---|---|
| Staff password | Any SUDO (via users.manage + SUDO-tier step-up) | Temp password set; `must_change_credentials=true`; **PIN cleared** (user re-creates it). SUDO never sees chosen secrets |
| SUDO password | **Only that SUDO** | Own recovery code (offline). One SUDO cannot reset another |
| Own PIN | The user | Change (old + new) or `auth_reset_own_pin(password, new_pin)` |
| Recovery codes | Own SUDO | Regenerate (requires current password); invalidates the old batch. Redeeming a code forces a new password, clears the PIN, and notifies other SUDOs on next sync |
| Added SUDO's first codes | That SUDO | `recovery_generate_initial()` at their first login, after Create PIN; shown once |

**Known MVP limitation:** a SUDO who loses both their password and all recovery codes cannot recover offline. Mitigations: keep codes safe, keep a second SUDO. OTP-based reset is V2.

---

## 10. Sync-lag policy (implemented, flag OFF)

| Days since last sync | Behavior |
|---|---|
| 0–6 | Normal |
| 7+ | Banner; step-up actions and user management blocked until sync; sales continue |
| 30+ | Only SUDO sessions can start; staff logins blocked until sync |

Config flag defaults OFF: `TODO: [reason: sync-service not built; last_sync_at is NULL] [phase: sync]`. Selling is never blocked.

---

## 11. Audit

Rules: single internal `audit::append(tx, …)`; the row is inserted BEFORE the mutation inside the same transaction (GOTCHAS #9); no frontend-callable audit write (`record_audit_log` is deleted); audit rows are immutable.
Events: registration, terms_accepted, login_success, login_failed, lockout, unlock, password_changed, password_reset, pin_set, pin_changed, recovery_code_used, recovery_codes_generated, recovery_codes_regenerated, user_created, user_updated, user_role_changed, user_disabled, user_enabled, device_bound, step_up_approved, step_up_failed, business_payment_changed, idle_lock_changed, onboarding_advanced (plus the existing 9 actions). Unknown-username failures: performer NULL, attempted username in metadata.

---

## 12. Interfaces

**Cloud (online-only; `/api/v1`; all documented in /api-spec.yaml):**
`POST /api/v1/activation/otp/request`, `POST /api/v1/activation/otp/verify`, `POST /api/v1/activation/register`.
- OTP: Tanzanian mobile numbers only (normalized `255XXXXXXXXX`), 6 digits from a CSPRNG, stored as HMAC only, 5-min expiry, 60 s resend cooldown, ≤5 verify attempts, per-phone caps (5/hour, 10/day), per-IP limit, GLOBAL daily SMS cap + kill switch. Verify returns a 10-min single-use `verification_token`.
- SMS provider: NextSMS behind an `SmsSender` trait. The sender ID must be registered on the NextSMS account or sends are rejected. Credentials live only in cloud env/secrets. `LogSmsSender` is dev-only and refused when `APP_ENV=production`. Tests never call the real provider.
- Register returns a signed `ActivationGrant` {workspace_id, business_id, device_id, issued_at} (Ed25519). Cloud keeps: `business_registry`, `registry_device` (first device), `otp_challenge`, `verification_token`, `sms_log` (no codes). Pre-registration tables are the one documented exception to the `workspace_id`/`branch_id` rule.

**Local Tauri commands (offline):** `auth_status` (device bound?, business name/logo, onboarding_state, idle_lock_minutes, session state, current user {display_name, role, must_change_credentials, pin_set, has_recovery_codes}), `auth_login`, `auth_logout`, `auth_lock`, `auth_unlock_pin`, `auth_set_pin`, `auth_step_up`, `auth_list_approvers`, `auth_change_password`, `auth_change_pin`, `auth_reset_own_pin`, `user_list|create|update|set_active|reset_credentials`, `recovery_redeem|regenerate|generate_initial`, `registration_commit`, `otp_request|otp_verify` (delegating to the cloud client), `onboarding_advance`, `business_set_idle_lock`, business payment update.

**Error contract:** `{code, retry_after_secs?, permission?, tier?}` with codes INVALID_CREDENTIALS, LOCKED, SESSION_LOCKED, SESSION_REQUIRED, PIN_SETUP_REQUIRED, FORBIDDEN, STEP_UP_REQUIRED, POLICY_VIOLATION, NOT_CONFIGURED, NETWORK_UNAVAILABLE. The backend sends NO user-facing text; the frontend maps codes to sw-TZ/en strings.

---

## 13. UI requirements

- Strictly reuse `@40labs/ui-components`; tokens only (no hex literals), radii 12/8, Sora headings, Inter UI, JetBrains Mono for Business ID, usernames, recovery codes. No edits to shared packages; gaps are flagged and built feature-local.
- Locked copy rule: titles and labels only; no subtitles, helper text, or instructional placeholders. Functional text (validation errors, server alerts, consent sentence, success message) is allowed.
- Pre-auth screens render inside the existing TitleBar, without sidebar/AppShell.
- Design deviations (intentional): mint backdrop → token surfaces; orange-on-green buttons → stock primary `Button`; "Enter details to Continue" removed; landing "New Device" and "Already have an account? Sign In" removed; "Permanently remain in device?" removed; OTP "Send via mail" → SMS "Send code"; password fields removed from Mode/Scale and Payments; "Kataa" checkbox removed; PIN field removed from registration.
- The white/grey circle on cards is the business-logo slot (assumption, to be confirmed).
- `PinConfirmModal` is replaced by a shared `StepUpModal`. `UserFormModal` loses the `pin` field and the `StaffPermissionSet` booleans in favor of atomic permissions.
- No Zustand `persist` on any auth or registration store. The adapter pattern is `tauriAuthApi` + `mockAuthApi`, the latter used only when not running in Tauri.

---

## 14. Build order

1A schema + types → 1B auth core (Rust) → 1C cloud activation API + desktop clients → 1D session-enforcement retrofit of all existing commands → 1E screens (E1 registration, E2 session screens + step-up, E3 setup wizard + user management + security) → wire-up of remaining modules from TS mocks to `invoke`, one module at a time.
Until wire-up, the existing screens still run on TS mocks; Rust-side enforcement is real but not yet exercised by those screens.

---

## 15. Deferred (V2 / later)

New Device binding and data download · device revoke · cloud copy of SUDO credentials · OTP password reset · email OTP fallback · Orbit Worker user auth (constraint: QR pairing proves the device only; the user still logs in with username + password; step-up unchanged) · Admin Web App auth (separate trust model, do not reuse these tables) · SQLCipher at-rest encryption (sqlx `sqlite-unbundled` + `libsqlite3-sys` bundled-sqlcipher; Windows needs Perl/NASM for vendored OpenSSL; `db_key` via HKDF; one-time plain→encrypted migration; backup/key-escrow decision) · biometrics / TOTP · multi-branch user assignment UI · an off switch for PIN gating · patient-facing consent (aMob).
Interim mitigation for pilots: enable BitLocker on install.

---

## 16. Open items

- `TODO: [reason: legal text pending counsel review] [phase: pre-launch]` Terms & Privacy (sw-TZ + en); must cover health-data and anonymized AI-corpus use.
- `TODO: [reason: discount PIN threshold TBD] [phase 1]`
- `TODO: [reason: Compliances tab owner-only decision open] [phase 1]` (`reports.compliance`)
- Confirm `purchases.approve` tier (currently Self).
- Confirm role-preset matrix (§8) and Scale options (placeholder small/medium/large).
- Verify the bundled Mkoa/Wilaya dataset before launch.
- Register the NextSMS sender ID; generate and safeguard the server Ed25519 signing key.
- Confirm Business ID format `AFYA-` + 6 chars before the server mints any.
- Orbit pairing (`staff_permission_set`, LAN routes) bypasses AuthContext until the Orbit phase; Phase 1D reports every such route.