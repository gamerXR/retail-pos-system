-- Add status fields to products table
ALTER TABLE products ADD COLUMN is_off_shelf BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Create index for better performance on sorting
CREATE INDEX idx_products_category_sort ON products(category_id, sort_order DESC, id);
