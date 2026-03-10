# CaptureAI Database Guide

> **Self-update rule:** When you add/change tables, columns, indexes, or views — update this file. When you add a migration, also update [api/migrations/README.md](migrations/README.md).

Cloudflare D1 (SQLite) database. Schema defined in `api/schema.sql`, 7 migrations in `api/migrations/`.

## Quick Access

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) -> **Workers & Pages** -> **D1** -> **captureai-db** -> **Console**
2. Or use CLI: `wrangler d1 execute captureai-db --command "YOUR SQL"`

## Helper Scripts

```bash
# Windows: query-db.bat <command>   |   Linux/Mac: ./query-db.sh <command>
```

| Command | Description |
|---------|-------------|
| `users` | All users with tier and subscription status |
| `usage` | Recent API usage (last 20 records) |
| `stats` | Database statistics and summaries |
| `webhooks` | Recent Stripe webhook events |
| `tables` | All tables and indexes |
| `schema` | Full database schema |
| `costs` | Cost analysis by date (last 7 days) |
| `export` | SQL backup file |

## Schema

### users

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID |
| email | TEXT | User email |
| license_key | TEXT UNIQUE | Format: XXXX-XXXX-XXXX-XXXX-XXXX |
| tier | TEXT | `free` or `pro` |
| stripe_customer_id | TEXT UNIQUE | Stripe customer reference |
| stripe_subscription_id | TEXT | Stripe subscription reference |
| subscription_status | TEXT | `active`, `inactive`, `cancelled`, `past_due` |
| created_at | TEXT | ISO timestamp |

**Indexes:** email (explicit), stripe_subscription_id (explicit), license_key (implicit, UNIQUE), stripe_customer_id (implicit, UNIQUE)

### usage_records

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| email | TEXT | User email (was user_id before migration 004) |
| prompt_type | TEXT | `answer`, `ask`, `auto_solve`, etc. |
| model | TEXT | `none`, `low`, `medium` |
| input_tokens, output_tokens | INTEGER | Token counts |
| total_cost | REAL | Cost in USD |
| cached | TEXT | `yes` or `no` |
| response_time | INTEGER | Milliseconds |
| created_at | TEXT | ISO timestamp |

**Indexes:** email_date (composite)

### usage_daily

O(1) rate limit checks — atomic upsert per (email, date).

| Column | Type | Notes |
|--------|------|-------|
| email | TEXT | Composite PK with date |
| date | TEXT | YYYY-MM-DD |
| request_count | INTEGER | Daily request count |
| input_tokens, output_tokens | INTEGER | Daily token totals |
| total_cost | REAL | Daily cost |

**Indexes:** email_date (composite)

### webhook_events

Stripe event deduplication for replay attack prevention.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| event_id | TEXT UNIQUE | Stripe event ID |
| event_type | TEXT | Stripe event type |
| webhook_timestamp, processed_at, created_at | TEXT | ISO timestamps |

### Views

- **total_usage** — Grand totals by prompt_type and model
- **user_usage** — Per-user usage statistics
- **total_usage_daily** — Daily aggregate totals

## Common Queries

```bash
# All users
wrangler d1 execute captureai-db --command "SELECT * FROM users;"

# Daily usage summary
wrangler d1 execute captureai-db --command "
  SELECT date, SUM(request_count) as requests, SUM(total_cost) as cost
  FROM usage_daily GROUP BY date ORDER BY date DESC LIMIT 7;"

# Cost by model
wrangler d1 execute captureai-db --command "
  SELECT model, COUNT(*) as requests, SUM(total_cost) as total_cost
  FROM usage_records GROUP BY model;"

# Active Pro subscriptions
wrangler d1 execute captureai-db --command "
  SELECT email, subscription_status, created_at
  FROM users WHERE tier = 'pro' AND subscription_status = 'active';"
```

## Maintenance

```bash
# Backup
wrangler d1 export captureai-db --output=./backup-$(date +%Y%m%d).sql

# Clean old usage records (>90 days)
wrangler d1 execute captureai-db --command "DELETE FROM usage_records WHERE created_at < datetime('now', '-90 days');"

# Clean old webhook events (>30 days)
wrangler d1 execute captureai-db --command "DELETE FROM webhook_events WHERE created_at < datetime('now', '-30 days');"

# Run a migration
wrangler d1 execute captureai-db --file=./migrations/007_add_usage_daily.sql
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `No D1 databases found` | `wrangler d1 create captureai-db`, update wrangler.toml |
| `Query result too large` | Add `LIMIT` clause |
| `Authentication error` | `wrangler login` |

See also: [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
