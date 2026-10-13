# 40Labs Core Desktop Functional Audit

**Scope:** `apps/core-desktop` and its SQLite migration dependency. **Branch:** `main`. **Date:** 2026-10-13. **Mode:** audit only; no implementation changes. **Initial working tree:** clean (`main...origin/main`).

## Summary

The desktop frontend production build succeeds, but the Lab module is not production-ready. Its core reads and some writes reach SQLite, but the UI includes static operational claims, missing workflows, and incomplete access/state controls. The most serious confirmed defect is that Lab rows have `branch_id` but all Lab reads/updates scope only by workspace. Results can therefore cross branch boundaries within one workspace. Result entry also bypasses audit and approval; report schema exists without a report workflow. Notification attachments have native persistence and path containment, but browser fallback fabricates persistence/export success and message-to-attachment linking is incomplete.

## Findings

### F1 — P1 — Laboratory data is not branch-isolated

**Evidence:** `src-tauri/src/commands/lab_cmd.rs`: `get_lab_orders`, `get_lab_samples`, `get_lab_results`, `get_test_catalog`, and mutation handlers pass `ctx.workspace_id` but not `ctx.branch_id`. `src-tauri/src/repositories/lab_repo.rs`: list SQL predicates use only `workspace_id`; status updates use `workspace_id AND id`. Every Lab table stores `branch_id` (`infra/db/sqlite-schema/migrations/0001_init.sql`). Create paths set branch on new records but do not validate referenced customer/catalog/order ownership by branch.

**Behavior / root cause:** Same-workspace branch users can see all Lab orders, samples, results and catalog entries, and can update known IDs from another branch. This is confirmed in SQL and handler code. Foreign keys only check globally unique IDs, not tenant/branch equality.

**Reproduction:** Create same-workspace branches A/B, put an order/sample/result in A, sign into B and invoke each get command. Returned records include A. Invoke status update in B with A's ID; predicate matches.

**Minimal fix:** Include branch scope in queries and writes, validate related IDs within permitted scope, and define any explicit cross-branch permission for supervisors.

**Regression tests:** Two-branch isolation for all reads and writes; cross-branch related IDs rejected; supervisor access only if authorized.

**Dependencies/order:** First, before multi-branch Lab production use.

### F2 — P1 — Lab status changes allow invalid transitions and falsely report success

**Evidence:** `src-tauri/src/commands/lab_cmd.rs` (`update_lab_order_status`, `update_lab_sample_status`) accepts arbitrary status strings. `src-tauri/src/repositories/lab_repo.rs` discards `rows_affected()`, returning success even for zero rows. The order schema CHECK restricts enum values but not transitions. `src/features/laboratory/components/LabOrdersList.tsx` and `LabSamplesList.tsx` show success toasts immediately after firing async handlers, before mutation resolution.

**Behavior / root cause:** Any schema-valid state can replace any current state. A nonexistent ID yields `Ok(true)`. UI may claim success when IPC/database update fails. Server lacks state-machine validation and affected-row checks. Confirmed.

**Reproduction:** Invoke status update for a nonexistent ID; result is true. Change a used sample back to collected. Cause IPC failure from list UI; success toast has already appeared.

**Minimal fix:** Enforce legal transitions server-side; require exactly one affected row and return not-found otherwise; await mutation before success toast and show errors.

**Regression tests:** Transition matrix, zero-row behavior, IPC failure does not show success.

**Dependencies/order:** After F1 branch-aware predicates.

### F3 — P1 — Result entry is unaudited/unapproved and there is no report lifecycle

**Evidence:** `src-tauri/src/commands/lab_cmd.rs::enter_lab_result` directly inserts a result and sets order `report_ready` in a transaction, but does not append audit, validate sample readiness, enforce one result/order, or verify caller-supplied `is_out_of_range`. It always sets `override_authorized_by_user_id: None`. `src-tauri/src/services/lab_service.rs::record_result` is not wired to a command and only changes order status; it does not insert a result. `lab_report` exists in `0001_init.sql`, but there is no report repository/command/API/UI. `LabScreen.tsx` Results is read-only.

**Behavior / root cause:** “Report ready” is set at result entry without review, authorized abnormal-result override, or a generated report. Result history has no audit record through the active command. This is confirmed by handler registration and call sites.

**Reproduction:** Enter a result, inspect `audit_log`; no result event is written by this command. Check registered commands for report generation/approval; none exist. Results screen has no entry action.

**Minimal fix:** Route through one Lab service; validate order/sample/reference data; atomically persist result and audit; compute abnormality from structured reference data; add separate authorized review/release and report generation before `report_ready`.

**Regression tests:** Atomic result+audit; validation failures; abnormal-result authorization; report approval/release transitions; failed file generation leaves no ready report.

**Dependencies/order:** F1/F2 and defined authorization policy.

### F4 — P1 — Requisition can attach a typed patient to the wrong existing patient

**Evidence:** `src/features/laboratory/components/NewLabOrderModal.tsx::handleSubmit` chooses `selectedCustomer?.id || customers[0]?.id`. `manualEntry` is never submitted or persisted, even though `CustomerPicker` supports it. `labApi.createOrder` / `LabService.create_order` only accept customer ID.

**Behavior / root cause:** If staff types a new patient and submits without selecting a saved one, the order is silently attached to the first customer in the array. If the list is empty, no order can be made. Confirmed.

**Reproduction:** Type a new patient in manual entry, leave saved customer unselected, submit with at least one existing customer; order references the first customer.

**Minimal fix:** Remove first-customer fallback. Require explicit saved patient or persist the typed patient and use the created ID; validate customer workspace/branch.

**Regression tests:** No implicit patient selection; manual entry creates/uses correct customer; empty customer list has actionable validation.

**Dependencies/order:** Customer creation workflow and F1.

### F5 — P1 — Lab operational views show fabricated readings as live facts

**Evidence:** `src/features/laboratory/LabScreen.tsx`: QC panel hardcodes Sysmex/Reflotron equipment, operational status, calibration ages and pass rates (100%, 98.5%); analytics hardcodes 98.2% TAT and 1,450,000 TZS revenue; Lab Store hardcodes 500/120/250 supply units and stock status. No supporting equipment/QC/store service or schema is used.

**Behavior / root cause:** Values remain unchanged in every database state and are presented as actual operations. Confirmed literals, not runtime-derived metrics.

**Reproduction:** Open Lab → QC & Equipment, Analytics, Lab Store for empty and populated databases; claims stay fixed.

**Minimal fix:** Remove/gate claims until backed by records, or show unavailable state. Later compute revenue/TAT from records with defined periods and stock from actual inventory.

**Regression tests:** Empty DB never shows fake metrics; seeded records change computed values; metric boundary/period tests.

**Dependencies/order:** Immediate before release; actual equipment/store domains before implementation.

### F6 — P2 — Enabled Lab destinations are nonfunctional or permanently empty

**Evidence:** `src/features/laboratory/LabScreen.tsx`: Test Catalog is read-only; QC/Equipment and Lab Store are static; Analytics partly derives counts but key metrics are literals; Lab Manager is generic user list; Audit Log is generic log list; Results only lists results. `src/features/laboratory/components/LabOrdersList.tsx` sets Online and Forwarded count to `0` and returns `[]` whenever selected. `LabScreen` default renders “shell ready.” No create/edit catalog or result entry API is surfaced in screen.

**Behavior / root cause:** Enabled destinations look like working features but lack operational actions/data. Online/Forwarded are impossible to populate. Confirmed.

**Reproduction:** Select each view and try expected workflows; Online/Forwarded are empty regardless of data; Results has no entry action.

**Minimal fix:** Hide/disable or plainly mark unfinished destinations until backed; wire result UI to existing command after F3; define online/forwarded sources before enabling filters.

**Regression tests:** Each visible destination has a working action or explicit unavailable state; channel counts/filter match records.

**Dependencies/order:** F3 and authorization for catalog edits.

### F7 — P2 — Audit view is incomplete and Lab mutations bypass audit

**Evidence:** `src/hooks/useLab.ts` fetches generic `auditApi.list()`, and `LabScreen.tsx` displays all logs without Lab action/branch filtering or actor detail. `LabService.create_order` and `collect_sample` append audit in their transaction; active status commands and `enter_lab_result` do not. Audit log is append-only by migration trigger, which is a positive safeguard.

**Behavior / root cause:** Users cannot rely on this view as complete Lab history. Confirmed.

**Reproduction:** Change order/sample status or enter a result and inspect audit records; those actions do not emit Lab audit events.

**Minimal fix:** Require audit append in every Lab mutation transaction; provide correctly authorized Lab/branch/action filtering and actor information.

**Regression tests:** Exactly one audit entry per mutation; rollback audit and data together; filters isolate workspace/branch.

**Dependencies/order:** F1 and F3.

### F8 — P2 — Browser-mode APIs report fake attachment persistence/export success

**Evidence:** `src/api/notificationsApi.ts`: non-Tauri `saveAttachment` returns guessed sizes, `mock_sha256_hash`, fake storage path; `exportAttachment` returns `/mock/Documents/40Labs/...`; `exportAttachmentToPath` returns destination without writing. `src/api/client.ts` selects native IPC only if Tauri globals exist. Similar module-level `devData` stores exist across APIs.

**Behavior / root cause:** Running frontend outside Tauri resolves operations that have not persisted/exported anything. Confirmed. Whether a browser bundle is distributed is deployment-specific.

**Reproduction:** Run `pnpm --filter @40labs/core-desktop dev`; save/export an attachment and observe resolved mock path/hash without file output.

**Minimal fix:** Fail closed when native service unavailable in production; inject fixtures only through explicit test/development wiring that cannot silently ship as production behavior.

**Regression tests:** Production browser mode rejects unavailable persistence; Tauri round-trip; fixtures isolated from release API path.

**Dependencies/order:** Before shipping browser/debug mode to production users; apply feature-by-feature.

### F9 — P2 — Attachment MIME validation trusts declarations and attachment linking can partially fail

**Evidence:** `src-tauri/src/commands/notification_cmd.rs::save_attachment` enforces 16MB image/audio and 100MB generic limit, hashes bytes and cleans partial files on failures (positive). But image/audio checks only declared MIME prefix; generic file accepts any MIME. `NotificationsScreen.tsx` saves attachments sequentially, logs individual failure, then sends remaining IDs. Native `send_notification_message` creates message with `attachments: None` and does not use supplied attachment IDs; send/message-body updates are separate writes.

**Behavior / root cause:** File content can disagree with declared MIME; multiple saves can partially succeed and send anyway; native message association is not persisted. Confirmed code behavior; downstream viewing/exploit consequences need runtime reproduction.

**Reproduction:** Supply non-image bytes declared `image/png`; accepted. Fail one attachment in a multi-file send; remaining set is sent. Inspect outgoing message attachment links; native handler does not persist supplied IDs.

**Minimal fix:** Validate supported content signatures and safe extension; persist attachment associations transactionally; require all-or-explicitly-partial outcome with UI feedback.

**Regression tests:** Content/MIME mismatch rejects; file cleanup after DB failure; transactional message+attachment association; partial failure is visible.

**Dependencies/order:** Before attachment use for clinical data; coordinate with preview renderer.

### F10 — P2 — Database path logging and fallback require production hardening

**Evidence:** `src-tauri/src/db.rs::resolve_db_url` prints full `DATABASE_URL` and resolved file path. Release path falls back APPDATA → XDG_DATA_HOME → HOME/.local/share → current directory. SQLite URL is constructed by string interpolation. Initialization runs migrations at startup, enables WAL/foreign keys, refuses migration errors, and does not delete data (positive safeguards).

**Behavior / root cause:** Full filesystem/URL details leak to logs; current-directory fallback and URL-reserved path parsing may behave unexpectedly on supported OS paths. Logging is confirmed; path parsing/runtime failure is a risk pending reproduction.

**Reproduction:** Set `DATABASE_URL` to a sensitive path and inspect logs; test path with `?`, `#`, spaces on Windows and Unix; test fresh install with app-data env missing.

**Minimal fix:** Redact paths; use SQLx filename options rather than composing a URL; resolve platform app data through Tauri path APIs; fail explicitly if unavailable.

**Regression tests:** Special-character paths per OS; fresh install path; migration failure preserves copied DB.

**Dependencies/order:** Before release packaging. Never reset user DB to address migration issues.

### F11 — P2 — Related notification writes are not transactionally atomic

**Evidence:** `notification_cmd.rs::create_notification` inserts notification then message separately. `send_notification_message` inserts message then separately updates notification body/status. A second-operation failure leaves first operation committed. Similar pattern applies to attachment-message linking (F9). Lab multi-write service paths do use transactions, though status mutations do not.

**Behavior / root cause:** Partial notification state is possible after DB errors/process interruption. Confirmed from call path.

**Reproduction:** Inject constraint/DB failure between first and second writes; inspect persisted notification/message state.

**Minimal fix:** Use a transaction for each multi-record domain action and check affected rows; commit only after all writes/audit/linking succeed.

**Regression tests:** Failure injection rolls back all related rows; nonexistent notification returns not-found; no orphan message/body mismatch.

**Dependencies/order:** Attachment-link design F9.

### F12 — P3 — Placeholder labels and date filters conceal bad links or include future records

**Evidence:** `LabScreen.tsx` and Lab list components use `Guest Patient`, `Lab Test`, `General` when related entities are unavailable. `LabOrdersList.tsx` and `LabSamplesList.tsx` compute elapsed days and check only upper bounds; future dates have negative elapsed time and count as recent.

**Behavior / root cause:** Missing relationships appear legitimate; future timestamps can enter today/week/month/recent buckets. Confirmed.

**Reproduction:** Render a record with missing patient/test link; use a timestamp in the future and select a recent filter.

**Minimal fix:** Render an explicit missing-reference state with IDs; use calendar/explicit date boundaries and reject invalid/future values as policy requires.

**Regression tests:** Missing relationship rendering; future/invalid timestamps; timezone/calendar boundaries.

**Dependencies/order:** F1 and data integrity policy.

## Hardcoded-value inventory

| Value/location | Classification | Action |
|---|---|---|
| LabScreen QC equipment names, statuses, calibration age, pass rates | Mock/demo data | Remove/gate until timestamped equipment/QC records exist. |
| LabScreen TAT 98.2%, revenue 1,450,000 TZS | Derived values incorrectly hardcoded | Compute from order times/prices and a defined period; otherwise unavailable. |
| LabScreen supplies 500/120/250 and stock labels | Mock/demo data | Read from actual inventory/lot data. |
| `Guest Patient`, `Lab Test`, `General` fallbacks | Placeholder identity | Display missing relation, never imply real patient/test. |
| `customers[0]?.id` in requisition | Incorrect data fallback | Remove; require selected/persisted patient. |
| Online/Forwarded count 0 and hardcoded empty results | Incomplete feature | Implement query/count or disable destination. |
| 24-hour TAT SLA in `LabSamplesList.tsx` and dashboard | Legitimate configuration only if approved | Centralize as documented tenant/business policy, including definition. |
| `devData` catalog, users, patients, prices, etc. | Demo/reference fixtures | Keep test/demo-only; ensure production APIs never fall back. |
| `WORKSPACE_ID`, `BRANCH_ID`, mock user IDs in API fallback | Mock/demo identity | Remove from production runtime. |
| fake attachment sizes/hash/paths in `notificationsApi.ts` | Fake success | Remove outside explicitly isolated tests/demo. |
| Scheduling `mockSchedules` / `lib/mockData.ts` | Demo data | Replace with persistence or explicit demo-only mode. |
| file limits 16/100MB, DB pool max 5, currency TZS, enum values | Legitimate configuration/domain reference | Document and validate; not record-derived. TZS is consistent with current schema. |
| hardcoded locale `en-GB` in Lab audit/date display | Presentation configuration | Source from application locale. |

## Data-path trace

### Laboratory

- **Orders read:** `LabScreen` → `useLab` (`labKeys.orders`) → `labApi.listOrders` → `get_lab_orders` → session auth → `LabRepository.list_orders` → `lab_order`.
- **Order create:** modal → `LabScreen.handleAddOrder` → `useLab.createOrder` → `labApi.createOrder` → `create_lab_order` → `require("lab.order")` → `LabService.create_order` (audit+insert transaction) → `lab_order` and customer/catalog FKs.
- **Sample collection:** API/hook/native command/service exist; service inserts sample and changes order with audit in one transaction. `LabScreen` does not pass collection callback to `LabSamplesList`; verify actual collect UI before release. Sample status list writes status only.
- **Result:** `useLab` → `labApi` → `get_lab_results` / `enter_lab_result` → direct repository insert and order status transaction. No screen entry UI, no active audit, no report approval.
- **Catalog:** API → `get_test_catalog` → repository → `test_catalog_entry`; read-only, no mutation path.
- **Report:** `lab_report` table exists; no repository, command, API, hook or UI call site.
- **QC/Equipment, Lab Store, analytics:** no data path; literals. Lab Manager reads general user list; Audit view reads generic audit API.

### Database, tenancy, authorization

`db.rs` uses SQLx migrations at `infra/db/sqlite-schema/migrations`, WAL, max 5 connections and `foreign_keys(true)`. Dev DB is `<repo>/dev-data/40labs-dev.db`; release uses APPDATA/XDG/HOME with current-directory fallback. Version-10 reconciliation records the migration only if required columns already exist. Startup aborts on migration/init failure without deleting database. Lab write commands require `lab.order` or `lab.result.enter`; list commands require only a session. Confirm role policy for patient result visibility. Workspace-only predicates and globally unique FK IDs do not enforce branch isolation. React Query mutations invalidate `labKeys.all` and dashboard keys; aggregate loading/error does not include user/audit queries.

### Files and reports

Composer dialog → `notificationsApi.saveAttachment` → `save_attachment`; native code writes to app-data `attachments/<workspace>/<id>`, computes SHA-256, applies size/MIME-prefix checks and removes partial file on stream/DB insert error. Preview resolves ID under current workspace and checks canonical path containment. Export copies to Documents layout; Save As uses selected destination and sanitized filename. These native path checks are positive. Generic byte IPC is limited to 16MB, while source-path streaming supports 100MB. No Lab report export path exists. Runtime preview/download and OS permissions were not exercised.

## App-wide placeholder/mock scan

Confirmed seeded memory stores and `devData` usage exist in Lab, customers, sales, inventory, purchases, notifications, users/devices, integrations, backup, audit, branches, business, pharmacies, and Zustand stores. `devicesApi` catches Tauri failures and falls back to mock memory. `authApi.ts` contains demo session/user/token behavior; verify production selection/build gating. `SchedulingScreen.tsx` initializes static `mockSchedules`. App Help/Update handlers only `console.log`; menu actions explicitly disabled are not counted as working. These findings are source-confirmed; whether browser mode is used in production depends on release/deployment packaging. A full click-by-click inventory requires runtime exploration.

## Checks

- `git status --short --branch`: clean `main...origin/main` at start.
- `pnpm --filter @40labs/core-desktop build`: **passed** (`tsc` + Vite build). Warnings: Tauri core is dynamically and statically imported; one JS chunk is 1,377.68 kB (gzip 378.01 kB).
- `cargo check --manifest-path apps/core-desktop/src-tauri/Cargo.toml`: **could not complete**. The first native dependency build exhausted available disk while writing Rust metadata (`os error 112`, `no space on device`); this is an environment limitation, not a compiler diagnostic against project source.
- No runtime Tauri/session/database/dialog tests were performed. SQL and handler issues above are code-confirmed; platform DB path, actual preview and partial-failure scenarios require runtime reproduction.
- No tests added, and no database reset performed.

## Small implementation sequence

1. Branch-scope Lab reads/writes and related-ID validation; two-branch tests (F1).
2. Server-side status state machine, affected-row handling, awaited/error toasts (F2).
3. Remove patient fallback; require explicit or persist manual patient (F4).
4. Remove/gate fake QC/store/analytics; disable clearly unfinished navigation (F5/F6).
5. Audited result service, sample/order validation, abnormal-result approval policy (F3/F7).
6. Report generate/approve/release/export lifecycle with atomic metadata/file failure cleanup (F3).
7. Content-validate attachments and transactionally link them to messages; make partial failure explicit (F9/F11).
8. Separate production API from dev fixtures; fail closed without native service (F8).
9. Redact DB paths and use platform/path-aware SQLite options; cross-OS migration tests (F10).
10. Build catalog editing, QC/equipment, stock, analytics and Lab audit as separate data-backed workstreams (F6).

**Highest priority:** F1 branch isolation, F2 state mutation integrity, F3 result/report safety, F4 patient identity, F5 fabricated operational metrics.
