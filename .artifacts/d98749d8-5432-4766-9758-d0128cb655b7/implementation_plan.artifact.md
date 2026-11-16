# Design: Machine-Readable 409 Error Codes for Device Enrollment

Make `POST /v1/devices/enroll` return machine-readable 409 error codes in the response JSON `error` field:
- `DEVICE_SCOPE_CONFLICT`
- `DEVICE_REVOKED`
- `DEVICE_SYNC_RECORD_CONFLICT`

## User Review Required

> [!IMPORTANT]
> - Existing clients reading the `message` field will continue to receive the exact human-readable message string.
> - The machine-readable code will be placed in the `error` field of the JSON error response (e.g. `{"error": "DEVICE_REVOKED", "message": "..."}`).

## Proposed Approaches

### Approach 1: Application-Level Classification with Follow-Up SELECT (Recommended)
1. **Error Variants in `ApiError`**:
   Extend `ApiError` in `services/api-core/src/error.rs` with new variants:
   - `DeviceScopeConflict(String)` -> status 409, code `"DEVICE_SCOPE_CONFLICT"`
   - `DeviceRevoked(String)` -> status 409, code `"DEVICE_REVOKED"`
   - `DeviceSyncRecordConflict(String)` -> status 409, code `"DEVICE_SYNC_RECORD_CONFLICT"`
2. **Enrollment Classification in `services/api-core/src/routes/device.rs`**:
   - When the `device_enrollments` upsert returns `None`, execute a follow-up query within the same transaction (`&mut *tx`):
     ```rust
     let existing = sqlx::query_as::<_, (Option<chrono::DateTime<chrono::Utc>>, String, String, String)>(
         "SELECT revoked_at, business_id, workspace_id, branch_id FROM device_enrollments WHERE device_id = $1"
     )
     .bind(&req.device_id)
     .fetch_optional(&mut *tx)
     .await?;
     ```
   - Classify:
     - If `existing` has `revoked_at.is_some()`: return `ApiError::DeviceRevoked("...")` (Revoked wins over scope conflict).
     - Otherwise (or if scope doesn't match / row exists): return `ApiError::DeviceScopeConflict("...")`.
   - For `sync_devices` rows affected check (`sync_device.rows_affected() != 1`): return `ApiError::DeviceSyncRecordConflict("...")`.
3. **Transaction Rollback & Grant Unconsumed Property**:
   - Because `device_enrollment_grants` insert and `device_enrollments` upsert happen in the same transaction (`&mut *tx`), returning an `Err` aborts the transaction without committing, leaving the grant unconsumed.

### Alternative 2: SQL-Level Classification (CTE / Conditional Query)
1. Use complex CTEs or database functions / conditional upsert statements to determine the exact failure reason inside PostgreSQL and return it via `RETURNING` or status flags.
2. *Pros*: All logic encapsulated in SQL.
3. *Cons*: Harder to debug, less readable error classification in Rust, tightly couples error semantics to complex query logic, and makes priority handling ("Revoked wins over scope conflict") cumbersome to express cleanly in SQL without multiple queries or complex CASE statements.

## Assumptions
- Revoked status is checked first (`revoked_at IS NOT NULL`) when an enrollment conflict occurs, ensuring revoked wins over scope conflict.
- The transaction rollback automatically rolls back the grant consumption when enrollment or sync record upsert fails with a 409.
- Existing human message strings remain unchanged.

## Proposed Changes

### [MODIFY] [error.rs](file:///C:/dev/40Labs/services/api-core/src/error.rs)
- Add variants `DeviceScopeConflict`, `DeviceRevoked`, `DeviceSyncRecordConflict` to `ApiError`.
- Map them to HTTP 409 and respective machine-readable codes (`DEVICE_SCOPE_CONFLICT`, `DEVICE_REVOKED`, `DEVICE_SYNC_RECORD_CONFLICT`) in `IntoResponse`.

### [MODIFY] [device.rs](file:///C:/dev/40Labs/services/api-core/src/routes/device.rs)
- Update `enroll_device` to perform follow-up selection when upsert returns `None`, checking `revoked_at` first, then scope conflict.
- Update `sync_devices` rows affected check to return `ApiError::DeviceSyncRecordConflict`.

### [MODIFY] [device_security_test.rs](file:///C:/dev/40Labs/services/api-core/tests/device_security_test.rs)
- Add unit/integration tests verifying each 409 error code (`DEVICE_SCOPE_CONFLICT`, `DEVICE_REVOKED`, `DEVICE_SYNC_RECORD_CONFLICT`), verifying that revoked wins over scope conflict, and verifying that failed enrollments leave the grant unconsumed.

### [MODIFY] [DEVICE_AUTH.md](file:///C:/dev/40Labs/services/api-core/docs/DEVICE_AUTH.md) & [openapi.yaml](file:///C:/dev/40Labs/services/api-core/docs/openapi.yaml)
- Document the new machine-readable 409 error codes for enrollment.

## Verification Plan

### Automated Tests
- Run `cargo test -p api-core` with `API_CORE_TEST_DATABASE_URL` set.
- Verify all new test cases pass successfully.
