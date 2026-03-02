-- Migration: Remove unused columns and redundant indexes
-- Removes columns that are written but never read, and indexes that are
-- either redundant with UNIQUE constraints or cover columns never used in WHERE.

-- Drop unused columns from users table
ALTER TABLE users DROP COLUMN updated_at;
ALTER TABLE users DROP COLUMN last_validated_at;

-- Drop unused columns from usage_records table
-- tokens_used is redundant (sum of granular breakdown columns)
-- cached flag is never queried in analytics
-- reasoning_tokens already included in output_tokens (billed as output)
-- cached_tokens only needed for cost calc (done in-memory, stored as total_cost)
ALTER TABLE usage_records DROP COLUMN tokens_used;
ALTER TABLE usage_records DROP COLUMN cached;
ALTER TABLE usage_records DROP COLUMN reasoning_tokens;
ALTER TABLE usage_records DROP COLUMN cached_tokens;

-- Drop unused columns from webhook_events table
-- event_type was never inserted; created_at duplicates processed_at
ALTER TABLE webhook_events DROP COLUMN event_type;
ALTER TABLE webhook_events DROP COLUMN created_at;

-- Drop redundant indexes (UNIQUE constraints already create implicit indexes)
DROP INDEX IF EXISTS idx_users_license_key;
DROP INDEX IF EXISTS idx_webhook_events_event_id;
DROP INDEX IF EXISTS idx_users_stripe_customer;

-- Drop indexes on columns never used in WHERE clauses
DROP INDEX IF EXISTS idx_users_tier;
DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_usage_records_model;
DROP INDEX IF EXISTS idx_usage_records_cost;
DROP INDEX IF EXISTS idx_usage_records_user_cost;

-- Drop indexes covered by the composite (user_id, created_at) index
DROP INDEX IF EXISTS idx_usage_records_user_id;
DROP INDEX IF EXISTS idx_usage_records_created_at;
DROP INDEX IF EXISTS idx_webhook_events_created_at;
