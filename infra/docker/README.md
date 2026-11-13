# 40Labs API Core Containers

API Core builds from the workspace into a pinned Rust builder and a non-root distroless runtime. The production API container has a read-only root, dropped capabilities, a readiness healthcheck, bounded resources, JSON logs, and SIGTERM grace time. Runtime secrets support `NAME_FILE` paths.

## Environments

- Local development: copy `.env.local.example` to the ignored `.env`, then start `compose.dev.yml`. Development migrations run at API startup.
- Automated tests: `compose.test.yml` provides a disposable PostgreSQL 16 service. Its data remains available over a container restart and disappears when the test container is removed.
- Staging and production: use the respective `.env.*.example` templates and a managed TLS PostgreSQL endpoint. The regular API task receives only its runtime database URL.
- Migrations: run the `api-core-migrate` service with the runtime and separate migration URL secrets. The migration role is mounted only in that one-off service; it is not available to the API service.

For AWS ECS/Fargate with RDS in `eu-north-1`, see [Production Deployment](../../docs/backend/PRODUCTION_DEPLOYMENT.md). The production Compose file is a hardened container template. It does not provide AWS resources, TLS termination, managed backups, or public port publishing. Use the AWS load balancer for HTTPS termination and RDS for production data.

## Local commands

```powershell
Copy-Item infra/docker/.env.local.example infra/docker/.env
docker compose --env-file infra/docker/.env -f infra/docker/compose.dev.yml up --build -d
Invoke-WebRequest http://127.0.0.1:3000/readyz
```

To stop the local stack without deleting its PostgreSQL volume:

```powershell
docker compose --env-file infra/docker/.env -f infra/docker/compose.dev.yml down
```

Use [Operations](../../docs/backend/OPERATIONS.md) for health checks, migrations, backup/restore, capacity, and incident response. Do not use `down -v` against a database with data that must be retained.
