@echo off
echo ========================================
echo    Gurukul Application - Fix Missing Dependencies
echo ========================================
echo.

echo [*] Installing missing dependencies identified in error logs...

echo [*] Installing python-dotenv (for environment variables)...
pip install python-dotenv

echo [*] Installing pymongo (for database connections)...
pip install pymongo

echo [*] Installing pyttsx3 (for TTS service)...
pip install pyttsx3

echo [*] Installing PyMuPDF (for PDF processing)...
pip install PyMuPDF

echo [*] Installing easyocr (for OCR functionality)...
pip install easyocr

echo [*] Installing google-generativeai (for Google AI services)...
pip install google-generativeai

echo [*] Installing agentops (for Financial Simulator)...
pip install agentops

echo.
echo ========================================
echo [✓] Missing dependencies installed!
echo ========================================
echo.
echo Next steps:
echo 1. Try running the services again: cd Backend && .\start_all_services.bat
echo 2. If you still encounter issues, run the full installer: .\install_dependencies.bat
echo 3. For more detailed troubleshooting, refer to TROUBLESHOOTING.md
echo.

pause