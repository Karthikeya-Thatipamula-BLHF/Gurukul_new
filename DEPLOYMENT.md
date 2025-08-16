# Gurukul Deployment Guide

This guide provides instructions for deploying the Gurukul application in a production environment.

## Prerequisites

- Python 3.9+ installed
- Node.js 16+ installed
- MongoDB instance (local or cloud)
- API keys for required services (Groq, OpenAI, Gemini, etc.)

## Backend Deployment

### 1. Environment Setup

The backend now uses a consolidated `.env` file for all services. To set up the environment:

1. Navigate to the Backend directory
2. Run the environment consolidation script:

```bash
update_env_files.bat
```

This script will:
- Create a consolidated `.env` file with all required environment variables
- Back up existing `.env` files in each service directory
- Create symbolic links from each service to the main `.env` file

### 2. Production Deployment

To deploy the backend in production mode:

1. Navigate to the Backend directory
2. Run the production deployment script:

```bash
deploy_production.bat
```

This script will:
- Install all required dependencies
- Set up the database
- Start all services with production settings
- Log output to the `logs` directory

### 3. Service Ports

The following services will be running on these ports:

- Base Backend: 8000
- Chatbot API: 8001
- Financial Simulator: 8002
- Memory Management: 8003
- Akash Service: 8004
- Subject Generation: 8005
- Wellness API: 8006
- TTS Service: 8007

## Frontend Deployment

### 1. Environment Setup

The frontend uses environment variables for API connections. For production deployment:

1. Navigate to the `new frontend` directory
2. Verify the `.env.production` file exists with the correct API URLs

### 2. Production Build and Deployment

To build and deploy the frontend:

1. Navigate to the `new frontend` directory
2. Run the production deployment script:

```bash
deploy_production.bat
```

This script will:
- Install dependencies
- Build the application for production
- Provide options for deployment (Firebase, Netlify, or manual)

### 3. Manual Deployment

If you prefer to deploy manually:

1. Build the frontend:

```bash
npm run build
```

2. Deploy the contents of the `dist` directory to your web server

## Production Considerations

### Security

- Ensure all API keys are kept secure and not committed to version control
- Set up proper CORS settings in the backend `.env` file
- Use HTTPS for all production endpoints

### Performance

- Increase the number of workers for high-traffic services
- Consider using a process manager like PM2 for Node.js services
- Set up proper caching mechanisms

### Monitoring

- Monitor service logs in the `logs` directory
- Consider setting up a monitoring solution (e.g., Prometheus, Grafana)
- Implement proper error reporting

### Scaling

- For higher loads, consider containerizing services with Docker
- Set up load balancing for critical services
- Use a managed MongoDB service for better reliability

## Troubleshooting

### Backend Services

- Check the logs in the `logs` directory for errors
- Verify all required environment variables are set
- Ensure all ports are available and not blocked by firewalls

### Frontend

- Check browser console for errors
- Verify API endpoints are correctly configured in `.env.production`
- Test API connections using tools like Postman

## Contact

For support, please contact the Gurukul development team.