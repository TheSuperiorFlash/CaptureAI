-- Migration 0001: Initial schema
-- Replaces 9 historical migrations (001–009) that were collapsed before
-- any production data existed.
--
-- To apply: cd api && npm run db:migrate

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  license_key TEXT UNIQUE NOT NULL,
  tier TEXT DEFAULT 'basic' CHECK (tier IN ('basic', 'pro')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

CREATE TABLE IF NOT EXISTS usage_daily (
  email TEXT NOT NULL,
  date TEXT NOT NULL,
  request_count INTEGER DEFAULT 0,
  cached_request_count INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_cost REAL DEFAULT 0.0,
  PRIMARY KEY (email, date)
);

CREATE TABLE IF NOT EXISTS usage_breakdown (
  email TEXT NOT NULL,
  date TEXT NOT NULL,
  prompt_type TEXT NOT NULL,
  model TEXT NOT NULL,
  request_count INTEGER DEFAULT 0,
  cached_count INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_cost REAL DEFAULT 0.0,
  total_response_time INTEGER DEFAULT 0,
  PRIMARY KEY (email, date, prompt_type, model)
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TEXT NOT NULL DEFAULT (datetime('now')),
  webhook_timestamp TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  action TEXT NOT NULL,
  tier TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0 CHECK (used IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_lookup ON verification_codes(email, action, code, used, expires_at);

CREATE TABLE IF NOT EXISTS subscription_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  from_tier TEXT,
  to_tier TEXT,
  from_status TEXT,
  to_status TEXT,
  stripe_event_id TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_email ON subscription_events(email, created_at);

CREATE VIEW IF NOT EXISTS total_usage AS
SELECT
  1 AS sort_order,
  'ALL' AS prompt_type,
  'ALL' AS model,
  COALESCE(SUM(request_count), 0) AS requests,
  COALESCE(SUM(input_tokens), 0) AS input_tokens,
  COALESCE(SUM(output_tokens), 0) AS output_tokens,
  ROUND(COALESCE(SUM(total_cost), 0.0), 8) AS total_cost
FROM usage_breakdown

UNION ALL

SELECT
  2 AS sort_order,
  prompt_type,
  'ALL' AS model,
  COALESCE(SUM(request_count), 0) AS requests,
  COALESCE(SUM(input_tokens), 0) AS input_tokens,
  COALESCE(SUM(output_tokens), 0) AS output_tokens,
  ROUND(COALESCE(SUM(total_cost), 0.0), 8) AS total_cost
FROM usage_breakdown
GROUP BY prompt_type

UNION ALL

SELECT
  3 AS sort_order,
  'ALL' AS prompt_type,
  model,
  COALESCE(SUM(request_count), 0) AS requests,
  COALESCE(SUM(input_tokens), 0) AS input_tokens,
  COALESCE(SUM(output_tokens), 0) AS output_tokens,
  ROUND(COALESCE(SUM(total_cost), 0.0), 8) AS total_cost
FROM usage_breakdown
GROUP BY model;

CREATE VIEW IF NOT EXISTS user_usage AS
SELECT
  email,
  COALESCE(SUM(request_count), 0) AS requests,
  COALESCE(SUM(input_tokens), 0) AS input_tokens,
  COALESCE(SUM(output_tokens), 0) AS output_tokens,
  ROUND(COALESCE(SUM(total_cost), 0.0), 8) AS total_cost
FROM usage_breakdown
GROUP BY email;

CREATE VIEW IF NOT EXISTS total_usage_daily AS
SELECT
  COALESCE(SUM(request_count), 0) AS requests,
  COALESCE(SUM(cached_request_count), 0) AS cached_requests,
  COALESCE(SUM(input_tokens), 0) AS input_tokens,
  COALESCE(SUM(output_tokens), 0) AS output_tokens,
  ROUND(COALESCE(SUM(total_cost), 0.0), 8) AS total_cost
FROM usage_daily;
