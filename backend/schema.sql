-- CaptureAI Database Schema (License Key System)
-- Optimized version with comprehensive indexes and webhook tracking

-- Drop existing tables if they exist
DROP TABLE IF EXISTS webhook_events;
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
  prompt_type TEXT,
  model TEXT,
  tokens_used INTEGER DEFAULT 0,
  response_time INTEGER DEFAULT 0,
  cached INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Webhook events tracking table (for replay attack prevention)
CREATE TABLE IF NOT EXISTS webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT UNIQUE NOT NULL,
  processed_at TEXT DEFAULT (datetime('now')),
  webhook_timestamp TEXT,
  event_type TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_license_key ON users(license_key);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Indexes for usage_records table
CREATE INDEX IF NOT EXISTS idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_created_at ON usage_records(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_records_user_date ON usage_records(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_usage_records_model ON usage_records(model);

-- Indexes for webhook_events table
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- Create a default free user (for testing)
INSERT INTO users (id, license_key, email, tier)
VALUES ('test-user-id', 'TEST-FREE-KEY-12345', 'test@example.com', 'free');