@echo off
setlocal enabledelayedexpansion

REM Gurukul Production Deployment Script for Windows
REM ================================================

echo.
echo 🚀 Starting Gurukul Production Deployment...
echo ==============================================

REM Check if Docker is installed and running
echo [INFO] Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo [SUCCESS] Docker and Docker Compose are ready

REM Check environment configuration
echo [INFO] Checking environment configuration...

if not exist ".env" (
    echo [WARNING] .env file not found. Creating from template...
    copy ".env.example" ".env" >nul
    echo [WARNING] Please edit .env file with your actual configuration values
)

if not exist "Backend\.env" (
    echo [WARNING] Backend\.env file not found. Creating from template...
    copy ".env.example" "Backend\.env" >nul
    echo [WARNING] Please edit Backend\.env file with your actual configuration values
)

echo [SUCCESS] Environment configuration checked

REM Create necessary directories
echo [INFO] Creating necessary directories...
if not exist "nginx\ssl" mkdir "nginx\ssl"
if not exist "monitoring\data" mkdir "monitoring\data"
if not exist "logs" mkdir "logs"
echo [SUCCESS] Directories created

REM Stop any existing containers
echo [INFO] Stopping existing containers...
docker-compose down --remove-orphans 2>nul

REM Handle clean deployment
if "%1"=="--clean" (
    echo [INFO] Removing old images...
    docker system prune -f
)

REM Build and start services
echo [INFO] Building services...
docker-compose build --no-cache
if errorlevel 1 (
    echo [ERROR] Failed to build services
    pause
    exit /b 1
)

echo [INFO] Starting services...
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Failed to start services
    pause
    exit /b 1
)

echo [SUCCESS] Services started

REM Wait for services to be healthy
echo [INFO] Waiting for services to be healthy...
timeout /t 30 /nobreak >nul

REM Display service status
echo.
echo [INFO] Service Status:
echo ===============
docker-compose ps

echo.
echo [INFO] Service URLs:
echo =============
echo 🌐 Frontend:           http://localhost:3000
echo 🔧 Base Backend:       http://localhost:8000
echo 💬 Chatbot API:        http://localhost:8001
echo 💰 Financial API:      http://localhost:8002
echo 🧠 Memory API:         http://localhost:8003
echo 👤 Akash API:          http://localhost:8004
echo 📚 Subject API:        http://localhost:8005
echo 🎓 Karthikeya API:     http://localhost:8006
echo 🔊 TTS API:            http://localhost:8007
echo 🌍 Nginx Proxy:        http://localhost:80

echo.
echo [INFO] Database Services:
echo ==================
echo 🍃 MongoDB:            localhost:27017
echo 🔴 Redis:              localhost:6379

echo.
echo [SUCCESS] 🎉 Deployment completed successfully!
echo [INFO] Access your application at: http://localhost:3000
echo [INFO] API documentation available at: http://localhost:8000/docs

echo.
echo [INFO] Useful commands:
echo   View logs:           docker-compose logs -f
echo   Stop services:       docker-compose down
echo   Restart services:    docker-compose restart
echo   Update services:     deploy_production.bat --clean

echo.
echo Press any key to exit...
pause >nul
