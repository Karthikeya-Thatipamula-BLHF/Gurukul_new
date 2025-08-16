@echo off
echo ========================================
echo    Gurukul Frontend Production Deployment
echo ========================================
echo.

REM Set the base directory
set BASE_DIR=%~dp0

REM Check if .env.production file exists
if not exist "%BASE_DIR%.env.production" (
    echo ❌ .env.production file not found!
    echo Please create the .env.production file first.
    pause
    exit /b 1
)

echo ✅ Found .env.production configuration file
echo.

REM Install dependencies
echo 📦 Installing dependencies...
npm install
echo ✅ Installed dependencies
echo.

REM Build for production
echo 🔨 Building for production...
set "NODE_ENV=production"
copy "%BASE_DIR%.env.production" "%BASE_DIR%.env"
npm run build
echo ✅ Build complete
echo.

REM Check if build was successful
if not exist "%BASE_DIR%dist" (
    echo ❌ Build failed! dist directory not found.
    pause
    exit /b 1
)

echo 🚀 Frontend build is ready for deployment!
echo.
echo You can deploy the contents of the dist directory to your web server.
echo.
echo Options for deployment:
echo 1. Firebase: firebase deploy
echo 2. Netlify: netlify deploy --prod
echo 3. Manual: Copy the dist directory to your web server
echo.

REM Ask user which deployment method to use
set /p DEPLOY_METHOD="Select deployment method (1-3, or press Enter to skip): "

if "%DEPLOY_METHOD%"=="1" (
    echo Deploying to Firebase...
    firebase deploy
) else if "%DEPLOY_METHOD%"=="2" (
    echo Deploying to Netlify...
    netlify deploy --prod
) else if "%DEPLOY_METHOD%"=="3" (
    echo Please manually copy the dist directory to your web server.
) else (
    echo Skipping deployment.
)

echo.
echo ✅ Deployment process complete!
echo.

pause