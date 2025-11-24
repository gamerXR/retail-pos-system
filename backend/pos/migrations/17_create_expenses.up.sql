CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100),
  employee_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT expenses_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_expenses_created_at ON expenses(created_at);
CREATE INDEX idx_expenses_employee_id ON expenses(employee_id);
