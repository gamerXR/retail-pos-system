CREATE TABLE licenses (
  id BIGSERIAL PRIMARY KEY,
  license_key TEXT NOT NULL UNIQUE,
  phone_id TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  company_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE trial_sessions (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 minutes',
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE admin_users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_super_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin user (password: admin123)
INSERT INTO admin_users (username, password_hash, is_super_admin) 
VALUES ('admin', '$2b$10$rQZ8kqH5jEKvQxvQxvQxvOzKzKzKzKzKzKzKzKzKzKzKzKzKzKzKz', TRUE);

CREATE INDEX idx_licenses_phone_id ON licenses(phone_id);
CREATE INDEX idx_licenses_license_key ON licenses(license_key);
CREATE INDEX idx_trial_sessions_device_id ON trial_sessions(device_id);
CREATE INDEX idx_trial_sessions_expires_at ON trial_sessions(expires_at);
