# Orbit Worker — Gotchas & Traps

Append-only. Add an entry whenever you or the agent almost makes one of these mistakes.

1. **Device trust is not authorization.** A paired phone gets in the door only. A disabled tile is cosmetic; the hub enforces permissions and PINs on every request, including after reconnect.
2. **Not Expo Go.** TLS pinning, secure storage behavior and camera barcode work need a dev client. If a feature "works in Expo Go" but not in the dev client, trust the dev client.
3. **Pinning a self-signed hub cert is the hardest unsolved piece.** Many RN pinning libraries pin a public-key hash but still require the chain to validate. Do Spike S0 before any feature work, and report the result so the QR `fp` meaning (cert hash vs SPKI hash) is fixed on the hub side.
4. **No push off the LAN.** Notifications arrive while connected (SSE) or on resume. Never write copy or logic that implies background alerts.
5. **Connection status is a dot, never a modal.** The only exception is `revoked`, which needs a clear full-screen message.
6. **Orbit never decides outcomes.** No stock math, tax, fiscal numbers, or receipts on the phone. A queued write is "pending", never "done". Sales are not queued in MVP.
7. **Idempotency keys are mandatory on writes.** Generate the UUID when the user taps save and keep it for every retry; regenerating on retry creates duplicate stock receipts.
8. **Customer exists once.** Add Patient searches first (phone), shows matches, and only then creates. One `CustomerPicker`, shared with sale and lab flows.
9. **Do not reuse the desktop `notifications` table or its categories/channels.** Staff notifications are a separate hub entity (Open decision 3).
10. **Existing permission keys do not cover the tiles.** Four tiles need new keys; adding them is a hub change (typed struct + DevicesPanel), not an Orbit-only change.
11. **`UserRole` is only `sudo | staff`.** "Pharmacist" in the UI is a job role that does not exist in the data model yet (Open decision 1).
12. **Do not import `packages/ui-components`, `tokens.css` or `tailwind.tokens.js`.** DOM/web only. Use the TS token exports.
13. **NativeWind v4 targets Tailwind v3; desktop is on Tailwind v4.** Default is StyleSheet + typed theme. Don't introduce NativeWind without approval.
14. **One React copy.** Orbit's React is pinned by the Expo SDK. pnpm 11 ignores `pnpm.overrides` in root package.json, so the current override isn't active; check `pnpm why react` after installing.
15. **Mockup text is English.** Swahili (sw-TZ) is the default; every string goes through i18n. Mockup bottom-bar icons have no labels; add them.
16. **Mockup grays are not tokens.** Map by role (02-DESIGN-TOKENS.md). Don't copy sampled pixel colors.
17. **Clear all data can destroy unsynced work.** Block it while the outbox is non-empty unless the user explicitly discards.
18. **Never store or log a PIN, credential, or QR token.** QR token is single-use but still a secret until consumed; don't write it to logs or navigation params that persist.
19. **Light theme is provisional.** Do not treat the provisional light values as approved when reviewing contrast or screenshots.