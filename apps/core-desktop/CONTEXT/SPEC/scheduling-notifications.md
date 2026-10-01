# SPEC — Scheduling & Notifications

**Status:** 🟢 · **Phase:** MVP (polish layer — build after core loop works)

## Purpose
Business-level scheduling (reports, reminders, refills) and in-app
notification center (Sender.Profile / ALL filter per draft).

## Components
- SchedulingPanel (Reports/Reminders/Refill tabs, Business/Patients sections)
- NotificationCenter (ALL filter, Sender.Profile detail view)

## API deps
- IPC commands: `get_notifications`, `get_notification_messages`, `send_notification_message`, `mark_notification_read`, `archive_notification`, `save_attachment`, `export_attachment`
- GET/POST /schedules (reminders, refill schedules)

## Offline behavior
Notifications generated locally from local events (low stock, expiry,
refill due) work fully offline. Notifications requiring WhatsApp Business
API delivery queue until connectivity returns.

## PIN gates
None.

## Data model reference
Not yet in 03-DATA-MODEL.md — flag as a schema gap in PROGRESS.md when
this gets built; will need a `Notification` and `Schedule` entity added.