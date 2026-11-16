# Task Tracking: Machine-Readable 409 Error Codes for Device Enrollment

- `[ ]` 1. Update `services/api-core/src/error.rs` with coded conflict variants (`DeviceScopeConflict`, `DeviceRevoked`, `DeviceSyncRecordConflict`).
- `[ ]` 2. Update `services/api-core/src/routes/device.rs` to implement follow-up SELECT classification and return specific 409 error codes.
- `[ ]` 3. Add comprehensive integration tests in `services/api-core/tests/device_security_test.rs` covering all three 409 codes, revoked-wins precedence, and grant unconsumed property.
- `[ ]` 4. Update documentation in `services/api-core/docs/DEVICE_AUTH.md` and `services/api-core/docs/openapi.yaml`.
- `[ ]` 5. Verify build and test suite with `cargo test -p api-core`.
