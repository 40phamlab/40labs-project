# 40Labs Admin Web & API-Core Runbook

## 1. Prerequisites
- Node.js & pnpm
- Rust (Stable) & Cargo
- PostgreSQL (running locally or accessible via `DATABASE_URL`)

## 2. Environment Variables (`.env` in `services/api-core/`)
| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | API Core server port | `3000` |
| `DATABASE_URL` | Postgres connection string | `postgres://postgres:postgres@localhost:5432/40labs` |
| `ADMIN_WEB_ORIGIN` | Allowed CORS origin for admin web | `http://localhost:5174` |
| `APP_ENV` | Environment (`development` / `production`) | `development` |
| `TOTP_ENC_KEY` | 32-byte hex key for TOTP secrets encryption | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` |
| `ACTIVATION_SIGNING_KEY` | Hex signing key for node activations | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` |

## 3. Starting the Backend & Frontend
### Backend (`services/api-core`):
1. Navigate to `services/api-core`.
2. Run database migrations and start server:
   ```bash
   cargo run --bin api-core
   ```

### Frontend (`apps/admin-web`):
1. Navigate to `apps/admin-web`.
2. Install dependencies and start dev server:
   ```bash
   pnpm install
   pnpm dev
   ```

## 4. Seeding Admin & Demo Data
- **Seed an Admin User**:
  ```bash
  cargo run --bin api-core -- admin-seed --email admin@40labs.io --role admin
  ```
  *(Outputs generated password and TOTP secret).*

- **Seed Demo Analytics Data** (Dev only):
  ```bash
  cargo run --bin api-core -- admin-demo-seed
  ```
  *(Populates ~15 businesses across regions/tiers, 90 days of sales summaries, devices, and sync telemetry).*

## 5. Running Tests & Quality Checks
- **Frontend Typecheck & Lint**:
  ```bash
  pnpm --filter @40labs/admin-web run typecheck
  pnpm --filter @40labs/admin-web run lint
  ```
- **Backend Cargo Tests & Clippy**:
  ```bash
  cargo test --manifest-path services/api-core/Cargo.toml --lib
  cargo clippy --manifest-path services/api-core/Cargo.toml --lib
  ```

## 6. Reading Health & Logs Pages
- **Health Page** (`/infra` -> Health): Displays platform operational status banner (green/orange/red), check cards (DB, migrations, sync pipeline, sync failures, external URLs with latency and uptime %), 24h latency sparkline, and recent state transitions. Auto-refreshes every 15s.
- **Logs Page** (`/infra` -> Logs): Filterable platform audit and event log viewer supporting level chips (`INFO`, `WARN`, `ERROR`), source selection (`auth`, `sync`, `admin`, `system`, `probe`), business ID filter, text search, time range picker (`1h`, `24h`, `7d`), expandable JSON metadata inspector with copy button, and Live 5s poll toggle.
