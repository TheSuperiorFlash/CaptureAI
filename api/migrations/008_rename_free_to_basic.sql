-- Migration 008: Rename 'free' tier to 'basic'
-- SQLite does not support ALTER TABLE to modify CHECK constraints,
-- so we recreate the users table with the updated tier constraint.

-- Step 1: Create new table with 'basic' instead of 'free'
CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  email TEXT,
  license_key TEXT UNIQUE NOT NULL,
  tier TEXT DEFAULT 'basic' CHECK (tier IN ('basic', 'pro')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Step 2: Copy data, migrating tier='free' rows to tier='basic'
INSERT INTO users_new (id, email, license_key, tier, subscription_status, stripe_customer_id, stripe_subscription_id, created_at)
SELECT
  id,
  email,
  license_key,
  CASE WHEN tier = 'free' THEN 'basic' ELSE tier END,
  subscription_status,
  stripe_customer_id,
  stripe_subscription_id,
  created_at
FROM users;

-- Step 3: Drop old table
DROP TABLE users;

-- Step 4: Rename new table
ALTER TABLE users_new RENAME TO users;

-- Step 5: Recreate explicit indexes (UNIQUE implicit indexes come from the table definition)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
