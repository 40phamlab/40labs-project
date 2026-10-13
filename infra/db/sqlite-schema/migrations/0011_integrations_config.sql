-- Migration 0011: Integrations Config
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS integrations_config (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  email_connected INTEGER NOT NULL DEFAULT 0,
  email_address TEXT,
  whatsapp_connected INTEGER NOT NULL DEFAULT 0,
  whatsapp_number TEXT,
  web_apps_connected TEXT NOT NULL DEFAULT '[]',
  mobile_phone TEXT,
  collaborators TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX idx_integrations_config_workspace ON integrations_config(workspace_id);
