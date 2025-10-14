ALTER TABLE products ADD COLUMN client_id BIGINT;
ALTER TABLE categories ADD COLUMN client_id BIGINT;
ALTER TABLE sales ADD COLUMN client_id BIGINT;
ALTER TABLE opening_balances ADD COLUMN client_id BIGINT;

CREATE INDEX idx_products_client_id ON products(client_id);
CREATE INDEX idx_categories_client_id ON categories(client_id);
CREATE INDEX idx_sales_client_id ON sales(client_id);
CREATE INDEX idx_opening_balances_client_id ON opening_balances(client_id);
