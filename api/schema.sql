-- CaptureAI Database Schema (License Key System)

-- Drop existing tables if they exist
DROP TABLE IF EXISTS webhook_events;
DROP TABLE IF EXISTS usage_records;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  license_key TEXT UNIQUE NOT NULL,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  prompt_type TEXT,
  model TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_cost REAL DEFAULT 0.0,
  cached TEXT DEFAULT 'no' CHECK (cached IN ('yes', 'no')),
  response_time INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Webhook events table (replay attack prevention)
CREATE TABLE IF NOT EXISTS webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT UNIQUE NOT NULL,
  processed_at TEXT DEFAULT (datetime('now')),
  webhook_timestamp TEXT
);

-- Indexes for users table
-- Note: license_key and stripe_customer_id have implicit indexes from UNIQUE constraints
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id);

-- Indexes for usage_records table
-- Composite index covers all usage queries (by email, by date, by email+date)
CREATE INDEX IF NOT EXISTS idx_usage_records_email_date ON usage_records(email, created_at);

-- Total usage view: aggregates token/cost data across all users at 3 levels
--   sort_order 1: Grand total  (all prompt_types, all models)
--   sort_order 2: Per prompt_type (all models combined)
--   sort_order 3: Per model       (all prompt_types combined)
CREATE VIEW IF NOT EXISTS total_usage AS
-- Row 1: Grand total across all prompt_types and all models
SELECT
  1 AS sort_order,
  'ALL' AS prompt_type,
  'ALL' AS model,
  COUNT(*) AS requests,
  COALESCE(SUM(input_tokens), 0) AS input_tokens,
  COALESCE(SUM(output_tokens), 0) AS output_tokens,
  ROUND(COALESCE(SUM(total_cost), 0.0), 8) AS total_cost
FROM usage_records

UNION ALL

-- Rows: Each prompt_type, all models combined
SELECT
  2 AS sort_order,
  prompt_type,
  'ALL' AS model,
  COUNT(*) AS requests,
  COALESCE(SUM(input_tokens), 0) AS input_tokens,
  COALESCE(SUM(output_tokens), 0) AS output_tokens,
  ROUND(COALESCE(SUM(total_cost), 0.0), 8) AS total_cost
FROM usage_records
GROUP BY prompt_type

UNION ALL

-- Rows: Each model, all prompt_types combined
SELECT
  3 AS sort_order,
  'ALL' AS prompt_type,
  model,
  COUNT(*) AS requests,
  COALESCE(SUM(input_tokens), 0) AS input_tokens,
  COALESCE(SUM(output_tokens), 0) AS output_tokens,
  ROUND(COALESCE(SUM(total_cost), 0.0), 8) AS total_cost
FROM usage_records
GROUP BY model;

-- Per-user usage statistics
CREATE VIEW IF NOT EXISTS user_usage AS
SELECT
  email,
  COUNT(*) AS requests,
  COALESCE(SUM(input_tokens), 0) AS input_tokens,
  COALESCE(SUM(output_tokens), 0) AS output_tokens,
  ROUND(COALESCE(SUM(total_cost), 0.0), 8) AS total_cost
FROM usage_records
GROUP BY email;

-- For test data, use: api/seed.sql
