-- Test seed data (DO NOT run in production)
-- Usage: wrangler d1 execute captureai-db --local --file=api/seed.sql

INSERT OR IGNORE INTO users (id, license_key, email, tier)
VALUES ('test-user-id', 'TEST-BASIC-KEY-12345', 'test@example.com', 'basic');
