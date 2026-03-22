-- Migration 0002: Add billing_period to users table
-- Supports weekly and monthly billing options for Basic and Pro tiers.
-- Existing users default to 'weekly' (matches legacy behaviour).

ALTER TABLE users ADD COLUMN billing_period TEXT DEFAULT 'weekly';
