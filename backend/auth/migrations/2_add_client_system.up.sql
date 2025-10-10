CREATE TABLE clients (
  id BIGSERIAL PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  company_name TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clients_client_id ON clients(client_id);
CREATE INDEX idx_clients_status ON clients(status);

DROP TABLE IF EXISTS users;
