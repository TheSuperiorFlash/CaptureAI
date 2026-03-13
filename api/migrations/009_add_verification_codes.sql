-- Migration 009: Add verification_codes table for email OTP verification
-- Used to verify email ownership before executing tier switches via create-checkout
-- Codes are single-use with 10-minute TTL

CREATE TABLE IF NOT EXISTS verification_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'tier_switch',
  tier TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_email_code ON verification_codes (email, code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes (expires_at);

-- Rollback:
-- DROP TABLE IF EXISTS verification_codes;
