#!/bin/bash

# ============================================================
# Mistral-7B-Instruct Setup for LockedIn
# ============================================================
# This script sets up Mistral-7B-Instruct-v0.3 with Ollama
# Optimized for CPU inference on i7 7th gen / Ryzen 3 7000u
# ============================================================

echo "🔧 Setting up Mistral-7B-Instruct for LockedIn..."

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama not found. Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
    echo "✅ Ollama installed successfully"
fi

# Start Ollama service
echo "🚀 Starting Ollama service..."
ollama serve &
sleep 3

# Pull Mistral-7B-Instruct (Q4_K_M quantization for CPU optimization)
echo "📥 Downloading Mistral-7B-Instruct-v0.3 (Q4 quantized, ~4GB)..."
echo "⏱️  This may take 5-10 minutes depending on your internet speed..."
ollama pull mistral:7b-instruct-v0.3-q4_K_M

# Test the model
echo ""
echo "🧪 Testing Mistral-7B with a sample prompt..."
ollama run mistral:7b-instruct-v0.3-q4_K_M "You are a cruel AI Master. Generate a brief punishment task for a slave who failed to complete their assignment." --verbose

echo ""
echo "✅ Mistral-7B-Instruct setup complete!"
echo ""
echo "📊 Model Stats:"
echo "   - Size: ~4GB (Q4 quantized)"
echo "   - Speed: ~10-15 tokens/second on i7 7th gen"
echo "   - RAM Usage: ~4-5GB during inference"
echo ""
echo "💡 Next steps:"
echo "   1. Ensure Ollama is running: ollama serve"
echo "   2. Test API: curl http://localhost:11434/v1/models"
echo "   3. Run your Next.js app: npm run dev"
echo ""
echo "🔗 Ollama API will be available at: http://localhost:11434"
