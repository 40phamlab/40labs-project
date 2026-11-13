# API Core administrative API

The supported Admin Web API is mounted at `/admin/v1`. Its implemented endpoints, request/response contracts, authentication and RBAC matrix, error behavior, and known unavailable operations are maintained in [`docs/backend/ADMIN_WEB_API_STATUS.md`](../../../docs/backend/ADMIN_WEB_API_STATUS.md).

That reference reflects the current Axum routes and PostgreSQL-backed operations. Do not use the old design proposal below: administrative functions are no longer direct-DB maintenance, and unsupported workspace/branch/user-management actions are explicitly called out in the status reference.
