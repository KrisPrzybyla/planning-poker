# Multi-stage Dockerfile for smaller, secure runtime image

# 1) Dependencies stage (installs all deps)
FROM node:20-alpine AS deps
WORKDIR /app
ENV HUSKY=0
COPY package*.json ./
RUN npm ci

# 2) Builder stage (builds the frontend)
FROM node:20-alpine AS builder
WORKDIR /app
ENV HUSKY=0
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3) Production deps (only production dependencies)
FROM node:20-alpine AS prod-deps
WORKDIR /app
ENV HUSKY=0
COPY package*.json ./
RUN npm ci --omit=dev

# 4) Final runtime image (non-root)
FROM node:20-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user and group
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

ENV NODE_ENV=production

# Build-time metadata
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION
ARG REPO_URL
LABEL org.opencontainers.image.created=$BUILD_DATE \
      org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.version=$VERSION \
      org.opencontainers.image.source=$REPO_URL

# Copy only what's needed to run
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY server.js package.json ./

# Set ownership to non-root user
RUN chown -R app:app /app
USER app

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the server
CMD ["node", "server.js"]
