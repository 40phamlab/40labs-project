-- Branch rows belong to the business workspace, but each row intentionally has
-- its own branch_id. The original guard was too strict for multi-branch
-- businesses; replace it without changing existing ownership data.
DROP TRIGGER IF EXISTS trg_branch_business_id_scope_insert;
DROP TRIGGER IF EXISTS trg_branch_business_id_scope_update;

CREATE TRIGGER trg_branch_business_id_workspace_insert
BEFORE INSERT ON branch
WHEN NEW.business_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM business b
  WHERE b.business_id = NEW.business_id
    AND b.workspace_id = NEW.workspace_id
)
BEGIN
  SELECT RAISE(ABORT, 'branch business must belong to the same workspace');
END;

CREATE TRIGGER trg_branch_business_id_workspace_update
BEFORE UPDATE OF business_id, workspace_id ON branch
WHEN NEW.business_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM business b
  WHERE b.business_id = NEW.business_id
    AND b.workspace_id = NEW.workspace_id
)
BEGIN
  SELECT RAISE(ABORT, 'branch business must belong to the same workspace');
END;
