# Gurukul AI - Pipeline Service Deployment Configuration

## Overview

This document outlines the changes made to integrate the deployed `pipeline-24-master` service running on Render at `https://pipeline-24-master-1.onrender.com/`.

## Backend Changes (Pipeline Service)

### 1. Environment Variables Configuration

All hardcoded IP addresses in the pipeline service have been replaced with environment variables for flexible deployment:

**File: `Backend/pipline-24-master/.env`**

```env
# TTS Service Configuration
TTS_SERVER_HOST=localhost
TTS_SERVER_PORT=8001

# External Data Server Configuration
EXTERNAL_SERVER_HOST=localhost
EXTERNAL_SERVER_PORT=8001

# Remote Audio Server Configuration
REMOTE_AUDIO_HOST=localhost
REMOTE_AUDIO_PORT=8000

# Main Server Configuration
MAIN_SERVER_HOST=localhost
MAIN_SERVER_PORT=8000

# Forwarding Middleware Configuration
FORWARDING_TARGET_HOST=localhost
FORWARDING_TARGET_PORT=8001
```

### 2. Code Updates

**File: `Backend/pipline-24-master/app.py`**

- Replaced all hardcoded IP addresses (192.168.x.x) with environment variable lookups
- Updated TTS service integration to use `TTS_SERVER_HOST` and `TTS_SERVER_PORT`
- Updated external server forwarding to use `EXTERNAL_SERVER_HOST` and `EXTERNAL_SERVER_PORT`
- Updated remote audio server configuration to use `REMOTE_AUDIO_HOST` and `REMOTE_AUDIO_PORT`
- Updated forwarding middleware to use configurable target URLs

**Key Environment Variables Used:**
- `TTS_SERVER_HOST` / `TTS_SERVER_PORT` - TTS service endpoints
- `EXTERNAL_SERVER_HOST` / `EXTERNAL_SERVER_PORT` - External data forwarding
- `REMOTE_AUDIO_HOST` / `REMOTE_AUDIO_PORT` - Remote audio file access
- `MAIN_SERVER_HOST` / `MAIN_SERVER_PORT` - This service's host info
- `FORWARDING_TARGET_HOST` / `FORWARDING_TARGET_PORT` - Request forwarding targets

## Frontend Changes

### 1. Configuration Updates

**File: `new frontend/src/config.js`**

The pipeline service URL is already configured to use the Render deployment:

```javascript
export const PIPELINE_API_BASE_URL = getEnvVar(
  'VITE_PIPELINE_API_BASE_URL',
  isDevelopment ? 'http://localhost:8000' : 'https://pipeline-24-master-1.onrender.com'
);
```

### 2. New API Slice

**File: `new frontend/src/api/pipelineApiSlice.js`**

Created a dedicated API slice for the pipeline service with the following endpoints:

- `generatePipelineLesson` - Generate lessons using the deployed pipeline
- `generatePipelineLessonAsync` - Async lesson generation with task tracking
- `checkGenerationTaskStatus` - Check status of async generation tasks
- `generateLessonTTS` - Generate TTS audio for lessons
- `getAudioFile` - Retrieve audio files from the pipeline service
- `forwardDataToExternal` - Forward data to external services
- `getPipelineStatus` - Check pipeline service health

### 3. Store Integration

**File: `new frontend/src/store/store.js`**

Added the new pipeline API slice to the Redux store configuration.

### 4. Health Check Updates

**File: `new frontend/src/utils/healthCheck.js`**

Added the pipeline service to the health check monitoring.

## Deployment Instructions

### For Local Development

1. Use the default `.env` values (localhost configurations)
2. Ensure all backend services are running locally
3. The frontend will use `http://localhost:8000` for pipeline API calls

### For Production (Render)

Update the `.env` file in the pipeline service with production values:

```env
# Production values for Render deployment
TTS_SERVER_HOST=your-tts-server.onrender.com
TTS_SERVER_PORT=443
EXTERNAL_SERVER_HOST=your-external-server.onrender.com
EXTERNAL_SERVER_PORT=443
REMOTE_AUDIO_HOST=your-audio-server.onrender.com
REMOTE_AUDIO_PORT=443
MAIN_SERVER_HOST=pipeline-24-master-1.onrender.com
MAIN_SERVER_PORT=443
```

**Note:** For HTTPS services on Render, use port 443. For HTTP services, use port 80.

## API Usage Examples

### Using the Pipeline Service

```javascript
import { useGeneratePipelineLessonMutation } from '../api/pipelineApiSlice';

const [generateLesson] = useGeneratePipelineLessonMutation();

const handleGenerateLesson = async () => {
  try {
    const result = await generateLesson({
      subject: 'mathematics',
      topic: 'algebra',
      user_id: 'user123',
      include_wikipedia: true,
      force_regenerate: true,
    });
    console.log('Lesson generated:', result.data);
  } catch (error) {
    console.error('Error generating lesson:', error);
  }
};
```

### Checking Service Health

```javascript
import { checkAllServices } from '../utils/healthCheck';

const checkHealth = async () => {
  const health = await checkAllServices();
  console.log('All services healthy:', health.allHealthy);
  console.log('Pipeline service:', health.services.pipeline);
};
```

## Benefits

1. **Flexible Deployment**: Service can run locally or on cloud platforms
2. **Environment Separation**: Different configurations for dev/staging/production
3. **Scalability**: Easy to update service endpoints without code changes
4. **Monitoring**: Health checks for all services including deployed pipeline
5. **Type Safety**: Full TypeScript support with RTK Query integration

## Service URLs

- **Development**: `http://localhost:8000`
- **Production**: `https://pipeline-24-master-1.onrender.com`
- **Health Check**: `{base_url}/` (returns service status and available endpoints)
- **API Documentation**: `{base_url}/docs` (FastAPI automatic documentation)

## Next Steps

1. Configure environment variables in Render dashboard
2. Test all endpoints with deployed service
3. Monitor service health and performance
4. Update other services to use environment variables if needed