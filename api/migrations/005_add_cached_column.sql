-- Fix cached column type from INTEGER to TEXT
-- SQLite doesn't support ALTER COLUMN, so we recreate the table
CREATE TABLE usage_records_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  prompt_type TEXT,
  model TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_cost REAL DEFAULT 0.0,
  cached TEXT DEFAULT 'no',
  response_time INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO usage_records_new (id, email, prompt_type, model, input_tokens, output_tokens, total_cost, response_time, created_at)
  SELECT id, email, prompt_type, model, input_tokens, output_tokens, total_cost, response_time, created_at
  FROM usage_records;

DROP TABLE usage_records;
ALTER TABLE usage_records_new RENAME TO usage_records;

-- Recreate index
CREATE INDEX IF NOT EXISTS idx_usage_records_email_date ON usage_records(email, created_at);
