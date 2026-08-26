# SPEC — Settings

**Status:** 🟢 · **Phase:** MVP

## Purpose
Owner self-service configuration — Business, Users & Roles, Appearance,
Integrations, Devices, Compliance, Security, Backup.

## Components
- BusinessProfileForm (name, TIN, TMDA number, contacts, address, branches)
- UsersRolesPanel (Add User, permission sets — feeds Orbit Worker pairing)
- AppearancePanel (dark/light toggle ONLY — no custom theming beyond that,
  per locked decision; the "Custom Theme Primary/Secondary/Font" sliders
  in the draft contradict this and should be cut or scoped to Enterprise tier only)
- IntegrationsPanel (Email, WhatsApp, Web apps, Mobile/Phone, Collaborators)
- DevicesPanel (Active/Recently connected/All, Remove/Block/Permission —
  this is the owner-side control for Orbit Worker device trust)
- CompliancePanel — copy fix required: replace "TFDA" → "TMDA",
  replace "NHIF" → Pharmacy Council of Tanzania / TRA references
  (NHIF is Kenya-specific, reserve for Phase 3 regional expansion)
- SecurityPanel (PIN change, password change, paired devices, remove/block)
- BackupPanel (backup schedule, upload/download, cloud reports)

## API deps
- GET/PATCH /business
- GET/POST /users, PATCH /users/:id/permissions
- GET/POST/DELETE /devices, PATCH /devices/:id (block/remove)
- GET/PATCH /settings/appearance
- GET/PATCH /settings/integrations
- POST /backup/run, GET /backup/history

## Offline behavior
All settings read/write locally, sync silently. Device block/remove takes
effect on next Orbit Worker connection attempt (LAN-only, so propagation
is near-instant on the local network).

## PIN gates
PIN change, password change, device remove/block = PIN-gated.

## Design tokens
Standard settings panel layout. AppearancePanel is the ONLY place
`dark`/`light` toggle logic lives — don't duplicate it elsewhere.

## Data model reference
`Business`, `User`, `Workspace`/`Branch`, device pairing records