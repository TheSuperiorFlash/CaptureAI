-- Migration: Add usage_daily aggregate table for efficient per-day usage tracking
-- Replaces per-request COUNT(*) scans on usage_records with O(1) primary-key lookups

CREATE TABLE IF NOT EXISTS usage_daily (
  email TEXT NOT NULL,
  date TEXT NOT NULL,                   -- 'YYYY-MM-DD'
  request_count INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_cost REAL DEFAULT 0.0,
  PRIMARY KEY (email, date)
);

CREATE INDEX IF NOT EXISTS idx_usage_daily_email_date ON usage_daily(email, date);
