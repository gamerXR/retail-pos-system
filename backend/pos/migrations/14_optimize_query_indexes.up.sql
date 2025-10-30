CREATE INDEX IF NOT EXISTS idx_products_client_category ON products(client_id, category_id);
CREATE INDEX IF NOT EXISTS idx_categories_client_name ON categories(client_id, name);
CREATE INDEX IF NOT EXISTS idx_products_client_sort ON products(client_id, sort_order DESC, name);
