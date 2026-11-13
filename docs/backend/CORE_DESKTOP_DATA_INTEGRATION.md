# Core Desktop data integration status

Last reviewed: 2026-11-13

## Architecture

Core Desktop remains local-first. React Query reads through typed API modules; application mutations should cross Tauri IPC into Rust commands, services, repositories, and the workspace-scoped SQLite database. Cloud transport is a separate background worker. It uses the persisted `sync_outbox`; loss of network leaves mutations queued for the next run. Credential refresh is attempted after HTTP 401. A failed refresh is surfaced as an expired device session and queued data remains local.

The cloud push worker batches up to 100 changes and at most five batches per run. It validates response acknowledgements against the submitted change IDs, stores the returned server cursor, scopes selected outbox rows to the workspace and branch embedded in the device token, and resets interrupted `inflight` rows after restart. A 409 marks the batch for review. Local changes are not discarded on transport failure.

## Cloud support boundary

| Domain | Local SQLite | API Core push/pull | Status |
|---|---|---|---|
| Business profile | Yes | Push: `business`; no pull endpoint | Push only |
| Inventory batches and prices | Yes | Push: `inventory_item`, `price`, `price_history`; no pull endpoint | Push only; inbound reconciliation unavailable |
| Daily summaries | Local derived/queued | Push: `daily_summary` | Push only |
| Customers | Yes | No customer sync entity/API | Local only |
| Sales and dispensing | Yes | No sale sync entity/API | Local only |
| Suppliers and purchases | Yes | No supplier/purchase sync entity/API | Local only |
| Laboratory orders/results | Yes | No lab sync entity/API | Local only |
| Users and permissions | Yes | No user sync entity/API | Local account data only |
| Reports | Derived from local records | No report endpoint/sync entity | Local only |
| Device registration | Device enrollment/credential refresh exists | Device activation APIs exist | Enrollment supported; management breadth is limited |
| Audit records | Written locally by supported Rust services | No audit sync entity/API | Local only |
| Workspaces and branches | Local business/branch records | No general workspace/branch pull API | Device token scopes cloud writes |

API Core currently provides push acknowledgement and a cursor only. The cursor is recorded, but there is no server pull/reconciliation operation, so cloud changes do not flow back into SQLite. Do not describe the supported push entities as full bidirectional synchronization.

## Verified integration changes

- Added authenticated `cloud_sync_now` and `cloud_sync_status` commands, registered behind the existing desktop session policy.
- Added a periodic sync attempt and an online-triggered React Query action. Errors remain visible through sync status and do not clear pending rows.
- Added SQLite-backed `get_medicines_list` and `get_stock_adjustments`, both requiring `inventory.view`; inventory analytics now uses database/API results and propagates failures instead of substituting sample stock.
- Removed fabricated movement rows from the active analytics hook. Historical movement detail is unavailable when the current API does not provide the required fields.
- Removed the development-only mock authentication selection. A web preview without Tauri now fails authentication explicitly.
- Dashboard summary retrieval now fails if any required source query fails instead of calculating a partial summary with silently empty domains.

## Known incomplete or unsupported client operations

The API modules under `apps/core-desktop/src/api` have not all been migrated from their earlier in-memory development implementations. In particular, the inventory batch detail `update` operation is explicitly rejected except quantity-only changes (which use the SQLite stock-action transaction); batch metadata editing is not implemented. Sales dispensing-instruction commands are referenced by the frontend but are not registered in Tauri. User/device and purchase API modules also contain methods that need command/repository backing before they should be treated as available. Unsupported calls must surface an error and must not be reported as successful persistence.

Other modules found importing `devData` or keeping fallback state during this review include `auditApi`, `authApi`, `backupApi`, `branchesApi`, `businessApi`, `customersApi`, `dashboardApi`, `devicesApi`, `integrationsApi`, `inventoryApi`, `labApi`, `labWorkflowApi`, `notificationsApi`, `pharmaciesApi`, `purchasesApi`, `salesApi`, and `usersApi`. Some have real Tauri paths while others still retain browser/dev fallback branches; this audit does not certify each operation as SQLite-backed. `authApi` is the exception changed here: it no longer selects mock authentication in web development.

## Acceptance-test limits

The sync store test covers workspace/branch scoping and recovery of interrupted rows. This change does not demonstrate live API enrollment, live network push, conflict resolution against a running API, or a mutation surviving a full Core Desktop restart. The existing server contract also lacks entities for customers, sales, suppliers, purchases, laboratory data, users, and reports, so those requested cloud acceptance flows cannot pass until API Core adds explicit schemas, authorization, idempotency, and transactional handlers. Local SQLite persistence remains available for those existing supported desktop workflows.
