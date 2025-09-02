#!/bin/bash

# Planning Poker - Low Memory Start Script
# Optimized for servers with 128-256 MB RAM

echo "🚀 Starting Planning Poker in Low Memory Mode..."
echo "📊 Memory optimization: 64MB heap limit"
echo "🔧 Features: Auto-cleanup, limited rooms, minimal logging"

# Set memory limits
export NODE_OPTIONS="--max-old-space-size=64 --gc-interval=100"

# Disable some Node.js features to save memory
export NODE_NO_WARNINGS=1
export UV_THREADPOOL_SIZE=2

# Production optimizations
export NODE_ENV=production

# Start the optimized server
echo "🌟 Server starting on port ${PORT:-3000}..."
node server-optimized.js