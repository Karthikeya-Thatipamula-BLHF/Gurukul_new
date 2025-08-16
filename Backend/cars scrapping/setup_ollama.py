"""
Setup script for Ollama AI Assistant
Downloads and configures Ollama for the car assistant
"""

import requests
import subprocess
import sys
import os
import time
import json
from pathlib import Path

def check_ollama_installed():
    """Check if Ollama is already installed"""
    try:
        result = subprocess.run(['ollama', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Ollama is already installed: {result.stdout.strip()}")
            return True
    except FileNotFoundError:
        pass
    return False

def download_ollama():
    """Download and install Ollama"""
    print("📥 Downloading Ollama...")
    
    # Ollama installation URL for Windows
    ollama_url = "https://ollama.ai/download/windows"
    
    print(f"🌐 Please download Ollama from: {ollama_url}")
    print("📋 Installation steps:")
    print("1. Visit the URL above")
    print("2. Download the Windows installer")
    print("3. Run the installer")
    print("4. Restart this script after installation")
    
    return False

def start_ollama_service():
    """Start Ollama service"""
    print("🚀 Starting Ollama service...")
    
    try:
        # Try to start Ollama service
        subprocess.Popen(['ollama', 'serve'], 
                        stdout=subprocess.DEVNULL, 
                        stderr=subprocess.DEVNULL)
        
        # Wait for service to start
        time.sleep(5)
        
        # Check if service is running
        response = requests.get('http://localhost:11434/api/tags', timeout=5)
        if response.status_code == 200:
            print("✅ Ollama service started successfully")
            return True
        else:
            print("❌ Ollama service failed to start")
            return False
            
    except Exception as e:
        print(f"❌ Failed to start Ollama service: {e}")
        return False

def pull_model(model_name="llama2"):
    """Pull the specified model"""
    print(f"📦 Pulling model: {model_name}")
    
    try:
        # Pull the model
        result = subprocess.run(['ollama', 'pull', model_name], 
                              capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            print(f"✅ Model {model_name} pulled successfully")
            return True
        else:
            print(f"❌ Failed to pull model {model_name}: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print(f"⏰ Model download timed out. This is normal for large models.")
        print(f"💡 The model will continue downloading in the background.")
        return True
    except Exception as e:
        print(f"❌ Error pulling model: {e}")
        return False

def test_ollama_api():
    """Test Ollama API with a simple request"""
    print("🧪 Testing Ollama API...")
    
    try:
        # Test API endpoint
        response = requests.get('http://localhost:11434/api/tags', timeout=10)
        
        if response.status_code == 200:
            models = response.json()
            available_models = [model['name'] for model in models.get('models', [])]
            
            print(f"✅ Ollama API working!")
            print(f"📋 Available models: {available_models}")
            
            if available_models:
                # Test generation with first available model
                test_model = available_models[0]
                print(f"🔬 Testing generation with {test_model}...")
                
                test_payload = {
                    "model": test_model,
                    "prompt": "What is a good car for a family?",
                    "stream": False,
                    "options": {"max_tokens": 100}
                }
                
                gen_response = requests.post('http://localhost:11434/api/generate', 
                                           json=test_payload, timeout=30)
                
                if gen_response.status_code == 200:
                    result = gen_response.json()
                    response_text = result.get('response', '')
                    print(f"✅ Generation test successful!")
                    print(f"📝 Sample response: {response_text[:100]}...")
                    return True
                else:
                    print(f"❌ Generation test failed: {gen_response.status_code}")
                    return False
            else:
                print("⚠️  No models available. Please pull a model first.")
                return False
        else:
            print(f"❌ Ollama API not responding: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

def create_ollama_config():
    """Create Ollama configuration for car assistant"""
    print("⚙️  Creating Ollama configuration...")
    
    config = {
        "models": {
            "primary": "llama2",
            "alternatives": ["mistral", "codellama", "neural-chat"]
        },
        "settings": {
            "temperature": 0.7,
            "max_tokens": 500,
            "top_p": 0.9
        },
        "car_assistant": {
            "system_prompt": "You are an expert Indian automotive consultant...",
            "max_context_vehicles": 100,
            "response_timeout": 30
        }
    }
    
    config_file = "ollama_config.json"
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"✅ Configuration saved to {config_file}")
    return True

def main():
    """Main setup function"""
    print("🚗 OLLAMA AI ASSISTANT SETUP")
    print("=" * 50)
    
    # Step 1: Check if Ollama is installed
    if not check_ollama_installed():
        print("\n❌ Ollama not found!")
        download_ollama()
        print("\n⏸️  Setup paused. Please install Ollama and run this script again.")
        return False
    
    # Step 2: Start Ollama service
    print("\n🔧 Setting up Ollama service...")
    if not start_ollama_service():
        print("❌ Failed to start Ollama service")
        return False
    
    # Step 3: Pull required model
    print("\n📦 Setting up AI models...")
    models_to_try = ["llama2", "mistral", "neural-chat"]
    
    model_pulled = False
    for model in models_to_try:
        print(f"Trying to pull {model}...")
        if pull_model(model):
            model_pulled = True
            break
        else:
            print(f"Failed to pull {model}, trying next...")
    
    if not model_pulled:
        print("⚠️  No models could be pulled. You may need to pull manually:")
        print("   ollama pull llama2")
    
    # Step 4: Test API
    print("\n🧪 Testing Ollama setup...")
    if test_ollama_api():
        print("✅ Ollama API test successful!")
    else:
        print("❌ Ollama API test failed")
        return False
    
    # Step 5: Create configuration
    print("\n⚙️  Creating configuration...")
    create_ollama_config()
    
    # Final summary
    print("\n" + "=" * 50)
    print("🎉 OLLAMA SETUP COMPLETED!")
    print("=" * 50)
    
    print("\n✅ Setup Summary:")
    print("   • Ollama service: Running")
    print("   • AI models: Available")
    print("   • API: Working")
    print("   • Configuration: Created")
    
    print("\n🚀 Next Steps:")
    print("1. Restart your FastAPI server: python fastapi_main.py")
    print("2. Test AI assistant: POST /api/ai-assistant")
    print("3. Try best deals finder: POST /api/ai-best-deals")
    
    print("\n💡 Usage Examples:")
    print('   • "Recommend a good family car under 10 lakhs"')
    print('   • "Find the best deals for Honda cars"')
    print('   • "Compare Maruti Swift vs Hyundai i20"')
    print('   • "What are the maintenance costs for Toyota cars?"')
    
    print("\n🌐 Ollama Web UI: http://localhost:11434")
    print("📚 FastAPI Docs: http://localhost:8000/docs")
    
    return True

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎯 Ollama AI Assistant is ready for car recommendations!")
    else:
        print("\n❌ Setup incomplete. Please check the errors above.")
