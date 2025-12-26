# CaptureAI Database Guide

Complete guide to viewing and managing your Cloudflare D1 database.

## Quick Start

### View Database in Browser (Easiest)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to: **Workers & Pages** → **D1**
3. Click on **captureai-db**
4. Go to **Console** tab
5. Run SQL queries directly in the web interface

---

## Using the Query Helper Scripts

I've created helper scripts to make database queries easier.

### Windows (PowerShell/CMD)

```cmd
# View all users
query-db.bat users

# View usage statistics
query-db.bat stats

# View recent API usage
query-db.bat usage

# Export database
query-db.bat export
```

### Linux/Mac

```bash
# Make script executable
chmod +x query-db.sh

# View all users
./query-db.sh users

# View usage statistics
./query-db.sh stats

# View recent API usage
./query-db.sh usage

# Export database
./query-db.sh export
```

### Available Commands

| Command | Description |
|---------|-------------|
| `users` | List all users with their tier and subscription status |
| `usage` | Show recent API usage records (last 20) |
| `stats` | Display database statistics and summaries |
| `webhooks` | Show recent Stripe webhook events |
| `tables` | List all tables and indexes |
| `schema` | Display full database schema |
| `costs` | Show cost analysis by date (last 7 days) |
| `export` | Export database to SQL backup file |

---

## Manual Queries with Wrangler

### Basic Queries

```bash
# View all users
wrangler d1 execute captureai-db --command "SELECT * FROM users;"

# View specific user by email
wrangler d1 execute captureai-db --command "SELECT * FROM users WHERE email = 'user@example.com';"

# View user by license key
wrangler d1 execute captureai-db --command "SELECT * FROM users WHERE license_key = 'YOUR-LICENSE-KEY';"

# Count total users
wrangler d1 execute captureai-db --command "SELECT COUNT(*) as total_users FROM users;"
```

### Usage Analytics

```bash
# Recent API usage
wrangler d1 execute captureai-db --command "
  SELECT user_id, prompt_type, model, tokens_used, total_cost, created_at
  FROM usage_records
  ORDER BY created_at DESC
  LIMIT 20;
"

# Usage by user
wrangler d1 execute captureai-db --command "
  SELECT user_id, COUNT(*) as total_requests, SUM(total_cost) as total_cost
  FROM usage_records
  GROUP BY user_id
  ORDER BY total_requests DESC;
"

# Daily usage statistics
wrangler d1 execute captureai-db --command "
  SELECT
    DATE(created_at) as date,
    COUNT(*) as requests,
    SUM(input_tokens) as input_tokens,
    SUM(output_tokens) as output_tokens,
    SUM(total_cost) as total_cost
  FROM usage_records
  GROUP BY DATE(created_at)
  ORDER BY date DESC;
"
```

### Cost Analysis

```bash
# Total costs by model
wrangler d1 execute captureai-db --command "
  SELECT
    model,
    COUNT(*) as requests,
    SUM(input_tokens) as total_input_tokens,
    SUM(output_tokens) as total_output_tokens,
    SUM(reasoning_tokens) as total_reasoning_tokens,
    SUM(total_cost) as total_cost,
    AVG(total_cost) as avg_cost_per_request
  FROM usage_records
  GROUP BY model;
"

# Top users by cost
wrangler d1 execute captureai-db --command "
  SELECT
    u.email,
    u.tier,
    COUNT(ur.id) as total_requests,
    SUM(ur.total_cost) as total_cost
  FROM users u
  LEFT JOIN usage_records ur ON u.id = ur.user_id
  GROUP BY u.id
  ORDER BY total_cost DESC
  LIMIT 10;
"
```

### Subscription Management

```bash
# Active Pro subscriptions
wrangler d1 execute captureai-db --command "
  SELECT email, tier, subscription_status, stripe_customer_id, created_at
  FROM users
  WHERE tier = 'pro' AND subscription_status = 'active';
"

# Cancelled subscriptions
wrangler d1 execute captureai-db --command "
  SELECT email, tier, subscription_status, updated_at
  FROM users
  WHERE subscription_status = 'cancelled';
"

# Users with payment issues
wrangler d1 execute captureai-db --command "
  SELECT email, subscription_status, updated_at
  FROM users
  WHERE subscription_status = 'past_due';
"
```

### Webhook Events

```bash
# Recent webhook events
wrangler d1 execute captureai-db --command "
  SELECT event_id, event_type, webhook_timestamp, processed_at
  FROM webhook_events
  ORDER BY created_at DESC
  LIMIT 20;
"

# Webhook events by type
wrangler d1 execute captureai-db --command "
  SELECT event_type, COUNT(*) as count
  FROM webhook_events
  GROUP BY event_type;
"
```

---

## Database Schema Reference

### Users Table

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  license_key TEXT UNIQUE NOT NULL,
  email TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  last_validated_at TEXT DEFAULT (datetime('now'))
);
```

**Fields:**
- `id` - Unique user ID (UUID)
- `license_key` - Format: XXXX-XXXX-XXXX-XXXX-XXXX
- `email` - User email address
- `tier` - 'free' or 'pro'
- `stripe_customer_id` - Stripe customer ID
- `stripe_subscription_id` - Stripe subscription ID
- `subscription_status` - 'active', 'inactive', 'cancelled', 'past_due'

### Usage Records Table

```sql
CREATE TABLE usage_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  prompt_type TEXT,
  model TEXT,
  tokens_used INTEGER DEFAULT 0,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  reasoning_tokens INTEGER DEFAULT 0,
  cached_tokens INTEGER DEFAULT 0,
  total_cost REAL DEFAULT 0.0,
  response_time INTEGER DEFAULT 0,
  cached INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Fields:**
- `user_id` - Reference to users table
- `prompt_type` - Type of prompt ('ask', 'auto_solve', etc.)
- `model` - AI model used ('none', 'low', 'medium')
- `tokens_used` - Total tokens consumed
- `input_tokens` - Input tokens
- `output_tokens` - Output tokens
- `reasoning_tokens` - Reasoning tokens
- `cached_tokens` - Cached tokens
- `total_cost` - Cost in USD
- `response_time` - Response time in ms

### Webhook Events Table

```sql
CREATE TABLE webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT UNIQUE NOT NULL,
  processed_at TEXT DEFAULT (datetime('now')),
  webhook_timestamp TEXT,
  event_type TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

---

## Database Maintenance

### Backup Database

```bash
# Export to SQL file
wrangler d1 export captureai-db --output=./backup-$(date +%Y%m%d).sql

# Or use the helper script
query-db.bat export  # Windows
./query-db.sh export  # Linux/Mac
```

### Restore Database

```bash
# Import from SQL file
wrangler d1 execute captureai-db --file=./backup.sql
```

### Run Migrations

```bash
# Apply migration
wrangler d1 execute captureai-db --file=./migrations/002_add_token_breakdown.sql

# Or reset entire schema
wrangler d1 execute captureai-db --file=./schema.sql
```

### Clean Up Old Data

```bash
# Delete old usage records (older than 90 days)
wrangler d1 execute captureai-db --command "
  DELETE FROM usage_records
  WHERE created_at < datetime('now', '-90 days');
"

# Delete old webhook events (older than 30 days)
wrangler d1 execute captureai-db --command "
  DELETE FROM webhook_events
  WHERE created_at < datetime('now', '-30 days');
"
```

---

## Useful Queries for Monitoring

### Check System Health

```bash
# Count records in each table
wrangler d1 execute captureai-db --command "
  SELECT
    'users' as table_name, COUNT(*) as count FROM users
  UNION ALL
  SELECT 'usage_records', COUNT(*) FROM usage_records
  UNION ALL
  SELECT 'webhook_events', COUNT(*) FROM webhook_events;
"
```

### Find Inactive Users

```bash
# Users who haven't used the service in 30 days
wrangler d1 execute captureai-db --command "
  SELECT u.email, u.tier, u.last_validated_at
  FROM users u
  WHERE u.last_validated_at < datetime('now', '-30 days')
  ORDER BY u.last_validated_at DESC;
"
```

### Check Rate Limit Usage

```bash
# Count requests per user in last hour
wrangler d1 execute captureai-db --command "
  SELECT
    user_id,
    COUNT(*) as requests_last_hour
  FROM usage_records
  WHERE created_at > datetime('now', '-1 hour')
  GROUP BY user_id
  ORDER BY requests_last_hour DESC;
"
```

---

## Troubleshooting

### Database not found

**Error:** `No D1 databases found`

**Solution:**
```bash
# Create the database
wrangler d1 create captureai-db

# Update wrangler.toml with the database ID shown
```

### Query too large

**Error:** `Query result too large`

**Solution:** Add `LIMIT` to your query:
```bash
wrangler d1 execute captureai-db --command "SELECT * FROM usage_records LIMIT 100;"
```

### Permission denied

**Error:** `Authentication error`

**Solution:**
```bash
# Re-authenticate
wrangler login
```

---

## Best Practices

1. **Regular Backups:** Export database weekly
   ```bash
   query-db.bat export  # Creates timestamped backup
   ```

2. **Monitor Costs:** Check daily usage and costs
   ```bash
   query-db.bat costs
   ```

3. **Clean Up:** Delete old data periodically (keep last 90 days)

4. **Use Indexes:** Queries are optimized with indexes on:
   - `users.license_key`
   - `users.email`
   - `usage_records.user_id`
   - `usage_records.created_at`
   - `webhook_events.event_id`

5. **Audit Regularly:** Review user activity and subscription status
   ```bash
   query-db.bat stats
   ```

---

## Advanced: SQL Tips

### Joins
```sql
-- Get user info with their usage
SELECT
  u.email,
  u.tier,
  COUNT(ur.id) as total_requests,
  SUM(ur.total_cost) as total_cost
FROM users u
LEFT JOIN usage_records ur ON u.id = ur.user_id
GROUP BY u.id;
```

### Date Functions
```sql
-- Today's usage
SELECT * FROM usage_records
WHERE DATE(created_at) = DATE('now');

-- Last 7 days
SELECT * FROM usage_records
WHERE created_at > datetime('now', '-7 days');
```

### Aggregations
```sql
-- Average cost per request by model
SELECT
  model,
  AVG(total_cost) as avg_cost,
  MIN(total_cost) as min_cost,
  MAX(total_cost) as max_cost
FROM usage_records
GROUP BY model;
```

---

## Quick Reference Commands

| Task | Command |
|------|---------|
| View users | `query-db.bat users` |
| View usage | `query-db.bat usage` |
| View stats | `query-db.bat stats` |
| Export DB | `query-db.bat export` |
| Check costs | `query-db.bat costs` |
| View tables | `query-db.bat tables` |
| View schema | `query-db.bat schema` |

---

For more information, see the [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/).
