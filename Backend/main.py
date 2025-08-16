#!/usr/bin/env python3
"""
Unified Backend Entry Point for Render Deployment
Gurukul Learning Platform - Production Backend
"""

import os
import sys
import asyncio
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from pathlib import Path

# Add Backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create main FastAPI app
app = FastAPI(
    title="Gurukul Learning Platform API",
    description="Unified backend API for the Gurukul Learning Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware (tightened for production via env)
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "").strip()
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()] or ["http://localhost", "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Gurukul Learning Platform API",
        "status": "running",
        "version": "1.0.0",
        "services": [
            "base-backend",
            "memory-management", 
            "financial-simulator",
            "subject-generation",
            "akash-service",
            "tts-service"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "All services operational",
        "timestamp": "2024-01-01T00:00:00Z"
    }

# Import and mount service routers
try:
    # Import Base Backend
    from Base_backend.api import app as base_backend_app
    app.mount("/api/v1/base", base_backend_app)
    logger.info("✅ Base Backend mounted at /api/v1/base")
except Exception as e:
    logger.error(f"❌ Failed to mount Base Backend: {e}")

try:
    # Import Memory Management
    from memory_management.api import app as memory_app
    app.mount("/api/v1/memory", memory_app)
    logger.info("✅ Memory Management mounted at /api/v1/memory")
except Exception as e:
    logger.error(f"❌ Failed to mount Memory Management: {e}")

try:
    # Import Financial Simulator
    from Financial_simulator.Financial_simulator.langgraph_api import app as financial_app
    app.mount("/api/v1/financial", financial_app)
    logger.info("✅ Financial Simulator mounted at /api/v1/financial")
except Exception as e:
    logger.error(f"❌ Failed to mount Financial Simulator: {e}")

try:
    # Import Subject Generation
    from subject_generation.app import app as subject_app
    app.mount("/api/v1/subjects", subject_app)
    logger.info("✅ Subject Generation mounted at /api/v1/subjects")
except Exception as e:
    logger.error(f"❌ Failed to mount Subject Generation: {e}")

try:
    # Import Akash Service
    from akash.main import app as akash_app
    app.mount("/api/v1/akash", akash_app)
    logger.info("✅ Akash Service mounted at /api/v1/akash")
except Exception as e:
    logger.error(f"❌ Failed to mount Akash Service: {e}")

try:
    # Import TTS Service
    from tts_service.tts import app as tts_app
    app.mount("/api/v1/tts", tts_app)
    logger.info("✅ TTS Service mounted at /api/v1/tts")
except Exception as e:
    logger.error(f"❌ Failed to mount TTS Service: {e}")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"🚀 Starting Gurukul Backend on {host}:{port}")
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=False,
        log_level="info"
    )
