CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category_id to products table
ALTER TABLE products ADD COLUMN category_id BIGINT REFERENCES categories(id);

-- Insert default categories
INSERT INTO categories (name, color) VALUES 
('Essential Oils', '#EF4444'),
('Detailing', '#6B7280'),
('Buku', '#6B7280'),
('Sticker', '#6B7280'),
('No Type', '#6B7280');
