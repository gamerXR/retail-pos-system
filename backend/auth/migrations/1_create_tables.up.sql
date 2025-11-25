CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO users (phone_number, password_hash) 
VALUES ('6737165617', '448613');

CREATE INDEX idx_users_phone_number ON users(phone_number);
