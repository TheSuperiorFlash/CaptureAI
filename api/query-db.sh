#!/bin/bash
# Database Query Helper Script
# Usage: ./query-db.sh [query-type]

DB_NAME="captureai-db"

case "$1" in
  "users")
    echo "📊 Fetching all users..."
    wrangler d1 execute $DB_NAME --command "SELECT id, email, tier, subscription_status, created_at FROM users ORDER BY created_at DESC;"
    ;;

  "usage")
    echo "📈 Fetching recent usage records..."
    wrangler d1 execute $DB_NAME --command "SELECT user_id, prompt_type, model, tokens_used, input_tokens, output_tokens, total_cost, created_at FROM usage_records ORDER BY created_at DESC LIMIT 20;"
    ;;

  "stats")
    echo "📊 Database Statistics..."
    echo ""
    echo "User Statistics:"
    wrangler d1 execute $DB_NAME --command "SELECT tier, subscription_status, COUNT(*) as count FROM users GROUP BY tier, subscription_status;"
    echo ""
    echo "Total Usage Records:"
    wrangler d1 execute $DB_NAME --command "SELECT COUNT(*) as total_requests FROM usage_records;"
    echo ""
    echo "Usage by Model:"
    wrangler d1 execute $DB_NAME --command "SELECT model, COUNT(*) as requests, SUM(total_cost) as total_cost FROM usage_records GROUP BY model;"
    ;;

  "webhooks")
    echo "🔔 Recent webhook events..."
    wrangler d1 execute $DB_NAME --command "SELECT event_id, event_type, webhook_timestamp, processed_at FROM webhook_events ORDER BY created_at DESC LIMIT 10;"
    ;;

  "tables")
    echo "📋 Database Tables..."
    wrangler d1 execute $DB_NAME --command "SELECT name, type FROM sqlite_master WHERE type='table' OR type='index' ORDER BY type, name;"
    ;;

  "schema")
    echo "🏗️  Database Schema..."
    wrangler d1 execute $DB_NAME --command "SELECT sql FROM sqlite_master WHERE type='table' ORDER BY name;"
    ;;

  "costs")
    echo "💰 Cost Analysis..."
    wrangler d1 execute $DB_NAME --command "
      SELECT
        DATE(created_at) as date,
        COUNT(*) as requests,
        SUM(input_tokens) as input_tokens,
        SUM(output_tokens) as output_tokens,
        SUM(total_cost) as total_cost
      FROM usage_records
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 7;
    "
    ;;

  "export")
    echo "💾 Exporting database..."
    wrangler d1 export $DB_NAME --output=./db-backup-$(date +%Y%m%d-%H%M%S).sql
    echo "✅ Export complete!"
    ;;

  *)
    echo "CaptureAI Database Query Helper"
    echo ""
    echo "Usage: ./query-db.sh [command]"
    echo ""
    echo "Available commands:"
    echo "  users      - List all users"
    echo "  usage      - Show recent API usage"
    echo "  stats      - Display database statistics"
    echo "  webhooks   - Show recent webhook events"
    echo "  tables     - List all tables and indexes"
    echo "  schema     - Show database schema"
    echo "  costs      - Show cost analysis by date"
    echo "  export     - Export database to SQL file"
    echo ""
    echo "Examples:"
    echo "  ./query-db.sh users"
    echo "  ./query-db.sh stats"
    echo "  ./query-db.sh export"
    ;;
esac
