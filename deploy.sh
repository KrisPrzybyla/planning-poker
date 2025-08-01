#!/bin/bash

# Planning Poker - Deployment Script
# Supports multiple deployment platforms

set -e

echo "🚀 Planning Poker - Deployment Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Build application
build_app() {
    log_info "Building application..."
    
    # Install root dependencies
    npm install
    
    # Build server
    log_info "Building server..."
    cd server
    npm install
    npm run build
    cd ..
    
    # Build client
    log_info "Building client..."
    cd client
    npm install
    npm run build
    cd ..
    
    log_success "Application built successfully"
}

# Deploy to Docker
deploy_docker() {
    log_info "Deploying with Docker..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Build Docker image
    docker build -t planning-poker .
    
    # Run with docker-compose
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d
        log_success "Deployed with Docker Compose"
        log_info "Application available at: http://localhost"
    else
        docker run -d -p 3001:3001 --name planning-poker planning-poker
        log_success "Deployed with Docker"
        log_info "Application available at: http://localhost:3001"
    fi
}

# Deploy to Vercel
deploy_vercel() {
    log_info "Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        log_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    build_app
    vercel --prod
    log_success "Deployed to Vercel"
}

# Deploy to Railway
deploy_railway() {
    log_info "Deploying to Railway..."
    
    if ! command -v railway &> /dev/null; then
        log_warning "Railway CLI not found. Installing..."
        npm install -g @railway/cli
    fi
    
    railway login
    railway up
    log_success "Deployed to Railway"
}

# Deploy to Render
deploy_render() {
    log_info "Deploying to Render..."
    log_info "Please push your code to GitHub and connect it to Render"
    log_info "Render will automatically deploy using render.yaml configuration"
    log_success "Render deployment configured"
}

# Deploy to Heroku
deploy_heroku() {
    log_info "Deploying to Heroku..."
    
    if ! command -v heroku &> /dev/null; then
        log_error "Heroku CLI is not installed"
        log_info "Install from: https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    
    # Create Heroku app if not exists
    if ! heroku apps:info planning-poker-app &> /dev/null; then
        heroku create planning-poker-app
    fi
    
    # Set buildpacks
    heroku buildpacks:set heroku/nodejs
    
    # Deploy
    git add .
    git commit -m "Deploy to Heroku" || true
    git push heroku main
    
    log_success "Deployed to Heroku"
}

# Main menu
show_menu() {
    echo ""
    echo "Select deployment option:"
    echo "1) 🐳 Docker (Local)"
    echo "2) ▲ Vercel"
    echo "3) 🚂 Railway"
    echo "4) 🎨 Render"
    echo "5) 💜 Heroku"
    echo "6) 🏗️  Build only"
    echo "7) 🧪 Test build"
    echo "0) Exit"
    echo ""
}

# Test build
test_build() {
    log_info "Testing build..."
    build_app
    
    # Start server for testing
    cd server
    npm start &
    SERVER_PID=$!
    cd ..
    
    # Wait for server to start
    sleep 5
    
    # Test health endpoint
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_success "Build test passed - server is responding"
    else
        log_error "Build test failed - server is not responding"
    fi
    
    # Cleanup
    kill $SERVER_PID 2>/dev/null || true
}

# Main script
main() {
    check_prerequisites
    
    if [ $# -eq 0 ]; then
        # Interactive mode
        while true; do
            show_menu
            read -p "Enter your choice [0-7]: " choice
            
            case $choice in
                1) deploy_docker ;;
                2) deploy_vercel ;;
                3) deploy_railway ;;
                4) deploy_render ;;
                5) deploy_heroku ;;
                6) build_app ;;
                7) test_build ;;
                0) log_info "Goodbye!"; exit 0 ;;
                *) log_error "Invalid option. Please try again." ;;
            esac
            
            echo ""
            read -p "Press Enter to continue..."
        done
    else
        # Command line mode
        case $1 in
            docker) deploy_docker ;;
            vercel) deploy_vercel ;;
            railway) deploy_railway ;;
            render) deploy_render ;;
            heroku) deploy_heroku ;;
            build) build_app ;;
            test) test_build ;;
            *) 
                echo "Usage: $0 [docker|vercel|railway|render|heroku|build|test]"
                exit 1
                ;;
        esac
    fi
}

# Run main function
main "$@"