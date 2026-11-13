# API Core Operations

## Local and automated-test stacks

```powershell
Copy-Item infra/docker/.env.local.example infra/docker/.env
docker compose --env-file infra/docker/.env -f infra/docker/compose.dev.yml up --build -d
Invoke-WebRequest http://127.0.0.1:3000/healthz
Invoke-WebRequest http://127.0.0.1:3000/readyz
docker compose --env-file infra/docker/.env -f infra/docker/compose.dev.yml logs --tail 100 api-core
```

The development credentials and signing keys are fixtures. Never reuse them outside local development. For isolated container integration work, use `docker compose -f infra/docker/compose.test.yml up --build --abort-on-container-exit`; its PostgreSQL data directory is ephemeral. CI uses a fresh PostgreSQL 16 service for each run.

## Health, readiness, and metrics

- `GET /healthz`: process liveness only; suitable for restart probes.
- `GET /readyz`: bounded SQL pool connection plus required-schema check; use for load-balancer readiness. A database outage returns 503 without exposing SQL details.
- `GET /metrics`: Prometheus text counters for total requests, server errors, request latency histogram/mean, SQLx pool size/idle count, sync push responses, and device heartbeat responses. It has no patient, device, tenant, URL, or credential labels. Keep it on private service networking and restrict the monitoring scraper. Counters reset on process restart; aggregate them in the collector.
- Admin infrastructure endpoints already report sync failures and device last-seen age. Alert on rising sync failures and devices beyond the agreed heartbeat threshold; dashboard data is persisted in PostgreSQL.

Request IDs are generated when absent, returned as `X-Request-Id`, propagated through request spans, and never use request headers as span fields. JSON tracing records method, matched route/status, and latency without request/response bodies or headers. Server errors also emit a structured `api_request_failed` event for log-based error tracking and alerting. Ship these events to CloudWatch Logs Insights or the organization's error tracker with request IDs preserved. Do not add payloads, authorization/cookie headers, OTP values, patient data, phone numbers, or secret values to logs. Error responses hide SQL/internal error details.

## PostgreSQL pool and capacity

Pool controls are `DATABASE_MAX_CONNECTIONS` (default 20), `DATABASE_CONNECT_TIMEOUT_SECS` (5), and `DATABASE_ACQUIRE_TIMEOUT_SECS` (5). Production Compose defaults the pool to 40; tune it against the selected RDS class and replica count. Keep:

`API task count × max pool connections + migration/monitoring/admin connections <= 80% of PostgreSQL max_connections`.

Reserve the remaining capacity for failover, maintenance, and operator access. Monitor `DatabaseConnections`, free storage, CPU, read/write latency, deadlocks, and replica lag where applicable. Alert before connection use exceeds 70% and storage before the configured low-water mark. Scale API tasks only after recalculating the connection budget. SQLx pool size and idle counts are exposed through `/metrics`.

Use database-side statement/lock timeouts appropriate to the workload and monitor slow query logs with parameter values disabled. Test timeouts and failover against staging. API connection attempts and pool acquisition are bounded; requests fail with a generic server error during database unavailability, readiness fails closed, and the process can reconnect through SQLx after the database returns. Do not add an in-memory rate-limit fallback: shared rate limiting remains database-backed.

## Migration operations

Development and test environments apply migrations on startup. Staging/production do not. For release, launch exactly one task from the release image with the runtime and migration database URL secrets; only this task receives the migration role. Confirm the process exits zero and compare SQLx migration history before deploying the API service. The command is idempotent through SQLx migration tracking and the legacy foundation adoption in `services/api-core/src/migrations.rs`. Never clear `_sqlx_migrations` or recreate `public` to resolve a migration error.

For a local migration run, set `MIGRATION_DATABASE_URL` in the ignored environment and execute:

```powershell
docker compose --env-file infra/docker/.env -f infra/docker/compose.dev.yml run --rm api-core migrate
```

Inspect the failing migration and PostgreSQL logs, restore a verified backup into a separate database if needed, and use a forward migration after review. Do not perform an automatic down migration in production.

## Backups, retention, and restore

Production AWS: enable RDS automated backups with a 35-day retention window, point-in-time recovery, encryption, and a scheduled cross-account or cross-region copy according to the recovery objective. At least quarterly, restore a snapshot/PITR point into a new isolated database and record measured RPO/RTO and validation results. Alert if the last successful backup exceeds 26 hours or a restore drill is overdue.

Self-managed PostgreSQL: create a libpq service entry and `.pgpass` outside the repository, restrict file ACLs to the service account, then run `infra/db/backup/backup-postgres.ps1 -PgService 40labs-prod -OutputDirectory D:\40labs-backups -RetentionDays 30`. The script writes a custom-format `pg_dump`, validates it with `pg_restore --list`, writes a SHA-256 sidecar, and prunes only matching backups older than the retention window. Register a daily Windows Task Scheduler job with `scripts/register-postgres-backup-task.ps1`; it runs at 02:00 machine-local time by default. On Linux, use a protected systemd timer/cron job with the same backup command and retention policy. Copy backups off-host to encrypted object storage with restricted access and lifecycle retention; local disk alone is not a backup.

To restore, use an isolated, new target database. Verify the `.sha256` sidecar and run:

```powershell
infra/db/backup/restore-postgres.ps1 -PgService 40labs-restore -BackupFile D:\40labs-backups\40labs-<timestamp>.dump -TargetDatabase afya_core_restore_20261113
```

The restore script refuses to overwrite an existing database, verifies the archive checksum, restores without source ownership/ACLs, and validates the target. Review row counts and application readiness against the restored target before any recovery cutover. Keep the source database unchanged until the recovery decision is complete.

## Graceful restart and database interruption

The container runs non-root, with a read-only root filesystem and a 30-second Compose stop grace period. SIGTERM/SIGINT stops accepting new work and lets Axum drain requests; SQLx pools close when the process exits. For a rolling restart, wait for replacement instances to pass `/readyz` before draining old ones.

Interruption drill in a disposable environment: stop PostgreSQL, confirm `/readyz` returns 503 and API requests return generic errors without secrets/data, restore PostgreSQL, wait for `/readyz` 200, then complete one test heartbeat and sync request. Restart the API container while it is serving and confirm the replacement becomes ready. Never run these destructive interruption steps against staging/production databases.

## Incident checklist

1. Check target health, `/readyz`, request ID, and aggregate 5xx/latency metrics.
2. Inspect JSON logs by request ID; do not enable body/header logging.
3. Check RDS events, connection count, storage, CPU, failover state, and network/security-group changes.
4. For migration incidents, stop rollout and preserve database state and logs; do not reset schema or delete migration records.
5. For credential incidents, rotate the affected secret via the secret manager and roll tasks; never put the secret in incident notes or commands.
6. For restore, use a new database and follow checksum plus application validation before cutover.
