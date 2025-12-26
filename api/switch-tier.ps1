# Tier Switcher Script for Testing
# Usage: .\switch-tier.ps1 pro your-email@example.com
# Usage: .\switch-tier.ps1 free your-email@example.com

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("pro", "free")]
    [string]$Tier,

    [Parameter(Mandatory=$true)]
    [string]$Email
)

$subscriptionStatus = if ($Tier -eq "pro") { "active" } else { "inactive" }

Write-Host "Switching tier to: $Tier for email: $Email" -ForegroundColor Cyan

# Update the tier
$updateCommand = "UPDATE users SET tier = '$Tier', subscription_status = '$subscriptionStatus' WHERE email = '$Email'"
wrangler d1 execute captureai-db --command $updateCommand

# Verify the change
Write-Host "`nVerifying change..." -ForegroundColor Yellow
$verifyCommand = "SELECT email, tier, subscription_status FROM users WHERE email = '$Email'"
wrangler d1 execute captureai-db --command $verifyCommand

Write-Host "`n✓ Tier switched successfully!" -ForegroundColor Green
Write-Host "Don't forget to reload the extension popup to see changes." -ForegroundColor Yellow
