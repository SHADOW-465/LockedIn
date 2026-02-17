@echo off
REM ============================================================
REM Mistral-7B-Instruct Setup for LockedIn (Windows)
REM ============================================================
REM This script sets up Mistral-7B-Instruct-v0.3 with Ollama
REM Optimized for CPU inference on i7 7th gen / Ryzen 3 7000u
REM ============================================================

echo.
echo 🔧 Setting up Mistral-7B-Instruct for LockedIn...
echo.

REM Check if Ollama is installed
where ollama >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Ollama not found. Please install from: https://ollama.com/download
    echo.
    echo After installation, run this script again.
    pause
    exit /b 1
)

echo ✅ Ollama found
echo.

REM Start Ollama service in background
echo 🚀 Starting Ollama service...
start /B ollama serve
timeout /t 3 /nobreak >nul

REM Pull Mistral-7B-Instruct (Q4_K_M quantization)
echo.
echo 📥 Downloading Mistral-7B-Instruct-v0.3 (Q4 quantized, ~4GB)...
echo ⏱️  This may take 5-10 minutes depending on your internet speed...
echo.
ollama pull mistral:7b-instruct-v0.3-q4_K_M

REM Test the model
echo.
echo 🧪 Testing Mistral-7B with a sample prompt...
ollama run mistral:7b-instruct-v0.3-q4_K_M "You are a cruel AI Master. Generate a brief punishment task for a slave who failed to complete their assignment."

echo.
echo ✅ Mistral-7B-Instruct setup complete!
echo.
echo 📊 Model Stats:
echo    - Size: ~4GB (Q4 quantized)
echo    - Speed: ~10-15 tokens/second on i7 7th gen
echo    - RAM Usage: ~4-5GB during inference
echo.
echo 💡 Next steps:
echo    1. Ensure Ollama is running: ollama serve
echo    2. Test API: curl http://localhost:11434/v1/models
echo    3. Run your Next.js app: npm run dev
echo.
echo 🔗 Ollama API will be available at: http://localhost:11434
echo.
pause
