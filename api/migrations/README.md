# Database Migrations

This directory contains database migration scripts for the CaptureAI backend.

## Running Migrations

### For new databases
If you're setting up a fresh database, use the main `schema.sql` file which includes all optimizations:

```bash
wrangler d1 execute captureai-db --file=schema.sql
```

### For existing databases
If you have an existing database, run migrations in order:

```bash
# Run migration 001
wrangler d1 execute captureai-db --file=migrations/001_add_indexes_and_webhook_tracking.sql
```

## Migration List

- **001_add_indexes_and_webhook_tracking.sql**
  - Adds webhook_events table for replay attack prevention
  - Adds performance indexes for users, usage_records, and webhook_events tables
  - Safe to run on existing databases (uses IF NOT EXISTS)

## Maintenance

### Clean up old webhook events

To prevent the webhook_events table from growing indefinitely, periodically clean up old events:

```sql
DELETE FROM webhook_events WHERE created_at < datetime('now', '-7 days');
```

You can set this up as a scheduled task or run it manually.

### Verify indexes

To check which indexes exist on your database:

```bash
wrangler d1 execute captureai-db --command="SELECT name, tbl_name FROM sqlite_master WHERE type='index';"
```

## Performance Tips

1. **Regular cleanup**: Clean up old usage_records and webhook_events periodically
2. **Monitor query performance**: Use EXPLAIN QUERY PLAN to analyze slow queries
3. **Composite indexes**: The user_date index on usage_records speeds up time-range queries per user

## Rollback

If you need to rollback a migration, you can drop the added tables/indexes:

```sql
-- Rollback migration 001
DROP TABLE IF EXISTS webhook_events;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_stripe_subscription;
DROP INDEX IF EXISTS idx_users_tier;
DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_usage_records_user_id;
DROP INDEX IF EXISTS idx_usage_records_model;
```
