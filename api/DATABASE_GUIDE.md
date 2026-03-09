# CaptureAI Database Guide

## Quick Access

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) -> **Workers & Pages** -> **D1** -> **captureai-db** -> **Console**
2. Or use CLI: `wrangler d1 execute captureai-db --command "YOUR SQL"`

## Helper Scripts

```bash
# Windows: query-db.bat <command>
# Linux/Mac: chmod +x query-db.sh && ./query-db.sh <command>
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

## Common Queries

### Users

```bash
wrangler d1 execute captureai-db --command "SELECT * FROM users;"
wrangler d1 execute captureai-db --command "SELECT * FROM users WHERE email = 'user@example.com';"
```

### Usage Analytics

```bash
wrangler d1 execute captureai-db --command "
  SELECT DATE(created_at) as date, COUNT(*) as requests,
    SUM(input_tokens) as input_tokens, SUM(total_cost) as total_cost
  FROM usage_records GROUP BY DATE(created_at) ORDER BY date DESC;"
```

### Cost by Model

```bash
wrangler d1 execute captureai-db --command "
  SELECT model, COUNT(*) as requests, SUM(total_cost) as total_cost,
    AVG(total_cost) as avg_cost
  FROM usage_records GROUP BY model;"
```

### Active Subscriptions

```bash
wrangler d1 execute captureai-db --command "
  SELECT email, tier, subscription_status, created_at
  FROM users WHERE tier = 'pro' AND subscription_status = 'active';"
```

## Schema Reference

### users

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | UUID |
| license_key | TEXT UNIQUE | Format: XXXX-XXXX-XXXX-XXXX-XXXX |
| email | TEXT | User email |
| tier | TEXT | `free` or `pro` |
| stripe_customer_id | TEXT UNIQUE | Stripe customer reference |
| stripe_subscription_id | TEXT | Stripe subscription reference |
| subscription_status | TEXT | `active`, `inactive`, `cancelled`, `past_due` |
| created_at, updated_at, last_validated_at | TEXT | ISO timestamps |

### usage_records

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| user_id | TEXT FK | References users(id) |
| prompt_type | TEXT | `ask`, `auto_solve`, etc. |
| model | TEXT | `none`, `low`, `medium` |
| input_tokens, output_tokens, reasoning_tokens, cached_tokens | INTEGER | Token counts |
| total_cost | REAL | Cost in USD |
| response_time | INTEGER | Milliseconds |
| created_at | TEXT | ISO timestamp |

### webhook_events

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | Auto-increment |
| event_id | TEXT UNIQUE | Stripe event ID (deduplication) |
| event_type | TEXT | Stripe event type |
| webhook_timestamp, processed_at, created_at | TEXT | ISO timestamps |

## Maintenance

```bash
# Backup
wrangler d1 export captureai-db --output=./backup-$(date +%Y%m%d).sql

# Clean old usage records (>90 days)
wrangler d1 execute captureai-db --command "DELETE FROM usage_records WHERE created_at < datetime('now', '-90 days');"

# Clean old webhook events (>30 days)
wrangler d1 execute captureai-db --command "DELETE FROM webhook_events WHERE created_at < datetime('now', '-30 days');"

# Run migrations
wrangler d1 execute captureai-db --file=./migrations/002_add_token_breakdown.sql
```

## Indexed Columns

`users.license_key`, `users.email`, `usage_records.user_id`, `usage_records.created_at`, `webhook_events.event_id`

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `No D1 databases found` | `wrangler d1 create captureai-db`, update wrangler.toml |
| `Query result too large` | Add `LIMIT` clause |
| `Authentication error` | `wrangler login` |

See also: [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
