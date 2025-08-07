#!/bin/bash

# Planning Poker - Production Startup Script
# This script starts the application in production mode on port 80

echo "🚀 Starting Planning Poker in production mode..."

# Check if Node.js 20+ is available
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Error: Node.js 20+ is required. Current version: $(node --version)"
    echo "💡 Please install Node.js 20+ or use nvm:"
    echo "   nvm install 20"
    echo "   nvm use 20"
    exit 1
fi

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "📦 Building application for production..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Build failed. Please check the errors above."
        exit 1
    fi
fi

# Check if port 80 is available (requires sudo on most systems)
if [ "$EUID" -ne 0 ]; then
    echo "⚠️  Warning: Running on port 80 typically requires sudo privileges."
    echo "💡 You can also run on a different port:"
    echo "   PORT=3000 npm start  # Run on port 3000"
    echo "   PORT=8080 npm start  # Run on port 8080"
    echo ""
    echo "🔄 Attempting to start on port 80..."
fi

# Set production environment
export NODE_ENV=production
export PORT=80

# Start the server
echo "🌐 Starting server on port 80..."
echo "📱 Application will be available at: http://localhost"
echo "🔗 Health check: http://localhost/api/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start