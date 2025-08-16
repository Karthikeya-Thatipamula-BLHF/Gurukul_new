@echo off
echo ========================================
echo    Gurukul Application - Dependency Installer
echo ========================================
echo.

echo [*] Checking for Python installation...
python --version
if %ERRORLEVEL% NEQ 0 (
    echo [!] Python is not installed or not in PATH. Please install Python 3.9+ and try again.
    exit /b 1
)

echo [*] Checking for pip installation...
pip --version
if %ERRORLEVEL% NEQ 0 (
    echo [!] pip is not installed or not in PATH. Please install pip and try again.
    exit /b 1
)

echo [*] Upgrading pip...
python -m pip install --upgrade pip

echo [*] Installing common missing dependencies...
pip install python-dotenv pymongo pyttsx3 PyMuPDF easyocr google-generativeai agentops

echo [*] Installing TTS service dependencies...
pip install pyttsx3 pypiwin32 comtypes

echo [*] Installing database dependencies...
pip install pymongo motor redis

echo [*] Installing web framework dependencies...
pip install fastapi uvicorn pydantic requests flask flask-cors gunicorn

echo [*] Installing AI and ML dependencies...
pip install torch torchvision torchaudio transformers sentence-transformers easyocr google-generativeai agentops

echo [*] Installing LangChain dependencies...
pip install langchain langchain-groq langchain-community langgraph langchain-openai langchain-google-genai

echo [*] Installing vector search dependencies...
pip install faiss-cpu chromadb pinecone-client weaviate-client

echo [*] Installing all remaining dependencies from requirements.txt...
cd Backend
pip install -r requirements.txt
cd ..

echo.
echo ========================================
echo [✓] Dependency installation complete!
echo ========================================
echo.
echo Next steps:
echo 1. Activate your virtual environment (if using one)
echo 2. Navigate to the Backend directory: cd Backend
echo 3. Start all services: .\start_all_services.bat
echo 4. Check service health at http://localhost:8000/health
echo.
echo If you encounter any issues, please refer to TROUBLESHOOTING.md
echo.

pause