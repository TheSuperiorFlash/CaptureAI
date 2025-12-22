-- Migration: Add indexes and webhook tracking
-- This migration adds additional indexes and webhook event tracking
-- Run this migration on existing databases to improve performance and security

-- Create webhook_events table for replay attack prevention
CREATE TABLE IF NOT EXISTS webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT UNIQUE NOT NULL,
  processed_at TEXT DEFAULT (datetime('now')),
  webhook_timestamp TEXT,
  event_type TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Add new indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Add new indexes for usage_records table
CREATE INDEX IF NOT EXISTS idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_model ON usage_records(model);

-- Add indexes for webhook_events table
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- Optional: Clean up old webhook events (older than 7 days) to save space
-- DELETE FROM webhook_events WHERE created_at < datetime('now', '-7 days');
