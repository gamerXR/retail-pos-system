ALTER TABLE clients RENAME COLUMN client_id TO phone_number;

DROP INDEX IF EXISTS idx_clients_client_id;
CREATE INDEX idx_clients_phone_number ON clients(phone_number);
