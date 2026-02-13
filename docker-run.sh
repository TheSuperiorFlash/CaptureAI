#!/bin/bash
# Convenience script for running CaptureAI Docker commands

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_usage() {
    cat << EOF
${GREEN}CaptureAI Docker Helper${NC}

Usage: ./docker-run.sh <command> [options]

Commands:
    ${YELLOW}build${NC}           Build Docker images
    ${YELLOW}up${NC}              Start all services
    ${YELLOW}down${NC}            Stop all services
    ${YELLOW}shell${NC}           Enter development container shell
    ${YELLOW}lint${NC}            Lint extension code
    ${YELLOW}test${NC}            Run extension tests
    ${YELLOW}test:watch${NC}      Run tests in watch mode
    ${YELLOW}test:coverage${NC}   Generate test coverage
    ${YELLOW}api${NC}             Start API development server
    ${YELLOW}website${NC}         Start website development server
    ${YELLOW}logs${NC}            View container logs
    ${YELLOW}ps${NC}              Show running containers
    ${YELLOW}clean${NC}           Stop containers and remove volumes
    ${YELLOW}rebuild${NC}         Rebuild without cache
    ${YELLOW}help${NC}            Show this help message

Examples:
    ./docker-run.sh build
    ./docker-run.sh up
    ./docker-run.sh shell
    ./docker-run.sh lint
    ./docker-run.sh test
    ./docker-run.sh logs

EOF
}

# Main commands
case "${1:-help}" in
    build)
        echo -e "${YELLOW}Building Docker images...${NC}"
        docker-compose build
        echo -e "${GREEN}✓ Build complete${NC}"
        ;;
    up)
        echo -e "${YELLOW}Starting services...${NC}"
        docker-compose up
        ;;
    down)
        echo -e "${YELLOW}Stopping services...${NC}"
        docker-compose down
        echo -e "${GREEN}✓ Services stopped${NC}"
        ;;
    shell)
        echo -e "${YELLOW}Entering development container...${NC}"
        docker-compose run --rm dev bash
        ;;
    lint)
        echo -e "${YELLOW}Running linter...${NC}"
        docker-compose exec dev npm run lint
        ;;
    lint:fix)
        echo -e "${YELLOW}Fixing linter issues...${NC}"
        docker-compose exec dev npm run lint:fix
        ;;
    test)
        echo -e "${YELLOW}Running tests...${NC}"
        docker-compose exec dev npm run test
        ;;
    test:watch)
        echo -e "${YELLOW}Running tests in watch mode...${NC}"
        docker-compose exec dev npm run test:watch
        ;;
    test:coverage)
        echo -e "${YELLOW}Generating test coverage...${NC}"
        docker-compose exec dev npm run test:coverage
        ;;
    api)
        echo -e "${YELLOW}Starting API server...${NC}"
        docker-compose up api
        ;;
    website)
        echo -e "${YELLOW}Starting website server...${NC}"
        docker-compose up website
        ;;
    logs)
        echo -e "${YELLOW}Showing logs...${NC}"
        docker-compose logs -f
        ;;
    ps)
        echo -e "${YELLOW}Running containers:${NC}"
        docker-compose ps
        ;;
    clean)
        echo -e "${RED}Stopping all services and removing volumes...${NC}"
        docker-compose down -v
        echo -e "${GREEN}✓ Cleanup complete${NC}"
        ;;
    rebuild)
        echo -e "${YELLOW}Rebuilding without cache...${NC}"
        docker-compose down
        docker-compose build --no-cache
        echo -e "${GREEN}✓ Rebuild complete${NC}"
        ;;
    help|--help|-h)
        print_usage
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo ""
        print_usage
        exit 1
        ;;
esac
