#!/bin/bash

echo "========================================"
echo "   Gurukul Application - Dependency Installer"
echo "========================================"
echo ""

echo "[*] Checking for Python installation..."
python3 --version
if [ $? -ne 0 ]; then
    echo "[!] Python is not installed or not in PATH. Please install Python 3.9+ and try again."
    exit 1
fi

echo "[*] Checking for pip installation..."
pip3 --version
if [ $? -ne 0 ]; then
    echo "[!] pip is not installed or not in PATH. Please install pip and try again."
    exit 1
fi

echo "[*] Upgrading pip..."
python3 -m pip install --upgrade pip

echo "[*] Installing common missing dependencies..."
pip3 install python-dotenv pymongo pyttsx3 PyMuPDF easyocr google-generativeai agentops

echo "[*] Installing TTS service dependencies..."
pip3 install pyttsx3 pypiwin32 comtypes

echo "[*] Installing database dependencies..."
pip3 install pymongo motor redis

echo "[*] Installing web framework dependencies..."
pip3 install fastapi uvicorn pydantic requests flask flask-cors gunicorn

echo "[*] Installing AI and ML dependencies..."
pip3 install torch torchvision torchaudio transformers sentence-transformers easyocr google-generativeai agentops

echo "[*] Installing LangChain dependencies..."
pip3 install langchain langchain-groq langchain-community langgraph langchain-openai langchain-google-genai

echo "[*] Installing vector search dependencies..."
pip3 install faiss-cpu chromadb pinecone-client weaviate-client

echo "[*] Installing all remaining dependencies from requirements.txt..."
cd Backend
pip3 install -r requirements.txt
cd ..

echo ""
echo "========================================"
echo "[✓] Dependency installation complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Activate your virtual environment (if using one)"
echo "2. Navigate to the Backend directory: cd Backend"
echo "3. Start all services: ./start_all_services.sh"
echo "4. Check service health at http://localhost:8000/health"
echo ""
echo "If you encounter any issues, please refer to TROUBLESHOOTING.md"
echo ""

read -p "Press Enter to continue..."