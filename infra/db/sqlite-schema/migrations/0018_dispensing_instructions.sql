CREATE TABLE IF NOT EXISTS dispensing_instruction (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  branch_id TEXT NOT NULL,
  sale_id TEXT NOT NULL,
  sale_line_id TEXT NOT NULL UNIQUE,
  customer_id TEXT,
  dose TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK(frequency IN ('once_daily','twice_daily','three_daily','four_daily','as_needed','custom')),
  timing TEXT CHECK(timing IN ('before_meal','after_meal','with_meal','morning','night','any')),
  duration_days INTEGER,
  storage TEXT NOT NULL,
  note TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (sale_id) REFERENCES sale(id) ON DELETE CASCADE
);
