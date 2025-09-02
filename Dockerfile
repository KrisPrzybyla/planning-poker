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
RUN npm ci --omit=dev --ignore-scripts

# 4) Final runtime image (non-root)
FROM node:20-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user and group
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

ENV NODE_ENV=production

# Low-memory profile support
ARG LOW_MEMORY=false
ENV LOW_MEMORY=$LOW_MEMORY

# Build-time metadata
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION
ARG REPO_URL
LABEL org.opencontainers.image.created=$BUILD_DATE \
      org.opencontainers.image.revision=$VCS_REF \
      org.opencontainers.image.version=$VERSION \
      org.opencontainers.image.source=$REPO_URL

# Apply low-memory defaults if requested
RUN if [ "$LOW_MEMORY" = "true" ]; then \
      echo "Enabling low-memory profile" && \
      export NODE_OPTIONS=--max-old-space-size=128 && \
      export UV_THREADPOOL_SIZE=1 && \
      export NODE_NO_WARNINGS=1 && \
      export LOG_LEVEL=warn && \
      export LOG_TO_CONSOLE=false && \
      export ACCESS_LOG_ENABLED=true && \
      export ACCESS_LOG_ERRORS_ONLY=true && \
      export ACCESS_LOG_SAMPLE=10 && \
      export ACCESS_LOG_SLOW_MS=0 && \
      echo "Applied low-memory env defaults" ; \
    fi

# Ensure envs are persisted (can be overridden at runtime)
ENV NODE_OPTIONS=${NODE_OPTIONS}
ENV UV_THREADPOOL_SIZE=${UV_THREADPOOL_SIZE}
ENV NODE_NO_WARNINGS=${NODE_NO_WARNINGS}
ENV LOG_LEVEL=${LOG_LEVEL}
ENV LOG_TO_CONSOLE=${LOG_TO_CONSOLE}
ENV ACCESS_LOG_ENABLED=${ACCESS_LOG_ENABLED}
ENV ACCESS_LOG_ERRORS_ONLY=${ACCESS_LOG_ERRORS_ONLY}
ENV ACCESS_LOG_SAMPLE=${ACCESS_LOG_SAMPLE}
ENV ACCESS_LOG_SLOW_MS=${ACCESS_LOG_SLOW_MS}

# Copy only what's needed to run
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY server.js logger.js package.json ./

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
