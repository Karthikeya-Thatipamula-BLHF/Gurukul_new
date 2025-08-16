# Docker Production Deployment Guide

This comprehensive guide explains how to deploy the Gurukul platform using Docker containers in a production environment.

## 🎯 Overview

The Gurukul platform is a microservices-based educational platform that includes:
- **8 Backend Services**: API endpoints for different functionalities
- **Frontend Application**: React-based user interface
- **Database Services**: MongoDB and Redis
- **Reverse Proxy**: Nginx for load balancing and SSL termination
- **Monitoring**: Health checks and logging

## 📋 Prerequisites

### System Requirements
- **OS**: Linux (Ubuntu 20.04+), macOS, or Windows 10/11 with WSL2
- **RAM**: Minimum 8GB, Recommended 16GB
- **Storage**: 20GB free disk space
- **CPU**: 4+ cores recommended

### Software Requirements
- **Docker Engine**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: For cloning the repository

## Quick Start

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd gurukul
   ```

2. Create environment files:
   ```bash
   # Copy the template files
   cp Backend/.env.template Backend/.env
   cp "new frontend/.env.production" "new frontend/.env"
   ```

3. Update the environment variables in the `.env` files with your actual values.

4. Start the services:
   ```bash
   docker-compose up -d
   ```

5. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Swagger Documentation: http://localhost:8000/docs

## Detailed Deployment Steps

### 1. Environment Configuration

Before deploying, you need to configure the environment variables for both backend and frontend services.

#### Backend Configuration

Edit the `Backend/.env` file with your specific configuration:

```
# API Keys
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key

# Database Configuration
# For Docker deployment, use the service names as hostnames
MONGODB_URL=mongodb://mongodb:27017/
REDIS_HOST=redis
REDIS_PORT=6379

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

#### Frontend Configuration

Edit the `new frontend/.env` file:

```
VITE_BASE_API_URL=http://localhost:8000
VITE_CHAT_API_URL=http://localhost:8001
VITE_FINANCIAL_API_URL=http://localhost:8002
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For production deployment, update these URLs to your actual domain names.

### 2. Building and Starting Services

You can start all services at once or selectively start specific services:

#### Start All Services

```bash
docker-compose up -d
```

The `-d` flag runs containers in the background (detached mode).

#### Start Specific Services

```bash
# Start only the backend services
docker-compose up -d mongodb redis base-backend chatbot-api financial-simulator

# Start only the frontend
docker-compose up -d frontend
```

### 3. Verifying Deployment

Check if all containers are running:

```bash
docker-compose ps
```

View logs for a specific service:

```bash
docker-compose logs -f base-backend
```

Check the health of services:

```bash
curl http://localhost:8000/health
curl http://localhost:8001/health
```

## Scaling Services

You can scale specific services to handle increased load:

```bash
docker-compose up -d --scale chatbot-api=3 --scale financial-simulator=2
```

Note: When scaling services, you'll need to implement a load balancer (like Nginx or Traefik) in front of the scaled services.

## Production Deployment Considerations

### Using Docker Swarm or Kubernetes

For production environments, consider using Docker Swarm or Kubernetes for orchestration:

#### Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy the stack
docker stack deploy -c docker-compose.yml gurukul
```

#### Kubernetes

Convert the docker-compose.yml to Kubernetes manifests using tools like Kompose:

```bash
kompose convert -f docker-compose.yml
kubectl apply -f *.yaml
```

### Security Considerations

1. **Secrets Management**: Use Docker secrets or Kubernetes secrets for sensitive information instead of environment variables.

2. **Network Security**: Configure proper network policies to restrict communication between services.

3. **Resource Limits**: Set CPU and memory limits for containers to prevent resource exhaustion.

4. **Regular Updates**: Keep base images updated to patch security vulnerabilities.

### Persistent Data

The docker-compose.yml file already defines volumes for MongoDB and Redis. For production, consider:

1. Using managed database services instead of containerized databases
2. Implementing proper backup strategies
3. Using named volumes with specific drivers for better performance and reliability

## Monitoring and Logging

Consider adding monitoring and logging solutions:

1. **Prometheus and Grafana** for metrics monitoring
2. **ELK Stack** (Elasticsearch, Logstash, Kibana) or **Loki** for log aggregation
3. **Portainer** for container management

Add these services to your docker-compose.yml file or deploy them separately.

## Troubleshooting

### Common Issues

1. **Container fails to start**:
   - Check logs: `docker-compose logs <service-name>`
   - Verify environment variables are set correctly
   - Ensure ports are not already in use

2. **Services can't communicate**:
   - Verify network configuration in docker-compose.yml
   - Check that service names are used as hostnames

3. **Database connection issues**:
   - Ensure MongoDB and Redis containers are running
   - Verify connection strings use service names (e.g., `mongodb://mongodb:27017/`)

4. **Frontend can't connect to backend**:
   - Check API URLs in frontend environment variables
   - Verify CORS settings in backend services

### Restarting Services

```bash
# Restart a specific service
docker-compose restart <service-name>

# Rebuild and restart a service
docker-compose up -d --build <service-name>

# Restart all services
docker-compose restart
```

## Updating the Application

To update the application to a new version:

1. Pull the latest code:
   ```bash
   git pull
   ```

2. Rebuild and restart services:
   ```bash
   docker-compose down
   docker-compose build
   docker-compose up -d
   ```

For zero-downtime updates, consider using rolling updates with Docker Swarm or Kubernetes.

## Conclusion

This Docker deployment approach provides a consistent and scalable way to deploy the Gurukul application. For production environments, additional considerations around security, monitoring, and high availability should be addressed based on your specific requirements.