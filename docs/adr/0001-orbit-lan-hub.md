# ADR 0001 — Orbit Worker talks to an embedded LAN hub in 40LabsCore

Status: **Proposed** — needs Sairiamu's sign-off (also closes PRD §7.2). Date: 2026-10-02.

## Context
Orbit Worker (RN) must work only on the pharmacy LAN, offline from the internet. Today the desktop UI reaches SQLite through Tauri `invoke`; `services/api-core` is empty, so no network API exists. A LAN pairing server exists (commit 97306f9) but is a raw TCP loop with the defects listed in `CONTEXT/05-LAN-ORBIT.md`.

## Decision
1. Orbit's API is an **Axum server embedded in the Tauri process**, bound to the LAN, calling the same `services/` and SQLite pool as the Tauri commands. Business and PIN rules live only in services, so every surface hits one implementation.
2. The desktop UI keeps `invoke`. No desktop → HTTP detour.
3. Pairing issues a **per-device credential** (32 random bytes, returned once, stored as SHA-256 hash). One middleware authenticates, checks `status = active`, reloads permissions from SQLite on every request, and guards routes by permission.
4. Transport is **TLS with a persisted self-signed certificate**; its SHA-256 fingerprint is carried in the pairing QR for pinning by the RN client.
5. **Device trust never substitutes for PIN checks.** Gated actions require both the permission and a valid PIN for the device's bound user, verified in services.

## Alternatives considered
- Cloud relay: breaks LAN-only and offline-first.
- Separate local api-core service: extra process for pharmacies to run; deferrable since services are shared.
- Device keypair + signed requests: stronger replay story, but RN lacks an easy native Ed25519 path and TLS pinning already covers the LAN threat; revisit later.
- Plain HTTP on LAN: Android/iOS resist cleartext, and health data on shared Wi-Fi warrants encryption.

## Consequences
- Orbit needs an Expo dev client (not Expo Go) for certificate pinning, mDNS fallback and camera.
- `packages/api-client` must expose one interface with two transports (Tauri invoke, LAN HTTP) and stay free of `window`/Tauri imports.
- Devices paired before 0B have no credential and must re-pair.
- The LAN server's lifetime is the desktop app's lifetime; if the app is closed, Orbit is offline by design.

## Open
Sign-off on the five decisions above; mDNS discovery vs QR-only endpoint (QR-only for now).
