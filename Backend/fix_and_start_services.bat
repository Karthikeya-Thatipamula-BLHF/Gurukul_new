@echo off
echo ========================================
echo    Gurukul Platform - Service Fixer
echo    Fixing Dependencies and Starting Services
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Running with administrator privileges
) else (
    echo ⚠️  This script requires administrator privileges to start MongoDB
    echo    Please run as administrator or start MongoDB manually
    echo.
)

echo 🔧 Installing missing dependencies...

REM Install missing Python packages
echo Installing PyMuPDF (fitz)...
pip install PyMuPDF>=1.26.0 --quiet

echo Installing agentops...
pip install agentops>=0.4.0 --quiet

echo Installing langchain-huggingface...
pip install langchain-huggingface>=0.3.0 --quiet

echo Installing wbgapi for Financial Simulator...
pip install wbgapi>=1.0.0 --quiet

echo Installing plotly for forecasting...
pip install plotly>=5.0.0 --quiet

echo Installing litellm for Financial Simulator...
pip install litellm>=1.75.0 --quiet

echo ✅ Dependencies installed
echo.

REM Try to start MongoDB if running as admin
net session >nul 2>&1
if %errorLevel% == 0 (
    echo 🗄️  Starting MongoDB service...
    net start MongoDB >nul 2>&1
    if %errorLevel% == 0 (
        echo ✅ MongoDB started successfully
    ) else (
        echo ⚠️  MongoDB failed to start - may already be running
    )
) else (
    echo ⚠️  Cannot start MongoDB - not running as administrator
    echo    Please start MongoDB manually:
    echo    1. Open Command Prompt as Administrator
    echo    2. Run: net start MongoDB
)

echo.
echo 📋 IMPORTANT NOTES:
echo    ⚠️  Redis is not installed - Financial Simulator will use in-memory fallback
echo    ⚠️  If MongoDB fails to start, Memory Management service will not work
echo    ✅ Other services will work without Redis/MongoDB
echo.

echo.
echo 🚀 Starting all services...
echo.

REM Set the base directory
set BASE_DIR=%~dp0

REM Start all services
echo 🏠 Starting Base Backend on port 8000...
start "Base Backend" cmd /k "cd /d %BASE_DIR%Base_backend && python api.py"
timeout /t 3 /nobreak >nul

echo 🤖 Starting API Data Service on port 8001...
start "API Data Service" cmd /k "cd /d %BASE_DIR%api_data && python api.py"
timeout /t 3 /nobreak >nul

echo 💰 Starting Financial Simulator on port 8002...
start "Financial Simulator" cmd /k "cd /d %BASE_DIR%Financial_simulator\Financial_simulator && python langgraph_api.py"
timeout /t 3 /nobreak >nul

echo 📝 Starting Memory Management API on port 8003...
start "Memory Management" cmd /k "cd /d %BASE_DIR%memory_management && python run_server.py"
timeout /t 3 /nobreak >nul

echo 🧠 Starting Akash Service on port 8004...
start "Akash Service" cmd /k "cd /d %BASE_DIR%akash && python main.py"
timeout /t 3 /nobreak >nul

echo 📖 Starting Subject Generation on port 8005...
start "Subject Generation" cmd /k "cd /d %BASE_DIR%subject_generation && python app.py"
timeout /t 3 /nobreak >nul

echo 🧘 Starting Wellness API on port 8006...
start "Wellness API" cmd /k "cd /d %BASE_DIR%orchestration\unified_orchestration_system && python simple_api.py --port 8006"
timeout /t 3 /nobreak >nul

echo 🔊 Starting TTS Service on port 8007...
start "TTS Service" cmd /k "cd /d %BASE_DIR%tts_service && python tts.py"
timeout /t 3 /nobreak >nul

echo.
echo ✅ All services are starting...
echo.
echo 🌐 Service URLs:
echo    Base Backend:        http://localhost:8000/health
echo    API Data Service:    http://localhost:8001/health
echo    Financial Simulator: http://localhost:8002/health
echo    Memory Management:   http://localhost:8003/memory/health
echo    Akash Service:       http://localhost:8004/health
echo    Subject Generation:  http://localhost:8005/health
echo    Wellness API:        http://localhost:8006/
echo    TTS Service:         http://localhost:8007/api/health
echo.
echo 📋 Next Steps:
echo    1. Wait 30-60 seconds for all services to start
echo    2. Check the URLs above to verify they're running
echo    3. If MongoDB errors persist, start it manually as admin
echo    4. Start frontend: cd "new frontend" && npm run dev
echo.
pause
