@echo off
REM CaptureAI Build Script for Windows
REM Creates a release package for Chrome Web Store submission

echo ========================================
echo CaptureAI Extension Build Script
echo ========================================
echo.

REM Get version from manifest.json
for /f "tokens=2 delims=:, " %%a in ('findstr /C:"\"version\"" manifest.json') do set VERSION=%%~a

echo Building version: %VERSION%
echo.

REM Create dist directory if it doesn't exist
if not exist "dist" mkdir dist

REM Define output filename
set OUTPUT=dist\captureai-v%VERSION%.zip

REM Remove old build if exists
if exist "%OUTPUT%" (
    echo Removing old build: %OUTPUT%
    del "%OUTPUT%"
)

echo Creating package...
echo.

REM Create zip file (requires PowerShell)
powershell -Command "Compress-Archive -Path .\* -DestinationPath '%OUTPUT%' -Force -Exclude @('dist', '.git', '.gitignore', '.editorconfig', '.eslintrc.json', '.prettierrc', 'build.bat', 'build.sh', '*.backup', '*.log', '*.tmp', '.claude', 'node_modules')"

echo.
if exist "%OUTPUT%" (
    echo ========================================
    echo Build completed successfully!
    echo Package created: %OUTPUT%
    echo ========================================
) else (
    echo ========================================
    echo Build failed!
    echo ========================================
    exit /b 1
)

echo.
echo Next steps:
echo 1. Test the extension by loading the unpacked folder
echo 2. Upload %OUTPUT% to Chrome Web Store
echo.
pause
