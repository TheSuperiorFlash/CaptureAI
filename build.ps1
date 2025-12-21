# CaptureAI Build Script for Windows (PowerShell)
# Creates a release package for Chrome Web Store submission

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CaptureAI Extension Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get version from manifest.json
$manifestContent = Get-Content -Path "manifest.json" -Raw
$version = ($manifestContent | Select-String -Pattern '"version":\s*"([^"]+)"').Matches[0].Groups[1].Value

Write-Host "Building version: $version" -ForegroundColor Yellow
Write-Host ""

# Create dist directory if it doesn't exist
if (-not (Test-Path "dist")) {
    New-Item -ItemType Directory -Path "dist" | Out-Null
}

# Define output filename
$output = "dist\captureai-v$version.zip"

# Remove old build if exists
if (Test-Path $output) {
    Write-Host "Removing old build: $output" -ForegroundColor Gray
    Remove-Item $output -Force
}

Write-Host "Creating package..." -ForegroundColor Green
Write-Host ""

# Create temporary build directory
$tempDir = "temp_build"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Host "Copying extension files..." -ForegroundColor Gray

# Define exclusions
$excludeDirs = @('dist', '.git', '.idea', '.vscode', '.claude', 'node_modules', 'tests', 'docs', $tempDir, 'coverage', 'config')
$excludeFiles = @('build.bat', 'build.sh', 'build.ps1', '.gitignore', '.editorconfig', '.eslintrc.json', '.prettierrc', 'package.json', 'package-lock.json', 'jsconfig.json', 'privacy-policy.html', 'README.md')
$excludePatterns = @('*.backup', '*.log', '*.tmp', '*.zip')

# Copy all items except excluded
Get-ChildItem -Path . | Where-Object {
    $item = $_
    # Exclude directories
    if ($item.PSIsContainer) {
        return $excludeDirs -notcontains $item.Name
    }
    # Exclude specific files
    $excluded = $excludeFiles -contains $item.Name
    if (-not $excluded) {
        # Check patterns
        foreach ($pattern in $excludePatterns) {
            if ($item.Name -like $pattern) {
                $excluded = $true
                break
            }
        }
    }
    return -not $excluded
} | ForEach-Object {
    if ($_.PSIsContainer) {
        Copy-Item -Path $_.FullName -Destination "$tempDir\$($_.Name)" -Recurse -Force
    } else {
        Copy-Item -Path $_.FullName -Destination "$tempDir\$($_.Name)" -Force
    }
}

Write-Host "Compressing files..." -ForegroundColor Gray

# Create the zip
Compress-Archive -Path "$tempDir\*" -DestinationPath $output -Force

# Clean up
Write-Host "Cleaning up temporary files..." -ForegroundColor Gray
Remove-Item $tempDir -Recurse -Force

Write-Host ""
if (Test-Path $output) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Build completed successfully!" -ForegroundColor Green
    Write-Host "Package created: $output" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green

    # Show file size
    $fileSize = (Get-Item $output).Length
    $fileSizeKB = [math]::Round($fileSize / 1KB, 2)
    Write-Host "File size: $fileSizeKB KB ($fileSize bytes)" -ForegroundColor Cyan
} else {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Build failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test the extension by loading the unpacked folder" -ForegroundColor White
Write-Host "2. Upload $output to Chrome Web Store" -ForegroundColor White
Write-Host ""
