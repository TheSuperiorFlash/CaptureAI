-- CaptureAI Database Schema (License Key System)
-- Drop existing tables if they exist
DROP TABLE IF EXISTS usage_records;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS users;

-- Users table (simplified for license key system)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  license_key TEXT UNIQUE NOT NULL,
  email TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  last_validated_at TEXT DEFAULT (datetime('now'))
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_license_key ON users(license_key);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_user_date ON usage_records(user_id, created_at);

-- Create a default free user (for testing)
INSERT INTO users (id, license_key, email, tier)
VALUES ('test-user-id', 'TEST-FREE-KEY-12345', 'test@example.com', 'free');
