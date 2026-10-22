-- 0022_lab_reports.sql
DROP TABLE IF EXISTS lab_report_forward;
DROP TABLE IF EXISTS lab_report_item;
DROP TABLE IF EXISTS lab_report;

CREATE TABLE lab_report (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    supersedes_report_id TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    summary_note TEXT,
    prepared_by TEXT NOT NULL,
    finalized_by TEXT,
    finalized_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (supersedes_report_id) REFERENCES lab_report(id) ON DELETE SET NULL
);

CREATE TABLE lab_report_item (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    report_id TEXT NOT NULL,
    result_id TEXT NOT NULL,
    snapshot_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (report_id) REFERENCES lab_report(id) ON DELETE CASCADE
);

CREATE TABLE lab_report_forward (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    report_id TEXT NOT NULL,
    from_user_id TEXT NOT NULL,
    to_user_id TEXT NOT NULL,
    note TEXT,
    forwarded_at TEXT NOT NULL,
    read_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (report_id) REFERENCES lab_report(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lab_report_workspace_branch ON lab_report(workspace_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_lab_report_patient ON lab_report(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_report_order ON lab_report(order_id);
CREATE INDEX IF NOT EXISTS idx_lab_report_item_report ON lab_report_item(report_id);
CREATE INDEX IF NOT EXISTS idx_lab_report_forward_report ON lab_report_forward(report_id);
CREATE INDEX IF NOT EXISTS idx_lab_report_forward_to ON lab_report_forward(to_user_id);
