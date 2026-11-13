-- Keep synchronized price history and replay identity append-only.

CREATE OR REPLACE FUNCTION block_cloud_price_history_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'cloud_price_history is immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cloud_price_history_no_update
BEFORE UPDATE ON cloud_price_history
FOR EACH ROW EXECUTE FUNCTION block_cloud_price_history_mutation();
CREATE TRIGGER trg_cloud_price_history_no_delete
BEFORE DELETE ON cloud_price_history
FOR EACH ROW EXECUTE FUNCTION block_cloud_price_history_mutation();

CREATE OR REPLACE FUNCTION prevent_sync_change_identity_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'sync_changes identity and tenant scope are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_changes_identity_immutable
BEFORE UPDATE OF workspace_id, branch_id, device_id, change_id, entity, entity_id,
                 version, payload_sha256, received_at ON sync_changes
FOR EACH ROW
WHEN (OLD.workspace_id IS DISTINCT FROM NEW.workspace_id
   OR OLD.branch_id IS DISTINCT FROM NEW.branch_id
   OR OLD.device_id IS DISTINCT FROM NEW.device_id
   OR OLD.change_id IS DISTINCT FROM NEW.change_id
   OR OLD.entity IS DISTINCT FROM NEW.entity
   OR OLD.entity_id IS DISTINCT FROM NEW.entity_id
   OR OLD.version IS DISTINCT FROM NEW.version
   OR OLD.payload_sha256 IS DISTINCT FROM NEW.payload_sha256
   OR OLD.received_at IS DISTINCT FROM NEW.received_at)
EXECUTE FUNCTION prevent_sync_change_identity_mutation();
