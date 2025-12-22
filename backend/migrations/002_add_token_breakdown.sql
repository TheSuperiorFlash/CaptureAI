-- Migration: Add detailed token tracking and cost calculation
-- Date: 2025-12-21

-- Add new columns to usage_records for detailed token tracking
ALTER TABLE usage_records ADD COLUMN input_tokens INTEGER DEFAULT 0;
ALTER TABLE usage_records ADD COLUMN output_tokens INTEGER DEFAULT 0;
ALTER TABLE usage_records ADD COLUMN reasoning_tokens INTEGER DEFAULT 0;
ALTER TABLE usage_records ADD COLUMN cached_tokens INTEGER DEFAULT 0;
ALTER TABLE usage_records ADD COLUMN total_cost REAL DEFAULT 0.0;

-- Create indexes for cost analytics
CREATE INDEX IF NOT EXISTS idx_usage_records_cost ON usage_records(total_cost);
CREATE INDEX IF NOT EXISTS idx_usage_records_user_cost ON usage_records(user_id, total_cost);
