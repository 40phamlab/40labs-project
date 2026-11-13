-- Additive integrity constraints for synchronized cloud records.
-- Existing rows are retained. NOT VALID checks preserve legacy rows while
-- enforcing constraints on newly inserted or updated rows.

CREATE OR REPLACE FUNCTION prevent_tenant_scope_reassignment()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION '% workspace and branch ownership is immutable', TG_TABLE_NAME
        USING ERRCODE = 'check_violation';
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY[
        'business_registry', 'cloud_inventory_items', 'cloud_prices',
        'cloud_price_history', 'cloud_daily_summaries', 'sync_devices',
        'device_enrollments'
    ] LOOP
        EXECUTE format(
            'CREATE TRIGGER %I BEFORE UPDATE OF workspace_id, branch_id ON %I
             FOR EACH ROW WHEN (OLD.workspace_id IS DISTINCT FROM NEW.workspace_id
                                OR OLD.branch_id IS DISTINCT FROM NEW.branch_id)
             EXECUTE FUNCTION prevent_tenant_scope_reassignment()',
            'trg_' || tbl || '_tenant_scope_immutable', tbl
        );
    END LOOP;
END $$;

-- The composite reference prevents a price row from linking to an inventory
-- item owned by another workspace or branch. Legacy rows are not rewritten.
CREATE UNIQUE INDEX IF NOT EXISTS uq_cloud_inventory_tenant_identity
    ON cloud_inventory_items(id, workspace_id, branch_id);
ALTER TABLE cloud_prices
    ADD CONSTRAINT fk_cloud_prices_inventory_tenant
    FOREIGN KEY (inventory_item_id, workspace_id, branch_id)
    REFERENCES cloud_inventory_items(id, workspace_id, branch_id)
    NOT VALID;

ALTER TABLE cloud_price_history
    ADD CONSTRAINT fk_cloud_price_history_inventory_tenant
    FOREIGN KEY (inventory_item_id, workspace_id, branch_id)
    REFERENCES cloud_inventory_items(id, workspace_id, branch_id)
    NOT VALID;

ALTER TABLE cloud_inventory_items
    ADD CONSTRAINT ck_cloud_inventory_version_positive CHECK (version > 0) NOT VALID;
ALTER TABLE cloud_prices
    ADD CONSTRAINT ck_cloud_prices_version_positive CHECK (version > 0) NOT VALID;
ALTER TABLE cloud_price_history
    ADD CONSTRAINT ck_cloud_price_history_version_positive CHECK (version > 0) NOT VALID;
ALTER TABLE cloud_daily_summaries
    ADD CONSTRAINT ck_cloud_daily_summaries_version_positive CHECK (version > 0) NOT VALID;
ALTER TABLE cloud_inventory_items
    ADD CONSTRAINT ck_cloud_inventory_quantity_nonnegative CHECK (quantity >= 0) NOT VALID;
ALTER TABLE cloud_daily_summaries
    ADD CONSTRAINT ck_cloud_daily_counts_nonnegative CHECK (tx_count >= 0 AND items_sold >= 0) NOT VALID;
