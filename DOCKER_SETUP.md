# Docker Setup for CaptureAI

This guide explains how to use Docker to safely run CaptureAI with Claude Code.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)
- Git

## Quick Start

### Option 1: Development Container with All Services

```bash
# Build and start all services
docker-compose up --build

# In a new terminal, enter the development container
docker-compose exec dev bash

# Inside the container, you can run:
npm run lint              # Lint extension code
npm run test              # Run extension tests
cd api && npm run dev     # Start API dev server
cd website && npm run dev # Start website dev server
```

### Option 2: Individual Services

```bash
# Start only the API service
docker-compose up api

# Start only the website service
docker-compose up website

# Start only the development environment
docker-compose up dev
```

### Option 3: Build and Run Manually

```bash
# Build the development image
docker build --target development -t captureai-dev .

# Run an interactive container
docker run -it --rm \
  -v $(pwd):/app \
  -v /app/node_modules \
  -v /app/api/node_modules \
  -v /app/website/node_modules \
  -p 3000:3000 \
  -p 8787:8787 \
  captureai-dev

# Inside the container
npm run lint
npm run test
```

## Available Commands

### Extension Development
```bash
npm run lint              # Check code style
npm run lint:fix         # Fix code style issues
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate test coverage report
npm run test:verbose     # Run tests with verbose output
```

### API Development (inside `/app/api`)
```bash
npm run dev              # Start development server (port 8787)
npm run deploy           # Deploy to Cloudflare Workers
npm run tail             # Tail logs
npm run db:init          # Initialize database
npm run db:migrate       # Run migrations
```

### Website Development (inside `/app/website`)
```bash
npm run dev              # Start dev server (port 3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Check code style
```

## Port Mappings

- **3000**: Next.js Development Server (Website)
- **8787**: Cloudflare Workers Development Server (API)
- **9229**: Node.js Debugging Port

## Volumes Explained

The docker-compose setup mounts:
- `.:/app` - Your entire project source code
- `/app/node_modules` - Root node_modules (preserved separately)
- `/app/api/node_modules` - API dependencies
- `/app/website/node_modules` - Website dependencies

This allows you to edit files locally and see changes reflected in the container immediately.

## Environment Variables

Create a `.env` file in your project root:

```bash
NODE_ENV=development
DEBUG=*
```

The container will automatically load this file.

## Docker Images

Three image variants are available:

### `development` (Default)
- Full development environment
- All dependencies installed
- For local development with hot reload
- Use this for Claude Code development

### `website-build`
- Optimized for building the Next.js site
- Includes build artifacts
- Intermediate stage used by production

### `production`
- Minimal production image
- Only necessary files
- For deployment

## Troubleshooting

### Container fails to start
```bash
# Check logs
docker-compose logs dev

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Port already in use
```bash
# Change ports in docker-compose.yml or use different port
docker-compose up -p 3001:3000
```

### Dependencies not installing
```bash
# Remove node_modules and reinstall
docker-compose exec dev rm -rf node_modules api/node_modules website/node_modules
docker-compose exec dev npm install
```

### View running containers
```bash
docker ps
docker-compose ps
```

### Execute commands in running container
```bash
docker-compose exec dev npm run test
docker-compose exec website npm run build
docker-compose exec api npm run dev
```

## Security Benefits

- **Isolated Environment**: Code runs in a container, not your host machine
- **Non-root User**: Container runs as non-root `nodejs` user
- **Clean Dependencies**: No system-wide package pollution
- **Reproducible**: Same environment across machines
- **Easy Cleanup**: Remove everything with `docker-compose down`

## Claude Code Integration

When using Claude Code in Docker:

1. Install Docker Desktop
2. Open terminal in project directory
3. Run `docker-compose up dev` to start development environment
4. Claude Code can now safely:
   - Run tests
   - Lint code
   - Install dependencies
   - Modify source files
   - All within the isolated container

## Next Steps

- Read Docker documentation: https://docs.docker.com/
- Docker Compose reference: https://docs.docker.com/compose/compose-file/
- Node.js best practices: https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
