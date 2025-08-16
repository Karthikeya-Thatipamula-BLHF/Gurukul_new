#!/bin/bash

echo "========================================"
echo "   Gurukul Application - Fix Missing Dependencies"
echo "========================================"
echo ""

echo "[*] Installing missing dependencies identified in error logs..."

echo "[*] Installing python-dotenv (for environment variables)..."
pip3 install python-dotenv

echo "[*] Installing pymongo (for database connections)..."
pip3 install pymongo

echo "[*] Installing pyttsx3 (for TTS service)..."
pip3 install pyttsx3

echo "[*] Installing PyMuPDF (for PDF processing)..."
pip3 install PyMuPDF

echo "[*] Installing easyocr (for OCR functionality)..."
pip3 install easyocr

echo "[*] Installing google-generativeai (for Google AI services)..."
pip3 install google-generativeai

echo "[*] Installing agentops (for Financial Simulator)..."
pip3 install agentops

echo ""
echo "========================================"
echo "[✓] Missing dependencies installed!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Try running the services again: cd Backend && ./start_all_services.sh"
echo "2. If you still encounter issues, run the full installer: ./install_dependencies.sh"
echo "3. For more detailed troubleshooting, refer to TROUBLESHOOTING.md"
echo ""

read -p "Press Enter to continue..."