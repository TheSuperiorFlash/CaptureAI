@echo off
REM Database Query Helper Script for Windows
REM Usage: query-db.bat [query-type]

set DB_NAME=captureai-db

if "%1"=="users" goto users
if "%1"=="usage" goto usage
if "%1"=="stats" goto stats
if "%1"=="webhooks" goto webhooks
if "%1"=="tables" goto tables
if "%1"=="schema" goto schema
if "%1"=="costs" goto costs
if "%1"=="export" goto export
goto help

:users
echo 📊 Fetching all users...
wrangler d1 execute %DB_NAME% --command "SELECT id, email, tier, subscription_status, created_at FROM users ORDER BY created_at DESC;"
goto end

:usage
echo 📈 Fetching recent usage records...
wrangler d1 execute %DB_NAME% --command "SELECT user_id, prompt_type, model, tokens_used, input_tokens, output_tokens, total_cost, created_at FROM usage_records ORDER BY created_at DESC LIMIT 20;"
goto end

:stats
echo 📊 Database Statistics...
echo.
echo User Statistics:
wrangler d1 execute %DB_NAME% --command "SELECT tier, subscription_status, COUNT(*) as count FROM users GROUP BY tier, subscription_status;"
echo.
echo Total Usage Records:
wrangler d1 execute %DB_NAME% --command "SELECT COUNT(*) as total_requests FROM usage_records;"
echo.
echo Usage by Model:
wrangler d1 execute %DB_NAME% --command "SELECT model, COUNT(*) as requests, SUM(total_cost) as total_cost FROM usage_records GROUP BY model;"
goto end

:webhooks
echo 🔔 Recent webhook events...
wrangler d1 execute %DB_NAME% --command "SELECT event_id, event_type, webhook_timestamp, processed_at FROM webhook_events ORDER BY created_at DESC LIMIT 10;"
goto end

:tables
echo 📋 Database Tables...
wrangler d1 execute %DB_NAME% --command "SELECT name, type FROM sqlite_master WHERE type='table' OR type='index' ORDER BY type, name;"
goto end

:schema
echo 🏗️ Database Schema...
wrangler d1 execute %DB_NAME% --command "SELECT sql FROM sqlite_master WHERE type='table' ORDER BY name;"
goto end

:costs
echo 💰 Cost Analysis...
wrangler d1 execute %DB_NAME% --command "SELECT DATE(created_at) as date, COUNT(*) as requests, SUM(input_tokens) as input_tokens, SUM(output_tokens) as output_tokens, SUM(total_cost) as total_cost FROM usage_records GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 7;"
goto end

:export
echo 💾 Exporting database...
wrangler d1 export %DB_NAME% --output=./db-backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%.sql
echo ✅ Export complete!
goto end

:help
echo CaptureAI Database Query Helper
echo.
echo Usage: query-db.bat [command]
echo.
echo Available commands:
echo   users      - List all users
echo   usage      - Show recent API usage
echo   stats      - Display database statistics
echo   webhooks   - Show recent webhook events
echo   tables     - List all tables and indexes
echo   schema     - Show database schema
echo   costs      - Show cost analysis by date
echo   export     - Export database to SQL file
echo.
echo Examples:
echo   query-db.bat users
echo   query-db.bat stats
echo   query-db.bat export
goto end

:end
