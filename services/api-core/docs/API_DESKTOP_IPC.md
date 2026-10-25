# API Desktop IPC & LAN Orbit Server — 40Labs Core API

## Overview
The Tauri v2 desktop application (`apps/core-desktop`) operates offline-first with a local SQLite database (`core.db`) and embeds:
1. **Tauri IPC Invoke Commands:** Over 100 native Rust commands bridging the React frontend to local repositories.
2. **Orbit Worker LAN Server:** A background TCP/HTTP server bound to `0.0.0.0:4040` (`apps/core-desktop/src-tauri/src/services/lan_server.rs`) enabling local device pairing, discovery, and synchronization across the local network.

---

## Orbit Worker LAN Server (Port 4040)
- **Base URL:** `https://192.168.1.100:4040` (or `http://localhost:4040`)
- **Endpoints:**
  - `GET /api/pairing/health` — LAN server health check.
  - `POST /api/pairing/pair` — Initiate device pairing (exchanging session token and credentials).
  - `GET /api/v1/devices/me` — Retrieve bonded device details.
  - `POST /api/v1/devices/sync` — Local peer-to-peer sync exchange.

---

## Core Tauri Invoke Commands
Selected Tauri commands mapped to backend / local SQLite operations:

| Command Name | Module / File | Purpose |
| :--- | :--- | :--- |
| `auth_status` | `commands/auth_cmd.rs` | Check local device auth and registration status. |
| `login_with_pin` | `commands/auth_cmd.rs` | Authenticate staff/owner using local PIN hash. |
| `get_inventory` | `commands/inventory_cmd.rs` | Fetch local inventory items from SQLite. |
| `adjust_stock` | `commands/inventory_cmd.rs` | Perform inventory stock adjustment with PIN step-up verification. |
| `get_sales` | `commands/sales_cmd.rs` | Retrieve sales transactions and daily summaries. |
| `initiate_pairing` | `commands/devices_cmd.rs` | Start Orbit Worker LAN pairing session (generates QR code payload). |
| `audit_log_write` | `commands/audit_cmd.rs` | Write immutable audit log entry prior to mutation. |
