# 40Labs Docker Infrastructure

This directory contains containerization artifacts for `api-core` and PostgreSQL in development and production environments.

## Architecture & Security
- **Multi-stage builds**: Compiles the `api-core` workspace package in a Rust builder image and runs it in `gcr.io/distroless/cc-debian12:nonroot`.
- **Security Hardening**:
  - Non-root execution (`USER 65532:65532`).
  - Read-only root filesystem (`read_only: true` in production compose).
  - Dropped all Linux capabilities (`cap_drop: [ALL]`).
  - `no-new-privileges` security options enabled.
  - Writable `/tmp` mounted via `tmpfs`.
- **Secrets Management**: Supports both direct environment variables (`VAR`) and Docker secrets / file mounting (`VAR_FILE` support in `config.rs`).

## Development Stack (`compose.dev.yml`)
Starts PostgreSQL 16 and `api-core` in test mode with automated database migrations.

### Commands:
- Start: `docker compose --env-file infra/docker/.env -f infra/docker/compose.dev.yml up --build -d`
- Stop: `docker compose --env-file infra/docker/.env -f infra/docker/compose.dev.yml down`
- Reset DB & Volumes: `docker compose --env-file infra/docker/.env -f infra/docker/compose.dev.yml down -v`
- PowerShell Helper Scripts (`scripts/`):
  - `scripts/docker-up.ps1`
  - `scripts/docker-down.ps1`
  - `scripts/docker-reset-db.ps1`

### Ports:
- API Core: `http://127.0.0.1:3000`
- PostgreSQL: `127.0.0.1:5432`

If port 5432 is already in use, set `POSTGRES_HOST_PORT` to another free host port when starting Compose. The API continues to connect to PostgreSQL through the Compose network.

## Production Stack (`compose.prod.yml`)
Production-grade deployment configuration with resource limits, restart policies, log rotation, and file-based secrets.

### Setup Secrets:
Before running production compose, populate secret files in `infra/docker/secrets/`:
- `infra/docker/secrets/postgres_user.txt`
- `infra/docker/secrets/postgres_password.txt`
- `infra/docker/secrets/database_url.txt`
- `infra/docker/secrets/nextsms_api_token.txt`
- `infra/docker/secrets/activation_signing_key.txt`

### Commands:
- Start: `docker compose -f infra/docker/compose.prod.yml up --build -d`
- Stop: `docker compose -f infra/docker/compose.prod.yml down`

## Security Scanning (Trivy & Hadolint)

### Hadolint (Dockerfile Linting):
```bash
hadolint infra/docker/api-core.Dockerfile
```

### Trivy (Container Vulnerability Scanning):
```bash
trivy image --severity HIGH,CRITICAL 40labs-api-core:latest
```
