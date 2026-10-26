# Infra Monitoring: health, heartbeats, logs

Goal: the team opens Infra and knows in 5 seconds whether the platform is healthy, and what broke if not.

## A. Server-side health prober (runs inside api-core)
- tokio interval task, every **60s** (env `HEALTH_PROBE_INTERVAL_SECS`).
- Checks, each produces `{ check, status: ok|degraded|down, latency_ms, detail, checked_at }`:
  | check | ok | degraded | down |
  |---|---|---|---|
  | `db` | SELECT 1 < 200ms | 200-1000ms | fails/timeout |
  | `migrations` | version == expected | n/a | mismatch |
  | `sync_pipeline` | newest `sync_changes` < 24h or no devices yet | 24-72h | >72h with active devices |
  | `sync_failures` | <5 failures last hour | 5-50 | >50 |
  | `external:<name>` | HTTP 2xx under 2s | slow | fails (URLs from env `HEALTH_EXTERNAL_URLS`, comma-separated) |
- Store in `infra_health_checks(id, check, status, latency_ms, detail, checked_at)`. Retention 7 days (daily cleanup task).
- Overall status = worst of all checks.
- Probe task must never panic the server: catch errors, record as `down`.

## B. Device activity (derived, zero desktop changes)
- Do NOT add a heartbeat sender to core-desktop. Desktop code is untouched.
- Instead, api-core sync middleware updates `sync_devices.last_seen_at` on every authenticated sync request (push or pull). Also capture `app_version` and `outbox_pending` only if the existing sync payload/headers already carry them; otherwise leave null and show "unknown".
- Status derived on read: healthy <1h, stale <48h, offline >48h.
- Limit: a desktop with nothing to sync can look stale. The UI shows "last sync activity", not "last online". TODO: [true heartbeat needs a desktop edit, decide after Admin-D] [post-MVP].
- Heartbeats tab is renamed **Devices activity**: per-device last-seen timeline, status chips, app version distribution (if available).

## C. Important logs
Not a full log stream. Only events worth a human's eyes.
- tracing layer writes to `ops_events(id, ts, level, source, message, business_id nullable, device_id nullable, meta jsonb)`.
- Captured: all WARN/ERROR, plus INFO for: admin login/logout, verification decisions, sync push rejected, device first pairing, tier change, migration run, prober status transitions (ok→down etc.).
- `source` enum: `auth | sync | admin | system | probe`.
- Writes go through a **bounded channel** (cap 1000). If full, drop and increment a counter. Never block a request for logging.
- **Redaction:** never log passwords, TOTP secrets, tokens, PINs, patient fields, or full request bodies. `meta` allows ids, counts, error codes only.
- Retention: 14 days, daily cleanup.
- Endpoint: `GET /admin/v1/infra/logs?level=&source=&business_id=&since=&q=&cursor=&limit=50` (cursor pagination by `ts,id`, newest first).
- Optional after the basics work: `GET /infra/logs/stream` (SSE) for live tail. Not needed in the first pass.

## D. UI
**Health tab**
- Big overall status banner (green / orange / red) + last checked time (relative).
- Grid of check cards: name, status chip, latency, detail, 24h sparkline of latency, 24h uptime %.
- "State changes" list below: last 20 transitions with time.
- Auto-refresh 15s. Show "Last updated Xs ago" and a manual Refresh button.

**Heartbeats tab** as described in B.

**Logs tab**
- Filters: level multi-chip, source select, business id, text search, time range (1h / 24h / 7d).
- Table: time, level chip, source, message, business. Row expands to show `meta` JSON (JetBrains Mono, copy button).
- "Live" toggle that polls every 5s and prepends new rows. Pause on scroll.
- Click a business id to jump to its detail page.

## E. Alerts (keep minimal for now)
- Overview "Open infra alerts" = count of checks not `ok`.
- No email/WhatsApp alerts in this phase. TODO: [needs delivery channel decision] [Admin-C].

## F. Tests
- Prober marks `down` when DB is unreachable (use a bad pool)
- Log channel drops under pressure without blocking
- Redaction test: log a line containing `pin=1234` / `password=` / a bearer token → stored text has none of them
- /readyz returns 503 when migrations mismatch
