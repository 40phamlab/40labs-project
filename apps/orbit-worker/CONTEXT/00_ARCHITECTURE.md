# 01 — Orbit Architecture

## Stack
Expo (current stable SDK at scaffold time; verify its pinned React / React Native versions) with a **custom dev client**, TypeScript strict, expo-router (tabs + stacks), Zustand (UI/client state), TanStack React Query (all server state), expo-secure-store (credential, pinned fingerprint), expo-sqlite (outbox + read cache), expo-camera (QR, barcode, photos), expo-device (default device label), i18n via `packages/i18n` if it is framework-agnostic (verify; otherwise propose a thin wrapper).
Not Expo Go: TLS pinning, secure storage behavior and any mDNS fallback need native code.
Pre-approved to add: the above, jest-expo, @testing-library/react-native. Everything else (NetInfo, Reanimated, fonts, pinning lib, haptics) is ask-first.

## Folder shape (apps/orbit-worker)
- `app/` expo-router routes only (thin; no logic): `(tabs)/index`, `history`, `notifications`, `settings`, `pair`.
- `src/features/{pairing,home,history,notifications,settings,stock,lab,patients,sales}/` each with `components/`, `hooks/` (`use[Entity][Action]`), `screens/`.
- `src/components/` shared RN components (Card, Tile, Chip, StatusDot, Fab, Button, ScreenHeader). Promote to `packages/ui-native` only when a second RN consumer exists. `packages/ui-components` is DOM-only; do not import it.
- `src/theme/` ThemeProvider + `useTheme`, built from `@40labs/design-tokens` TS exports (not `tokens.css`, not `tailwind.tokens.js`: those are web-only).
- `src/lib/` secure-store wrapper, outbox, connection manager, pinning transport.
- `src/stores/` slice-based Zustand: `connection`, `theme`, `session`, `ui`. No server data in stores.

## Monorepo
- Metro must resolve workspace packages; check the current Expo monorepo docs for the pnpm setup (isolated vs hoisted `node-linker`) instead of guessing.
- One React copy per app. Orbit's React/RN versions are dictated by the Expo SDK; confirm with `pnpm why react` that desktop and Orbit don't leak duplicates. Note: pnpm 11 ignores `pnpm.overrides` in the root `package.json` (it must live in `pnpm-workspace.yaml`); the existing override is currently not applied.
- `packages/api-client` must be platform-neutral: no `window`, no Tauri imports; transport injected. Orbit supplies the HTTPS+pinned transport; desktop keeps Tauri invoke.

## Hub contract (Orbit is a client of these; none beyond Step 0B exist yet)
Existing after Step 0B: `GET /api/pairing/health`, `POST /api/pairing/pair`, `GET /api/v1/devices/me`, `POST /api/v1/devices/me/heartbeat`.
Proposed, each needs a SPEC entry on the hub side BEFORE building: `GET /api/v1/me/summary` (Today card), `GET /api/v1/activity`, `GET /api/v1/stock`, `GET /api/v1/stock/:id`, `POST /api/v1/stock/receipts`, `GET|POST /api/v1/customers`, `POST /api/v1/lab/samples`, `POST /api/v1/lab/results`, `POST /api/v1/sales`, `GET|POST /api/v1/staff-notifications`, `PATCH /api/v1/staff-notifications/:id/read`, `GET /api/v1/staff/roster` (id + display name + job role only), and one realtime channel (SSE over TLS) `GET /api/v1/stream`.
All requests: `Authorization: Bearer <device credential>`; all writes: `Idempotency-Key: <client UUID>` (hub must store keys and replay the original response; this is a new hub requirement).

## Connection state machine
`unpaired -> connecting -> connected <-> unreachable`, and `connected -> revoked` on 401/403 with a revoked-device body. Detection: heartbeat every ~20s while foregrounded, plus on app resume and on network change. Never block the UI on connectivity except `revoked` (full-screen, clear message, one action: re-pair/remove server). `unreachable` shows read-cache data with a muted dot and disables actions that need the hub.

## Offline & outbox
- Outbox table in expo-sqlite: `id (UUID = Idempotency-Key)`, `kind`, `payload_json`, `created_at`, `status (pending|sending|failed)`, `last_error`. Flush on `connected`. Retries are safe because the hub dedupes by key.
- Queueable: stock receipts, lab samples, lab results, patient adds. Not queueable: sales (see Open decision 7).
- Queued items appear in History as "pending" and are never presented as completed. Never show a receipt, fiscal number, or stock level as final from the phone.
- Read cache (last lists, summary, notifications) so screens render instantly and stay readable when unreachable; always mark cached data as such.

## Notifications delivery (honest constraint)
LAN-only means no FCM/APNs push. Delivery = SSE stream while the app is foregrounded and connected, plus fetch-on-resume, plus local OS notification only while the app process is alive. Do not promise background alerts when the phone is off the pharmacy network. The unread badge refreshes on resume.

## Security
- Pairing: parse QR `orbit://pair?endpoint=...&sessionId=...&token=...&fp=...`, reject any non-https endpoint, pin before sending the token, send only `{sessionId, token, deviceLabel, deviceType}` (the hub assigns user and permissions). Store `{businessId, endpoint, credential, fp}` per server in SecureStore. Show generic errors for any pairing failure (expired, consumed, wrong token all look the same).
- Permissions: fetch via `GET /devices/me` on connect and on resume; drive tile enablement from it; the hub remains the enforcer. A 403 on an action = refetch permissions and show a clear message, never retry silently.
- PIN: when a hub route returns "PIN required", show the PIN pad (component not yet designed), send the PIN with that request only, never store it, clear on background. Hub applies lockout; surface the lockout message.
- Backgrounding: obscure sensitive screens in the app switcher where the OS allows; no screenshots of PIN pad.

## Testing
Unit: outbox, connection machine, QR parser, permission mapping (jest-expo). Component: screens render in dark and light, disabled tiles, empty/error states. Integration (manual checklist until automated): pair on a real device, block from desktop -> next request shows revoked state, edit permissions -> tile state updates on next resume.