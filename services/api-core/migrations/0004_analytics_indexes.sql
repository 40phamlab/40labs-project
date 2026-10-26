-- Migration 0004: Analytics Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_cloud_daily_summaries_date_workspace ON cloud_daily_summaries(summary_date, workspace_id);
CREATE INDEX IF NOT EXISTS idx_business_registry_workspace_region ON business_registry(workspace_id, address_region, tier);
CREATE INDEX IF NOT EXISTS idx_cloud_inventory_items_medicine ON cloud_inventory_items(medicine_id, workspace_id);
