# SPEC/auth.md — Authentication, Registration & Device Binding
**Phase:** 1 (MVP · 40LabsCore) · **Status:** Locked logic, designs mapped · **Supersedes:** SPEC/deferred-auth.md
**Authority:** If a design screen contradicts this spec, THIS SPEC WINS. Flag the conflict; never silently implement the design.

---

## 1. Locked decisions

| # | Decision |
|---|---|
| D1 | A user is not a business. Business is registered first; users exist only inside one business (`UNIQUE(workspace_id, username)`). No global user table. |
| D2 | Registration creates Business + Owner + first User (SUDO) in ONE atomic transaction. |
| D3 | Registration requires internet once (online-once activation). Everything after activation works offline. |
| D4 | Login = **username + personal password**. No avatar/user picker. Nobody can use another person's profile. |
| D5 | 6-digit PIN exists for (a) step-up on sensitive actions, (b) unlocking the SAME user's idle-locked session. A PIN never starts a session or switches users. |
| D6 | 1+ SUDO per business (multi-SUDO in v1). Last active SUDO can never be demoted, disabled, or deleted (Rust check + DB trigger). |
| D7 | Recovery codes in v1: 8 single-use codes per SUDO, shown once. |
| D8 | After registration the user lands on the **login screen** (no auto-session). First login → Setup wizard. |
| D9 | Device trust ≠ user identity ≠ authorization. Each is checked independently. |
| D10 | Sales are never blocked by sync lag, ever (offline-first promise). |

## 2. Entities (all tables carry `workspace_id` + `branch_id`)

- **Business**: `business_id` (server-minted `AFYA-XXXX`, unique), name, type, `mode` (pharmacy|lab|both), `scale`, logo, contact phone/email (unverified, listing data), location (country, region, district, ward?, street, area, lat?, lng?), payment profile (lipa_namba?, payment_number?), `declared_branch_count` (hint only, creates NO branches), `onboarding_state` (`registered|owner_first_login|setup_complete`), `terms_version`, `terms_accepted_at`, `terms_accepted_by`. Tier is NOT stored here: derived from the ledger.
- **Owner**: first_name, last_name, phone (`phone_verified_at`), email. Profile only, not a login.
- **User**: `username` (immutable, unique per business), first_name, last_name, phone?, `role_preset`, `status` (active|disabled), `is_superintendent`, `owner_id?`, `must_change_credentials`, `last_login_at`, `created_by`.
- **UserCredential** (separate table, never serialized to the frontend): `password_hash`, `pin_hash`, `failed_password_attempts`, `failed_pin_attempts`, `locked_until`, `password_changed_at`.
- **RecoveryCode**: `user_id`, `code_hash`, `used_at`. SUDO only.
- **Device**: `device_id`, `public_key`, `bound_by_user_id`, `bound_at`, `last_sync_at`, `status` (active|revoked). Private key lives in the OS keychain, NEVER in SQLite.
- **Session**: in-memory in Rust only. No persisted sessions; app restart requires login.
- **PermissionGrant**: `user_id`, `permission` (atomic string).

## 3. Device state machine
`unbound` → (Get started | New Device) → `bound`. A bound device opens directly on Login, showing "Welcome to {business.name}" from local DB. Landing is shown only when unbound. Theme and language toggles on landing are device-local prefs (no business exists yet). Swahili (sw-TZ) is default; every label is an i18n key, including the English-only labels in the designs.

## 4. Registration flow (maps to designs)

| Step | Screen fields | Notes |
|---|---|---|
| 1 Business | name, type, email, phone, logo | OTP removed from here. Logo optional, PNG/JPEG ≤512 KB |
| 2 Profile ("Mode/Scale") | mode, scale | Mode = modules enabled. Scale = hint only, never drives tier. **Password field removed.** See §12 Q1 |
| 3 Location | Nchi, Mkoa, Wilaya, (Kata), Mtaa, Eneo, Wezesha GPS | Country locked to Tanzania in MVP. Cascading selects from a bundled admin-area dataset. GPS optional, nullable lat/lng; desktop has no true GPS, so treat as best-effort |
| 4 Payments & branches | Matawi, Lipa Namba, Payment number | **Optional, skippable.** Password fields removed. Matawi = `declared_branch_count` hint only |
| 5 Owner | first name, last name, phone, email, OTP | The ONLY OTP in registration. Verifies owner phone (email fallback) |
| 6 Account (NEW design needed) | username, password, confirm, PIN, confirm PIN | Creates the SUDO |
| 7 Terms ("Mwisho") | single Kubali checkbox | Maliza disabled until ticked. Records version + timestamp + user |
| 8 Success | Business ID, username, recovery codes | Download/Print codes; Share only for Business ID. "I saved my codes" checkbox required before Anza |

- Wizard state is **in memory only**. Passwords/PINs are never persisted as drafts. Nothing is written to SQLite or the server until step 7 Maliza.
- Commit sequence: `POST /v1/registration` → server mints Business ID + workspace_id + signed activation token → local transaction seeds Business, Owner, User, Credential, RecoveryCodes, Device, audit entry → success screen. Any failure rolls back everything.
- Anza → Login screen (D8).

## 5. New-device binding
Fields: Business ID, SUDO username, SUDO password → OTP to owner phone. On success: business name shown read-only, device keypair generated, device registered, initial data download with progress ("Download Data" = this step; "Access Business Account" enabled only after download completes, then goes to Login). Staff cannot bind devices. Binding is audit-logged and notifies other SUDOs on next sync.

## 6. Login, session, lock, step-up
- **Login:** username + password, verified in Rust (Argon2id, per-user salt, parameters tuned to ≈300 ms on lowest-spec target device, floor m=19 MiB / t=2 / p=1). PIN hashes additionally use an HMAC pepper kept in the OS keychain (6 digits is only 1M combos; the pepper makes offline cracking of a copied DB infeasible).
- **Errors:** one generic "invalid username or password". No account-existence leaks.
- **Lockout (password):** 5 fails → 30 s → 5 min → 15 min → at 10, locked until a SUDO unlocks (staff) or recovery code/OTP (SUDO).
- **Idle lock:** default 5 min, SUDO-configurable 1–30. Session stays in memory; unlock = same user's PIN. 5 PIN fails → session destroyed, full login required.
- **Switch user / any different person:** full username + password.
- **Step-up (refund, stock adjustment, PO approval, interaction override):** PIN prompt → short-lived (~60 s) token scoped to ONE action. Enforced in the Rust command layer, never frontend-only. Permissions are re-read from DB per action, not cached in the session.
- **Forgot password:** staff → "Ask a SUDO to reset" (offline). SUDO → recovery code (offline) or OTP (online).
- **Removed from design:** "Permanently remain in device?" checkbox.

## 7. Reset & recovery matrix

| Target | Who can reset | How |
|---|---|---|
| Staff password/PIN | Any SUDO | Sets temp credentials; `must_change_credentials=true`. SUDO never sees the user's chosen secrets |
| SUDO password/PIN | **Only the SUDO themselves** | Own recovery code (offline) or phone OTP (online). One SUDO cannot reset another |
| Recovery codes | Own SUDO | Regenerate invalidates the old set. Using a code forces new password+PIN and notifies other SUDOs on next sync |

## 8. Setup wizard (`owner_first_login`)
First SUDO login enters wizard; app is gated to it until `setup_complete`. Resumable. Steps: add staff (username, names, role preset, permissions, temp credentials, `is_superintendent` flag), idle-lock timeout, optional second SUDO. Minimum to complete: owner exists plus acknowledgement of recovery codes. **No design yet. Do not invent screens; build against a placeholder and flag.**

## 9. Permissions
Atomic strings; role presets are default bundles copied onto the user at creation, with per-user overrides. Initial set (do not add keys without flagging): `inventory.view|create|adjust*`, `sales.create|discount|refund*`, `purchases.create|approve*`, `lab.order|result.enter`, `customers.view|edit|delete`, `reports.view`, `reports.compliance`, `interaction.override*`, `users.manage`, `devices.manage`, `settings.manage`. (`*` = step-up PIN.)
Presets (pending sign-off): **SUDO** all, immutable; **Admin** all except `users.manage` for SUDOs, `devices.manage`, recovery; **Pharmacist** sales, inventory, customers, purchases.create, lab.order, interaction.override; **Lab Technician** lab.*, customers.view.
TODO: [reason: discount-PIN threshold TBD] [phase 1] · TODO: [reason: Compliances-tab owner-only decision open] [phase 1]

## 10. Sync-lag policy (never blocks selling)

| Days since last sync | Behavior |
|---|---|
| 0–6 | Normal |
| 7+ | Persistent banner; step-up actions and user management blocked until sync; sales continue |
| 30+ | Only SUDO sessions can start; staff logins blocked until sync |

Revocation (device or user) propagates on sync; this window is its accepted latency.

## 11. Audit (audit-log-first insert order, per GOTCHAS #9; immutable)
Events: registration, terms_accepted, login_success, login_failed, lockout, unlock, pin_changed, password_changed, password_reset, recovery_code_used, recovery_codes_regenerated, user_created, user_role_changed, user_disabled, device_bound, device_revoked, step_up_approved, step_up_failed.

## 12. Interfaces
**Cloud (online-only):** `POST /v1/registration/otp/request`, `POST /v1/registration/otp/verify`, `POST /v1/registration`, `POST /v1/devices/bind`, `POST /v1/devices/{id}/revoke`, `POST /v1/auth/password-reset/otp`. (NEW: add to PRD REST contract.)
**Local (Tauri commands, work offline):** `auth_login`, `auth_unlock_pin`, `auth_logout`, `auth_step_up`, `user_create`, `user_update`, `user_reset_credentials`, `recovery_redeem`, `recovery_regenerate`.
Until the Rust layer lands, the frontend uses a mock seam in `mockData.ts` with the same signatures.

**Open questions (blocking where noted):**
1. "Mode / Scale / password" screen: confirm Mode = modules, Scale = size hint. (Blocks step 2)
2. OTP channel: SMS provider vs email-only v1. (Blocks steps 5, §5)
3. Matawi / Lipa Namba / Payment number: confirm optional. (Blocks step 4)
4. Kata missing between Wilaya and Mtaa; is Eneo = Kata? (Blocks step 3)
5. Success screen's two fields: assumed Business ID + username.
6. Orbit Worker auth: DEFERRED. Default constraint: QR pairing proves the device only; user still logs in with username+password; step-up PIN unchanged.
7. Terms text: must disclose anonymized-data use for the AI corpus; needs legal review and Swahili copy before launch.

## 13. Out of scope (Phase 1)
## 13. Storage (MVP: plain SQLite · SQLCipher is Phase 2)
- MVP uses standard SQLite via sqlx `sqlite` (bundled). No SQLCipher, no DB key. Decision: time/complexity/MVP release.
- All pool creation stays in `src-tauri/src/db.rs` (single choke point) so Phase 2 is a one-file swap.
- Schema source of truth: `infra/db/sqlite-schema/migrations/*.sql` via `sqlx::migrate!`. No inline `CREATE TABLE` in Rust.
- Password and PIN hashing (Argon2id, keychain `pin_pepper`) is unchanged and lands with the auth Rust module.
- Privacy/Terms copy must not claim encryption at rest. Pilot install checklist: enable BitLocker.
- **Phase 2 reserved:** SQLCipher spike (sqlx `sqlite-unbundled` + `libsqlite3-sys` bundled-sqlcipher; Windows needs Perl/NASM for vendored OpenSSL), `db_key` via HKDF from the keychain master secret, one-time plain→encrypted migration (`sqlcipher_export`), backup/key-escrow decision.