-- Add additional fields to products table
ALTER TABLE products ADD COLUMN barcode TEXT;
ALTER TABLE products ADD COLUMN second_name TEXT;
ALTER TABLE products ADD COLUMN wholesale_price DOUBLE PRECISION;
ALTER TABLE products ADD COLUMN start_qty INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN stock_price DOUBLE PRECISION;
ALTER TABLE products ADD COLUMN total_amount DOUBLE PRECISION;
ALTER TABLE products ADD COLUMN shelf_life INTEGER; -- in days
ALTER TABLE products ADD COLUMN origin TEXT;
ALTER TABLE products ADD COLUMN ingredients TEXT;
ALTER TABLE products ADD COLUMN remarks TEXT;
ALTER TABLE products ADD COLUMN weighing BOOLEAN DEFAULT FALSE;
