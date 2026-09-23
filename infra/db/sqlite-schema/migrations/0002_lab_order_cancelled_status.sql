PRAGMA foreign_keys=OFF;
CREATE TABLE lab_order_new (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customer(id),
  sale_id TEXT REFERENCES sale(id),
  ordered_by_user_id TEXT NOT NULL REFERENCES app_user(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sample_collected','result_entered','report_ready','unsolved','cancelled')),
  test_catalog_id TEXT NOT NULL REFERENCES test_catalog_entry(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
INSERT INTO lab_order_new SELECT * FROM lab_order;
DROP TABLE lab_order;
ALTER TABLE lab_order_new RENAME TO lab_order;
CREATE INDEX idx_lab_order_customer ON lab_order(customer_id);
CREATE INDEX idx_lab_order_status ON lab_order(status);
PRAGMA foreign_keys=ON;
