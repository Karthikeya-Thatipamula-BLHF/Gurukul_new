@echo off
echo ========================================
echo   Backing Up Individual .env Files
echo   Before Centralized Configuration
echo ========================================
echo.

REM Create backup directory with timestamp
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_DIR=env_backup_%TIMESTAMP%

echo Creating backup directory: %BACKUP_DIR%
mkdir "%BACKUP_DIR%"

echo.
echo 📁 Backing up individual .env files...

REM Backup each service's .env file
if exist "Base_backend\.env" (
    echo   ✅ Backing up Base_backend/.env
    copy "Base_backend\.env" "%BACKUP_DIR%\Base_backend.env"
)

if exist "api_data\.env" (
    echo   ✅ Backing up api_data/.env
    copy "api_data\.env" "%BACKUP_DIR%\api_data.env"
)

if exist "Financial_simulator\.env" (
    echo   ✅ Backing up Financial_simulator/.env
    copy "Financial_simulator\.env" "%BACKUP_DIR%\Financial_simulator.env"
)

if exist "memory_management\.env" (
    echo   ✅ Backing up memory_management/.env
    copy "memory_management\.env" "%BACKUP_DIR%\memory_management.env"
)

if exist "akash\.env" (
    echo   ✅ Backing up akash/.env
    copy "akash\.env" "%BACKUP_DIR%\akash.env"
)

if exist "dedicated_chatbot_service\.env" (
    echo   ✅ Backing up dedicated_chatbot_service/.env
    copy "dedicated_chatbot_service\.env" "%BACKUP_DIR%\dedicated_chatbot_service.env"
)

if exist "orchestration\unified_orchestration_system\.env" (
    echo   ✅ Backing up orchestration/.env
    copy "orchestration\unified_orchestration_system\.env" "%BACKUP_DIR%\orchestration.env"
)

echo.
echo ✅ Backup completed successfully!
echo 📁 Backup location: %BACKUP_DIR%
echo.
echo 📋 Next steps:
echo   1. Verify centralized .env file is working
echo   2. Test all services with centralized configuration
echo   3. If everything works, you can safely delete individual .env files
echo   4. Keep this backup for rollback if needed
echo.
pause
