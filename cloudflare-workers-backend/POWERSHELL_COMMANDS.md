# PowerShell Testing Commands

All the `curl` commands in the documentation are for bash/Linux. Here are the PowerShell equivalents for Windows users.

## Setup

First, set your Worker URL as a variable for easier testing:

```powershell
$WORKER_URL = "https://your-worker-url.workers.dev"
```

---

## Test Commands

### 1. Health Check

```powershell
Invoke-RestMethod -Uri "$WORKER_URL/" -Method Get
```

Expected output:
```json
{
  "status": "CaptureAI License Key Backend is running",
  "version": "1.0.0"
}
```

---

### 2. Create Free License Key

```powershell
$body = @{
    email = "test@example.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$WORKER_URL/api/auth/create-free-key" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

Expected output:
```json
{
  "message": "Free license key created successfully",
  "licenseKey": "ABCD-EFGH-IJKL-MNOP-QRST",
  "tier": "free"
}
```

**Save the license key** for the next tests!

---

### 3. Validate License Key

```powershell
$licenseKey = "ABCD-EFGH-IJKL-MNOP-QRST"  # Replace with your actual key

$body = @{
    licenseKey = $licenseKey
} | ConvertTo-Json

Invoke-RestMethod -Uri "$WORKER_URL/api/auth/validate-key" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

Expected output:
```json
{
  "message": "License key validated successfully",
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "tier": "free",
    "subscriptionStatus": "inactive",
    "licenseKey": "ABCD-EFGH-IJKL-MNOP-QRST"
  }
}
```

---

### 4. Send AI Request

```powershell
$licenseKey = "ABCD-EFGH-IJKL-MNOP-QRST"  # Replace with your actual key

$headers = @{
    "Authorization" = "LicenseKey $licenseKey"
    "Content-Type" = "application/json"
}

$body = @{
    question = "What is 2+2?"
    promptType = "detailed"
    reasoningLevel = "medium"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$WORKER_URL/api/ai/solve" `
    -Method Post `
    -Headers $headers `
    -Body $body
```

Expected output:
```json
{
  "answer": "4",
  "usageRemaining": 9
}
```

---

### 5. Check Usage

```powershell
$licenseKey = "ABCD-EFGH-IJKL-MNOP-QRST"  # Replace with your actual key

$headers = @{
    "Authorization" = "LicenseKey $licenseKey"
}

Invoke-RestMethod -Uri "$WORKER_URL/api/auth/usage" `
    -Method Get `
    -Headers $headers
```

Expected output:
```json
{
  "tier": "free",
  "dailyLimit": 10,
  "usedToday": 1,
  "remaining": 9
}
```

---

### 6. Get Current User Info

```powershell
$licenseKey = "ABCD-EFGH-IJKL-MNOP-QRST"  # Replace with your actual key

$headers = @{
    "Authorization" = "LicenseKey $licenseKey"
}

Invoke-RestMethod -Uri "$WORKER_URL/api/auth/me" `
    -Method Get `
    -Headers $headers
```

Expected output:
```json
{
  "id": "uuid-here",
  "email": "test@example.com",
  "tier": "free",
  "licenseKey": "ABCD-EFGH-IJKL-MNOP-QRST",
  "subscriptionStatus": "inactive",
  "createdAt": "2025-01-15T12:00:00.000Z"
}
```

---

### 7. Create Stripe Checkout Session

```powershell
$body = @{
    email = "buyer@example.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$WORKER_URL/api/subscription/create-checkout" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

Expected output:
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_xxxxx",
  "sessionId": "cs_test_xxxxx"
}
```

**Open the URL** in a browser to complete test checkout.

---

### 8. Get Available Plans

```powershell
Invoke-RestMethod -Uri "$WORKER_URL/api/subscription/plans" -Method Get
```

Expected output:
```json
{
  "plans": [
    {
      "tier": "free",
      "name": "Free",
      "price": 0,
      "dailyLimit": 10,
      "features": []
    },
    {
      "tier": "pro",
      "name": "Pro",
      "price": 9.99,
      "dailyLimit": null,
      "rateLimit": "60 per minute",
      "features": ["Unlimited requests", "GPT-5 Nano", "60 requests/minute"],
      "recommended": true
    }
  ]
}
```

---

## Complete Testing Script

Save this as `test-backend.ps1`:

```powershell
# Set your Worker URL
$WORKER_URL = "https://your-worker-url.workers.dev"

Write-Host "Testing CaptureAI Backend..." -ForegroundColor Green
Write-Host ""

# 1. Health Check
Write-Host "1. Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$WORKER_URL/" -Method Get
    Write-Host "✓ Backend is running: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "✗ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. Create Free License Key
Write-Host "2. Creating free license key..." -ForegroundColor Yellow
try {
    $body = @{ email = "test@example.com" } | ConvertTo-Json
    $keyResponse = Invoke-RestMethod -Uri "$WORKER_URL/api/auth/create-free-key" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body

    $licenseKey = $keyResponse.licenseKey
    Write-Host "✓ License key created: $licenseKey" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to create key: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 3. Validate License Key
Write-Host "3. Validating license key..." -ForegroundColor Yellow
try {
    $body = @{ licenseKey = $licenseKey } | ConvertTo-Json
    $validation = Invoke-RestMethod -Uri "$WORKER_URL/api/auth/validate-key" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body

    Write-Host "✓ Key validated. Tier: $($validation.user.tier)" -ForegroundColor Green
} catch {
    Write-Host "✗ Validation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 4. Check Usage
Write-Host "4. Checking usage..." -ForegroundColor Yellow
try {
    $headers = @{ "Authorization" = "LicenseKey $licenseKey" }
    $usage = Invoke-RestMethod -Uri "$WORKER_URL/api/auth/usage" `
        -Method Get `
        -Headers $headers

    Write-Host "✓ Usage: $($usage.usedToday)/$($usage.dailyLimit) used today" -ForegroundColor Green
} catch {
    Write-Host "✗ Usage check failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 5. Get Plans
Write-Host "5. Getting available plans..." -ForegroundColor Yellow
try {
    $plans = Invoke-RestMethod -Uri "$WORKER_URL/api/subscription/plans" -Method Get
    Write-Host "✓ Found $($plans.plans.Count) plans" -ForegroundColor Green
    foreach ($plan in $plans.plans) {
        Write-Host "  - $($plan.name): `$$($plan.price)/month" -ForegroundColor Cyan
    }
} catch {
    Write-Host "✗ Failed to get plans: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "All tests completed!" -ForegroundColor Green
Write-Host "Your license key: $licenseKey" -ForegroundColor Cyan
```

Run it with:
```powershell
.\test-backend.ps1
```

---

## Debugging: View Full Response

If you want to see more details (headers, status codes, etc.):

```powershell
$response = Invoke-WebRequest -Uri "$WORKER_URL/" -Method Get

# View status code
$response.StatusCode

# View headers
$response.Headers

# View content
$response.Content

# Parse JSON content
$response.Content | ConvertFrom-Json
```

---

## Common PowerShell vs Curl Differences

| Bash/Curl | PowerShell |
|-----------|-----------|
| `curl -X POST` | `Invoke-RestMethod -Method Post` |
| `-H "Header: value"` | `-Headers @{"Header" = "value"}` |
| `-d '{"key":"value"}'` | `-Body ($body \| ConvertTo-Json)` |
| `--header` | `-Headers` |
| `--data` | `-Body` |

---

## Tips

1. **Use backticks** (`` ` ``) to continue commands on multiple lines in PowerShell
2. **Invoke-RestMethod** automatically parses JSON responses
3. **Invoke-WebRequest** gives you more control (headers, status codes)
4. **$PSVersionTable** - Check your PowerShell version

---

## Alternative: Use Git Bash

If you have Git installed, you can use Git Bash for the standard `curl` commands:

1. Open Git Bash (not PowerShell)
2. Run the `curl` commands exactly as shown in the documentation

Git Bash is located at: `C:\Program Files\Git\git-bash.exe`
