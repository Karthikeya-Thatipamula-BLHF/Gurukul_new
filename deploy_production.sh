#!/bin/bash

# Gurukul Production Deployment Script
# ====================================

set -e  # Exit on any error

echo "🚀 Starting Gurukul Production Deployment..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed and running
check_docker() {
    print_status "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are ready"
}

# Check environment configuration
check_environment() {
    print_status "Checking environment configuration..."
    
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from template..."
        cp .env.example .env
        print_warning "Please edit .env file with your actual configuration values"
        print_warning "Deployment will continue with default values"
    fi
    
    if [ ! -f "Backend/.env" ]; then
        print_warning "Backend/.env file not found. Creating from template..."
        cp .env.example Backend/.env
        print_warning "Please edit Backend/.env file with your actual configuration values"
    fi
    
    print_success "Environment configuration checked"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p nginx/ssl
    mkdir -p monitoring/data
    mkdir -p logs
    
    print_success "Directories created"
}

# Build and start services
deploy_services() {
    print_status "Building and starting services..."
    
    # Stop any existing containers
    print_status "Stopping existing containers..."
    docker-compose down --remove-orphans || true
    
    # Remove old images (optional)
    if [ "$1" = "--clean" ]; then
        print_status "Removing old images..."
        docker system prune -f
    fi
    
    # Build and start services
    print_status "Building services..."
    docker-compose build --no-cache
    
    print_status "Starting services..."
    docker-compose up -d
    
    print_success "Services started"
}

# Wait for services to be healthy
wait_for_services() {
    print_status "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        print_status "Health check attempt $attempt/$max_attempts..."
        
        if docker-compose ps | grep -q "unhealthy"; then
            print_warning "Some services are still starting..."
            sleep 10
            ((attempt++))
        else
            print_success "All services are healthy"
            return 0
        fi
    done
    
    print_error "Services failed to start properly"
    docker-compose logs
    exit 1
}

# Display service status
show_status() {
    print_status "Service Status:"
    echo "==============="
    docker-compose ps
    
    echo ""
    print_status "Service URLs:"
    echo "============="
    echo "🌐 Frontend:           http://localhost:3000"
    echo "🔧 Base Backend:       http://localhost:8000"
    echo "💬 Chatbot API:        http://localhost:8001"
    echo "💰 Financial API:      http://localhost:8002"
    echo "🧠 Memory API:         http://localhost:8003"
    echo "👤 Akash API:          http://localhost:8004"
    echo "📚 Subject API:        http://localhost:8005"
    echo "🎓 Karthikeya API:     http://localhost:8006"
    echo "🔊 TTS API:            http://localhost:8007"
    echo "🌍 Nginx Proxy:        http://localhost:80"
    
    echo ""
    print_status "Database Services:"
    echo "=================="
    echo "🍃 MongoDB:            localhost:27017"
    echo "🔴 Redis:              localhost:6379"
}

# Main deployment function
main() {
    echo "🎯 Gurukul Production Deployment"
    echo "================================"
    
    check_docker
    check_environment
    create_directories
    deploy_services "$1"
    wait_for_services
    show_status
    
    echo ""
    print_success "🎉 Deployment completed successfully!"
    print_status "Access your application at: http://localhost:3000"
    print_status "API documentation available at: http://localhost:8000/docs"
    
    echo ""
    print_status "Useful commands:"
    echo "  View logs:           docker-compose logs -f"
    echo "  Stop services:       docker-compose down"
    echo "  Restart services:    docker-compose restart"
    echo "  Update services:     ./deploy_production.sh --clean"
}

# Handle script arguments
case "$1" in
    --clean)
        main --clean
        ;;
    --help)
        echo "Usage: $0 [--clean] [--help]"
        echo ""
        echo "Options:"
        echo "  --clean    Remove old images before deployment"
        echo "  --help     Show this help message"
        ;;
    *)
        main
        ;;
esac
