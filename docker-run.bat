@echo off
REM CaptureAI Docker Helper for Windows

setlocal enabledelayedexpansion

REM Colors (Windows 10+)
set GREEN=[92m
set YELLOW=[93m
set RED=[91m
set NC=[0m

if "%1%"=="" goto help
if "%1%"=="help" goto help
if "%1%"=="--help" goto help
if "%1%"=="-h" goto help

if "%1%"=="build" (
    echo %YELLOW%Building Docker images...%NC%
    docker-compose build
    echo %GREEN%✓ Build complete%NC%
    goto end
)

if "%1%"=="up" (
    echo %YELLOW%Starting services...%NC%
    docker-compose up
    goto end
)

if "%1%"=="down" (
    echo %YELLOW%Stopping services...%NC%
    docker-compose down
    echo %GREEN%✓ Services stopped%NC%
    goto end
)

if "%1%"=="shell" (
    echo %YELLOW%Entering development container...%NC%
    docker-compose run --rm dev bash
    goto end
)

if "%1%"=="lint" (
    echo %YELLOW%Running linter...%NC%
    docker-compose exec dev npm run lint
    goto end
)

if "%1%"=="lint:fix" (
    echo %YELLOW%Fixing linter issues...%NC%
    docker-compose exec dev npm run lint:fix
    goto end
)

if "%1%"=="test" (
    echo %YELLOW%Running tests...%NC%
    docker-compose exec dev npm run test
    goto end
)

if "%1%"=="test:watch" (
    echo %YELLOW%Running tests in watch mode...%NC%
    docker-compose exec dev npm run test:watch
    goto end
)

if "%1%"=="test:coverage" (
    echo %YELLOW%Generating test coverage...%NC%
    docker-compose exec dev npm run test:coverage
    goto end
)

if "%1%"=="api" (
    echo %YELLOW%Starting API server...%NC%
    docker-compose up api
    goto end
)

if "%1%"=="website" (
    echo %YELLOW%Starting website server...%NC%
    docker-compose up website
    goto end
)

if "%1%"=="logs" (
    echo %YELLOW%Showing logs...%NC%
    docker-compose logs -f
    goto end
)

if "%1%"=="ps" (
    echo %YELLOW%Running containers:%NC%
    docker-compose ps
    goto end
)

if "%1%"=="clean" (
    echo %RED%Stopping all services and removing volumes...%NC%
    docker-compose down -v
    echo %GREEN%✓ Cleanup complete%NC%
    goto end
)

if "%1%"=="rebuild" (
    echo %YELLOW%Rebuilding without cache...%NC%
    docker-compose down
    docker-compose build --no-cache
    echo %GREEN%✓ Rebuild complete%NC%
    goto end
)

echo %RED%Unknown command: %1%%NC%
echo.
goto help

:help
echo %GREEN%CaptureAI Docker Helper%NC%
echo.
echo Usage: docker-run.bat ^<command^> [options]
echo.
echo Commands:
echo   %YELLOW%build%NC%           Build Docker images
echo   %YELLOW%up%NC%              Start all services
echo   %YELLOW%down%NC%            Stop all services
echo   %YELLOW%shell%NC%           Enter development container shell
echo   %YELLOW%lint%NC%            Lint extension code
echo   %YELLOW%test%NC%            Run extension tests
echo   %YELLOW%test:watch%NC%      Run tests in watch mode
echo   %YELLOW%test:coverage%NC%   Generate test coverage
echo   %YELLOW%api%NC%             Start API development server
echo   %YELLOW%website%NC%         Start website development server
echo   %YELLOW%logs%NC%            View container logs
echo   %YELLOW%ps%NC%              Show running containers
echo   %YELLOW%clean%NC%           Stop containers and remove volumes
echo   %YELLOW%rebuild%NC%         Rebuild without cache
echo   %YELLOW%help%NC%            Show this help message
echo.
echo Examples:
echo   docker-run.bat build
echo   docker-run.bat up
echo   docker-run.bat shell
echo   docker-run.bat lint
echo   docker-run.bat test
echo   docker-run.bat logs
echo.

:end
endlocal
