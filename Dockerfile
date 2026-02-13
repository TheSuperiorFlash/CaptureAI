# Multi-stage Dockerfile for CaptureAI development
# Supports API (Cloudflare Workers), Website (Next.js), and Extension development

# ==============================================================================
# Stage 1: Base development environment
# ==============================================================================
FROM node:22-alpine AS base

# Install system dependencies for development
RUN apk add --no-cache \
    git \
    curl \
    python3 \
    make \
    g++ \
    bash \
    ca-certificates

WORKDIR /app

# Copy the entire project
COPY . .

# ==============================================================================
# Stage 2: API dependencies
# ==============================================================================
FROM base AS api-deps

WORKDIR /app/api

RUN npm ci --frozen-lockfile || npm install

# ==============================================================================
# Stage 3: Website dependencies
# ==============================================================================
FROM base AS website-deps

WORKDIR /app/website

RUN npm ci --frozen-lockfile || npm install

# ==============================================================================
# Stage 4: Root dependencies
# ==============================================================================
FROM base AS root-deps

RUN npm ci --frozen-lockfile || npm install

# ==============================================================================
# Final development image
# ==============================================================================
FROM base AS development

# Copy installed dependencies from each stage
COPY --from=api-deps /app/api/node_modules /app/api/node_modules
COPY --from=website-deps /app/website/node_modules /app/website/node_modules
COPY --from=root-deps /app/node_modules /app/node_modules

# Create non-root user for security
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

# Set permissions
RUN chown -R nodejs:nodejs /app

USER nodejs

# Expose ports
# Next.js development server
EXPOSE 3000
# Cloudflare Workers development server
EXPOSE 8787
# Optional: debugging port
EXPOSE 9229

# Default to interactive shell
CMD ["/bin/bash"]

# ==============================================================================
# Build stage for production website (optional)
# ==============================================================================
FROM base AS website-build

COPY --from=website-deps /app/website/node_modules /app/website/node_modules

WORKDIR /app/website

RUN npm run build

# ==============================================================================
# Production stage (minimal image)
# ==============================================================================
FROM node:22-alpine AS production

WORKDIR /app

RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

# Copy only production artifacts
COPY --from=website-build /app/website/.next /app/website/.next
COPY --from=website-build /app/website/node_modules /app/website/node_modules
COPY --from=website-build /app/website/package.json /app/website/
COPY --from=website-build /app/website/next.config.ts /app/website/

# Copy API files
COPY --chown=nodejs:nodejs api /app/api
COPY --chown=nodejs:nodejs extension /app/extension
COPY --chown=nodejs:nodejs package.json /app/

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000
EXPOSE 8787

# Start Next.js in production mode
CMD ["npm", "--prefix", "website", "start"]
