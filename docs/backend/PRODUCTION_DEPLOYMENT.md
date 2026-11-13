# API Core Production Deployment

This guide prepares API Core for the AWS deployment target in `eu-north-1`. The service remains a Rust/Axum container and connects to PostgreSQL over TLS. Cloud services stay at the deployment boundary: no AWS SDK or AWS-specific behavior is required by business logic.

## Environments

| Environment | `APP_ENV` | Database | Migration policy | Secrets |
|---|---|---|---|---|
| Local development | `development` | Local PostgreSQL Compose | Runs on API startup | Local-only values in ignored `.env` |
| Automated tests | `test` | Ephemeral PostgreSQL service/container | Runs on test startup | Non-production fixture values |
| Staging | `staging` | Dedicated PostgreSQL with TLS | Explicit `api-core migrate` step | Staging secret store; distinct from production |
| Production | `production` | RDS PostgreSQL with TLS, private network | Explicit `api-core migrate` step | AWS Secrets Manager injected as task secrets |

Copy `infra/docker/.env.local.example` to the ignored `infra/docker/.env` for local work. Use `infra/docker/compose.test.yml` for a disposable integration database. `.env.staging.example` and `.env.production.example` are templates only. Never put real credentials in those files, source control, image layers, Compose interpolation, or CI variables that are not secret-scoped.

Production and staging require distinct named runtime and migration roles, an explicit HTTPS `ADMIN_WEB_ORIGIN`, TLS-enabled PostgreSQL URLs, unique signing/encryption keys, live SMS credentials, and `ADMIN_DEBUG_OTP=0`. API startup validation rejects missing/default key material. Stage secrets are independent of production secrets. The runtime DB URL must contain `sslmode=require`, `verify-ca`, or `verify-full`; prefer `verify-full` with the RDS CA bundle configured in the deployment runtime. The normal API task receives only the runtime database URL; the migration task alone receives the separate DDL-capable URL.

## AWS topology

- Put API tasks in private subnets in `eu-north-1`. Use an internet-facing Application Load Balancer with an ACM certificate and HTTPS listener (TLS 1.2 or newer); redirect HTTP to HTTPS. Do not publish the task port to the internet. Forward only to the service port inside the VPC.
- Use RDS for PostgreSQL in private subnets, encrypted storage, Multi-AZ, automated backups, deletion protection, and TLS. Allow inbound database traffic only from the API and migration task security groups.
- Store runtime and migration database URLs, SMS token, activation signing key, TOTP encryption key, and device signing key set in Secrets Manager. Inject them at task start through secret references. Do not bake them into the image or task definition plaintext.
- Send JSON stdout/stderr to CloudWatch Logs with retention and access controls. Scrape `/metrics` from a private monitoring target or use a private sidecar/collector to forward the endpoint to CloudWatch/Prometheus. Alert on readiness failures, 5xx rate, p95 latency at the edge, DB saturation, sync failure counters, stale-device counts, backup age, and free storage.
- Use ECR immutable tags or digests for release identity. API Core's image is provider-neutral and can run under ECS/Fargate or another container scheduler.

TLS terminates at the load balancer. Enforce HTTPS at the listener and redirect HTTP there; the API sets `Secure` admin session cookies for staging/production. Keep the API and RDS endpoints private. The current Compose production file is a container-service template and intentionally does not publish port 3000 to a host. It is not a substitute for AWS networking, managed PostgreSQL, or secret injection.

## Database roles and migration safety

Use a dedicated runtime role and a different migration role. Both must be non-superuser. `infra/db/postgres/bootstrap-roles.sql` is an interactive bootstrap aid for a new database; run it as a DBA with `psql` and verify the role names differ. It prompts for passwords using psql's hidden password prompt. The migration role needs schema/table ownership sufficient to apply the repository migrations. The runtime role receives DML and sequence rights only. Default privileges grant future migration-created tables/sequences to the runtime role.

For an existing database, inspect current owners and grants before adopting this split. Transfer ownership under a reviewed DBA change; do not reset the schema, drop tables, or grant superuser to the service. `GRANT CREATE ON SCHEMA public` is only for the migration role. Keep the runtime role out of schema DDL. Store the two URLs separately as `DATABASE_URL` and `MIGRATION_DATABASE_URL` secrets and inject the migration URL only into the one-off migration task.

Migrations are SQLx versioned migrations and run transactionally where PostgreSQL permits. Review migration SQL for table rewrites, locks, and non-transactional operations before release. Take/verify a backup before a destructive or long-running migration. Deploy one migration task at a time, wait for its exit code, and only then replace API tasks. The API does not migrate the production schema during normal startup.

## Release procedure

1. Build and scan the immutable API image in CI. CI runs `cargo check --locked`, API tests against PostgreSQL 16, and a Docker build.
2. Provision/verify the staging database, roles, network rules, secrets, and HTTPS origin. Apply the candidate image's migration command as a one-off staging task.
3. Roll out staging API tasks, wait for target-group health and `/readyz`, then verify login, activation, sync push, heartbeat, and operational dashboards with staging data.
4. Before production, confirm current automated backup completion and restore-test status. Record the image digest and migration version.
5. Start one production migration task with the same image digest and only the runtime plus migration database URL secret references. Run `/app/api-core migrate`; stop the release if it exits nonzero. Do not run migrations concurrently. The Compose template uses a separate `api-core-migrate` service for this reason.
6. Update the production service to that digest using a rolling deployment. Wait for all new targets to pass `/readyz` before draining old tasks. Allow at least 30 seconds for SIGTERM shutdown.
7. Confirm HTTPS behavior, metrics, logs, error rate, database connections, sync outcomes, and device heartbeats. Keep the prior image digest ready for rollback. Schema rollback is not automatic: use a forward fix or a separately reviewed database recovery plan.

For the self-hosted Compose template, `scripts/deploy-api-core-compose.ps1` builds, runs the migration-only service, updates the API service, and polls its readiness healthcheck. It does not deploy to AWS. Review all Compose secret files and target names before running it.

The manual AWS workflow at `.github/workflows/api-core-deploy.yml` builds a commit-tagged image, registers and runs a one-off migration task, then registers an API task revision and waits for ECS stability. Before enabling it, create `staging` and `production` GitHub Environments; require human reviewers for `production`. Configure environment-scoped variables `AWS_DEPLOY_ROLE_ARN`, `ECR_REPOSITORY_URI`, `ECS_CLUSTER`, `ECS_API_SERVICE`, `ECS_API_TASK_DEFINITION`, `ECS_MIGRATION_TASK_DEFINITION`, and `ECS_NETWORK_CONFIGURATION` (JSON containing private subnet IDs and security group IDs). Configure the GitHub OIDC trust policy to allow only this repository and these environments, and grant the role only ECR push plus the required ECS task/service operations and `iam:PassRole` for the named task roles. The migration task definition must inject both database URLs and invoke `/app/api-core migrate`; the API task definition must inject only runtime/application secrets. The workflow is manual and was not run as part of this preparation.

## Configuration and secret rotation

The file-backed secret convention is `NAME_FILE=/run/secrets/name`; local environments may use `NAME`. Secret files are read at process start. Rotate by adding a new key alongside the old key when verification supports key IDs, switch the active key, roll all instances, wait out the longest token/session lifetime, then remove the old key. The device token key map supports overlap by key ID. TOTP encryption key rotation requires decrypt/re-encrypt of stored TOTP secrets; perform it as a dedicated data migration and retain a recoverable encrypted backup. Rotate database passwords with overlapping roles or coordinated secret/task rollout, then revoke the old credential after all connections drain. Rotate SMS credentials at the provider and update the secret reference. Never print secret values during rotation.

## Fresh deployment and recovery checks

Run the disposable acceptance procedure in `docs/backend/OPERATIONS.md` before production approval. A successful image build alone does not prove the API is deployed: verify migration completion, healthy startup, `/healthz`, `/readyz`, backup archive integrity, and restore into a new database.
