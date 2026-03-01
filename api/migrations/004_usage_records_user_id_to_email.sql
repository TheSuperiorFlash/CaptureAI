-- Migration: Replace user_id (UUID) with email in usage_records
-- Makes usage records directly readable without joining the users table.

-- Add email column
ALTER TABLE usage_records ADD COLUMN email TEXT;

-- Populate email from users table for existing records
UPDATE usage_records
SET email = (SELECT email FROM users WHERE users.id = usage_records.user_id);

-- Drop old user_id column (also removes the FOREIGN KEY)
ALTER TABLE usage_records DROP COLUMN user_id;

-- Drop old composite index (references user_id)
DROP INDEX IF EXISTS idx_usage_records_user_date;

-- Create new composite index on email + created_at
CREATE INDEX IF NOT EXISTS idx_usage_records_email_date ON usage_records(email, created_at);
