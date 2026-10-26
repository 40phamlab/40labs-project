# Phase Admin-0: Environment Wiring (do this BEFORE any feature code)

Goal: from a clean checkout, one command set runs Postgres + api-core + admin-web, with debug output visible. No features yet.

## Step 1: Audit what already exists (report, don't assume)
- Read `package.json`, `pnpm-workspace.yaml`, `turbo.json`, root `.env*`, `infra/docker/*`, `services/api-core/Cargo.toml`, and the `apps/admin-web` scaffold.
- List reusables available: `packages/design-tokens`, `packages/types`, Tailwind v4 `@theme` setup in core-desktop, fonts, existing Axum middleware/auth/error types, existing Postgres migration runner, sqlx config.
- Output a short table: **Reusable now / Needs copying / Missing**. Reuse anything in the first column; never rebuild it.

## Step 2: Workspace wiring
- Make sure `apps/admin-web` is picked up by pnpm workspace + Turborepo (`dev`, `build`, `typecheck`, `lint` tasks).
- Add deps (only what's missing): react-router, @tanstack/react-query, zustand, recharts. Match versions already used in core-desktop.
- Add `@40labs/design-tokens` and `@40labs/types` as workspace deps (use the actual package names).
- Tailwind v4: import the same `@theme` token CSS core-desktop uses. No tailwind.config.js.
- Fonts: Sora, Inter, JetBrains Mono, same loading approach as core-desktop.
- Root scripts: `pnpm dev:admin` (vite on port 5174), `pnpm typecheck`, `pnpm lint`.

## Step 3: Backend + DB (Docker, extend don't replace)
- If `infra/docker` already has a compose/Dockerfile for api-core + Postgres, extend it. If not, create: multi-stage Rust Dockerfile (non-root user, minimal runtime image), `docker-compose.yml` with `postgres` (named volume, healthcheck) and `api-core` (depends_on healthy).
- `.env.example` (committed) + `.env` (gitignored) with: `DATABASE_URL`, `ADMIN_WEB_ORIGIN=http://localhost:5174`, `RUST_LOG=debug,sqlx=warn`, `HEALTH_PROBE_INTERVAL_SECS=60`, `SESSION_SECRET`, `TOTP_ENC_KEY`. Fail fast with a clear message if a required var is missing.
- Run the existing Postgres migrations (0001_sync_foundation). Confirm `cloud_*`, `sync_changes`, `sync_devices` exist.
- `GET /healthz` and `GET /readyz` live and curl-able.
- Debug mode: `RUST_LOG=debug` prints auth/DB output to the terminal. Never log secrets (see redaction rules).

## Step 4: Frontend shell smoke test
- Copy the shell from core-desktop (sidebar + top bar + tabs) into `src/_copied/` and render it with 6 empty routes.
- Dark/light toggle works. Fonts and colors match tokens.
- API client reads `VITE_API_BASE_URL` (default `http://localhost:8080`; use the port api-core really uses).

## Step 5: Windows note
Repo lives under OneDrive. Warn the user to exclude `node_modules`, `target`, and `.turbo` from OneDrive sync (file locking causes random build failures). Do not change OneDrive settings yourself.

## Step 6: Verify and report
Run and paste outputs of: `pnpm install`, `pnpm typecheck`, `pnpm dev:admin` (page loads), `docker compose up` (healthy), `curl /healthz`, `curl /readyz`, `git diff --stat -- apps/core-desktop packages/ui-components` (must be empty).

✅ Checkpoint Admin-0: one-page report with the Reusable/Copy/Missing table, all verify outputs, deviations. STOP and wait for approval before Admin-A.
