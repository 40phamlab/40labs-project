-- Migration 0028: Add district column and unique index on branch(business_id, branch_code)
ALTER TABLE branch ADD COLUMN district TEXT;

CREATE UNIQUE INDEX idx_branch_code_unique ON branch(business_id, branch_code);
