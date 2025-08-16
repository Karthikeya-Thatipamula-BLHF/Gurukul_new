# Gurukul Application Troubleshooting Guide

## Common Dependency Issues

The Gurukul application relies on several Python packages that may need to be installed manually if you encounter errors when starting the services.

### Missing Python Modules

If you see errors like `ModuleNotFoundError: No module named 'xxx'` when starting the services, you need to install the missing dependencies.

#### Common Missing Dependencies

- `python-dotenv`: Used for loading environment variables
- `pymongo`: MongoDB client for Python
- `pyttsx3`: Text-to-speech library
- `fitz` (PyMuPDF): PDF processing library
- `easyocr`: OCR library for image text extraction
- `google-generativeai`: Google's Generative AI client
- `agentops`: Agent operations library for Financial Simulator
- `config`: Configuration module for various services

### Installation Solutions

#### Option 1: Install Individual Packages

```bash
# Install common missing dependencies
pip install python-dotenv pymongo pyttsx3 PyMuPDF easyocr google-generativeai agentops
```

#### Option 2: Install All Requirements

```bash
# Navigate to the Backend directory
cd Backend

# Install all dependencies from requirements.txt
pip install -r requirements.txt
```

## Service-Specific Issues

### TTS Service

If you encounter issues with the TTS service:

```bash
pip install pyttsx3 pypiwin32 comtypes
```

### Base Backend and API Data Service

If you encounter issues with PDF processing or OCR:

```bash
pip install PyMuPDF easyocr
```

### Memory Management

If you encounter issues with database connections:

```bash
pip install pymongo motor
```

### Multiple Services (Orchestration, Subject Generation, Akash, Financial Simulator)

If you encounter issues with environment variables or AI services:

```bash
pip install python-dotenv google-generativeai agentops
```

## Environment Setup

### Virtual Environment

It's recommended to use a virtual environment to avoid dependency conflicts:

```bash
# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# On Windows
.venv\Scripts\Activate.ps1

# On Linux/Mac
source .venv/bin/activate

# Install dependencies
pip install -r Backend/requirements.txt
```

## Starting Services

After resolving dependency issues, you can start the services:

```bash
# Navigate to the Backend directory
cd Backend

# Start all services
.\start_all_services.bat  # Windows
./start_all_services.sh   # Linux/Mac
```

## Checking Service Health

You can check the health of each service by accessing their health endpoints:

- Base Backend: http://localhost:8000/health
- API Data Service: http://localhost:8001/health
- Financial Simulator: http://localhost:8002/health
- Memory Management API: http://localhost:8003/memory/health
- Akash Service: http://localhost:8004/health
- Subject Generation: http://localhost:8005/health
- Wellness API: http://localhost:8006/
- TTS Service: http://localhost:8007/api/health

## Common Error Messages and Solutions

### ModuleNotFoundError: No module named 'dotenv'

**Solution**: Install the python-dotenv package
```bash
pip install python-dotenv
```

### ModuleNotFoundError: No module named 'pymongo'

**Solution**: Install the pymongo package
```bash
pip install pymongo
```

### ModuleNotFoundError: No module named 'pyttsx3'

**Solution**: Install the pyttsx3 package and its dependencies
```bash
pip install pyttsx3 pypiwin32 comtypes
```

### ModuleNotFoundError: No module named 'fitz'

**Solution**: Install the PyMuPDF package
```bash
pip install PyMuPDF
```

### ModuleNotFoundError: No module named 'easyocr'

**Solution**: Install the easyocr package
```bash
pip install easyocr
```

### ModuleNotFoundError: No module named 'google'

**Solution**: Install the google-generativeai package
```bash
pip install google-generativeai
```

### ModuleNotFoundError: No module named 'agentops'

**Solution**: Install the agentops package
```bash
pip install agentops
```

### ModuleNotFoundError: No module named 'config'

**Solution**: This is likely a local module issue. Check that the config directory is in your Python path or that you're running the script from the correct directory.

## Advanced Troubleshooting

### Python Version Compatibility

The Gurukul application is designed to work with Python 3.9+. If you're using a different version, you might encounter compatibility issues.

### Checking Installed Packages

To check which packages are installed in your environment:

```bash
pip list
```

### Upgrading pip

If you see a notice about a new pip version, you can upgrade it:

```bash
python -m pip install --upgrade pip
```

## Contact Support

If you continue to experience issues after trying these solutions, please contact the Gurukul support team with details about the errors you're encountering.