CREATE TABLE salespersons (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  can_process_returns BOOLEAN DEFAULT FALSE,
  can_give_discounts BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(client_id, phone_number)
);

CREATE INDEX idx_salespersons_client_id ON salespersons(client_id);
CREATE INDEX idx_salespersons_phone_number ON salespersons(phone_number);
