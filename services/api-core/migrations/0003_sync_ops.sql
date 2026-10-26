-- Migration 0003: Sync Operations & Device Telemetry
ALTER TABLE sync_devices ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
ALTER TABLE sync_devices ADD COLUMN IF NOT EXISTS outbox_pending INTEGER;

UPDATE sync_devices SET last_seen_at = last_seen WHERE last_seen_at IS NULL;
UPDATE sync_devices SET outbox_pending = pending_count WHERE outbox_pending IS NULL;
