-- [PHASE: marketplace-preview — Data foundation]

CREATE TABLE IF NOT EXISTS followed_suppliers (
    workspace_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    supplier_business_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (workspace_id, branch_id, supplier_business_id)
);

CREATE TABLE IF NOT EXISTS supplier_carts (
    workspace_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    id TEXT NOT NULL,
    supplier_business_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (workspace_id, branch_id, id)
);

CREATE TABLE IF NOT EXISTS supplier_cart_lines (
    workspace_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    id TEXT NOT NULL,
    cart_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    qty INTEGER NOT NULL,
    unit_price_tzs_snapshot INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (workspace_id, branch_id, id)
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    workspace_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    id TEXT NOT NULL,
    buyer_business_id TEXT NOT NULL,
    seller_business_id TEXT NOT NULL,
    status TEXT NOT NULL,
    total_tzs INTEGER NOT NULL,
    channel TEXT NOT NULL,
    created_at TEXT NOT NULL,
    sent_at TEXT,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (workspace_id, branch_id, id)
);

CREATE TABLE IF NOT EXISTS purchase_order_lines (
    workspace_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    id TEXT NOT NULL,
    purchase_order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    qty INTEGER NOT NULL,
    unit_price_tzs_snapshot INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (workspace_id, branch_id, id)
);

CREATE TABLE IF NOT EXISTS outbox_orders (
    workspace_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    id TEXT NOT NULL,
    purchase_order_id TEXT NOT NULL,
    status TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (workspace_id, branch_id, id)
);

CREATE TABLE IF NOT EXISTS supplier_cache (
    workspace_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    business_id TEXT NOT NULL,
    name TEXT NOT NULL,
    logo_url TEXT,
    verified_40labs INTEGER NOT NULL,
    tmda INTEGER NOT NULL,
    tra INTEGER NOT NULL,
    phones_json TEXT NOT NULL,
    email TEXT,
    city TEXT NOT NULL,
    region TEXT NOT NULL,
    location_label TEXT NOT NULL,
    open_time TEXT NOT NULL,
    close_time TEXT NOT NULL,
    days_json TEXT NOT NULL,
    flags_json TEXT NOT NULL,
    services_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (workspace_id, branch_id, business_id)
);

CREATE TABLE IF NOT EXISTS catalog_cache (
    workspace_id TEXT NOT NULL,
    branch_id TEXT NOT NULL,
    id TEXT NOT NULL,
    supplier_business_id TEXT NOT NULL,
    name TEXT NOT NULL,
    generic_name TEXT NOT NULL,
    form TEXT NOT NULL,
    pack_size TEXT NOT NULL,
    unit_price_tzs INTEGER NOT NULL,
    old_unit_price_tzs INTEGER,
    stock TEXT NOT NULL,
    medicine_key TEXT NOT NULL,
    mapped_medicine_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (workspace_id, branch_id, id)
);

CREATE INDEX IF NOT EXISTS idx_followed_suppliers_biz ON followed_suppliers (workspace_id, branch_id, supplier_business_id);
CREATE INDEX IF NOT EXISTS idx_catalog_cache_supplier ON catalog_cache (workspace_id, branch_id, supplier_business_id);
CREATE INDEX IF NOT EXISTS idx_catalog_cache_medkey ON catalog_cache (workspace_id, branch_id, medicine_key);
