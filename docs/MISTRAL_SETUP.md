# Mistral-7B-Instruct Setup Guide

## Quick Start (Windows)

1. **Install Ollama:**
   - Download from: https://ollama.com/download/windows
   - Run the installer
   - Restart your terminal

2. **Run Setup Script:**
   ```powershell
   cd c:\Users\acer\Documents\projects\LockedIn
   .\scripts\setup-mistral.bat
   ```

3. **Test the Model:**
   ```powershell
   ollama run mistral:7b-instruct-v0.3-q4_K_M "You are a cruel AI Master in a BDSM app. Create a short punishment task."
   ```

## Manual Setup

If you prefer manual setup:

```powershell
# Start Ollama
ollama serve

# Pull Mistral-7B (in another terminal)
ollama pull mistral:7b-instruct-v0.3-q4_K_M

# Verify it's running
ollama list
```

## Performance Specs

**On your hardware (i7 7th gen / Ryzen 3 7000u):**
- **Speed:** ~10-15 tokens/second
- **RAM Usage:** ~4-5GB during inference
- **Model Size:** ~4GB download
- **Quality:** ⭐⭐⭐⭐⭐ (Excellent for creative, entertaining responses)

## Why Mistral-7B?

✅ **Superior quality** over smaller models  
✅ **Creative and varied** outputs (not boring!)  
✅ **Excellent persona adherence** for AI Master roleplay  
✅ **Better instruction following** for complex tasks  
✅ **Optimized Q4 quantization** for CPU inference

## Troubleshooting

**Issue: "Ollama not found"**
- Solution: Install from https://ollama.com/download/windows

**Issue: Model downloading slowly**
- Solution: Normal for 4GB file, wait ~5-10 minutes

**Issue: High RAM usage**
- Solution: Expected; close other apps if needed

**Issue: Slow generation**
- Solution: 10-15 tok/sec is normal for CPU; quality over speed

## API Usage

The local API runs at: `http://localhost:11434`

Test with curl:
```bash
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral:7b-instruct-v0.3-q4_K_M",
    "messages": [{"role": "user", "content": "Generate a punishment task"}]
  }'
```

## Next Steps

1. Ensure Ollama is running: `ollama serve`
2. Start your Next.js app: `npm run dev`
3. The app will automatically use Mistral for local AI generation
4. Falls back to Gemini Cloud if Mistral is unavailable
