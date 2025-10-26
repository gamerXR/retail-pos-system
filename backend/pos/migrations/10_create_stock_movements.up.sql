CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  client_id VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL,
  price DECIMAL(10, 2),
  remarks TEXT,
  employee VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_client_id ON stock_movements(client_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);
