-- Add payment_method column to sales table
ALTER TABLE sales ADD COLUMN payment_method TEXT DEFAULT 'cash';

-- Create index for better performance on payment method queries
CREATE INDEX idx_sales_payment_method ON sales(payment_method);
CREATE INDEX idx_sales_created_at ON sales(created_at);
