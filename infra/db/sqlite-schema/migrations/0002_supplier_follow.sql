-- 40LabsCore — SQLite Schema, Migration 0002 (supplier_follow)
-- Persisted many-to-many relation, workspace -> supplier (follow relationship).
-- Enables stockists/pharmacies to follow suppliers for new product updates/broadcasts.

PRAGMA foreign_keys = ON;

CREATE TABLE supplier_follows (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  supplier_id TEXT NOT NULL REFERENCES supplier(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (workspace_id, supplier_id)
);

CREATE INDEX idx_supplier_follows_workspace ON supplier_follows(workspace_id);
CREATE INDEX idx_supplier_follows_supplier ON supplier_follows(supplier_id);
