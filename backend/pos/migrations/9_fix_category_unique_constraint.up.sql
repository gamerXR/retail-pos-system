ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;

CREATE UNIQUE INDEX categories_name_client_id_idx ON categories(name, client_id);
