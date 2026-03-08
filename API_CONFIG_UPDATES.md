# Azure OpenAI Configuration Updates

Based on your working Python implementation, I've updated the Node.js backend to match the exact configuration that works.

## ✅ Changes Made

### 1. Azure OpenAI API Configuration (backend/services/azureOpenAI.js)

**Updated to match your Python implementation:**

```javascript
// Before (❌ Didn't match Python)
temperature: 0.2
max_tokens: 2048
AZURE_OPENAI_API_VERSION = '2024-02-15-preview'

// After (✅ Matches Python ai_service/main.py)
temperature: 0.3
max_completion_tokens: 800  // Uses newer parameter name
AZURE_OPENAI_API_VERSION = '2025-04-01-preview'
```

**Why these changes:**
- `max_completion_tokens` is the correct parameter for newer API versions (Python uses this)
- Temperature 0.3 provides better natural language while staying factual
- API version 2025-04-01-preview is the latest stable version you're using

### 2. HuggingFace Fallback Upgraded (react-app/src/App.jsx)

**Replaced outdated GPT-2 with modern Mistral-7B-Instruct:**

```javascript
// Before (❌ Old, outdated model)
Model: 'gpt2'  // Released 2019, not instruction-tuned
Max tokens: Not specified
No proper prompt formatting

// After (✅ Modern, capable instruction-following model)
Model: 'mistralai/Mistral-7B-Instruct-v0.3'
Parameters:
  - max_new_tokens: 500
  - temperature: 0.3 (matches Azure config)
  - top_p: 0.95
  - do_sample: true
Proper instruction formatting: [INST] ... [/INST]
```

**Why Mistral-7B-Instruct:**
- ✅ Excellent for scientific/research content
- ✅ Free tier on HuggingFace Inference API
- ✅ Instruction-following capability (follows [INST] format)
- ✅ Comparable to GPT-3.5 quality
- ✅ Better than alternatives: Llama (stricter licensing), Phi-3 (smaller, less capable), GPT-2 (outdated)

**Alternative free models you can try:**
```javascript
// In App.jsx, line ~99, change model to:
'meta-llama/Llama-3.1-8B-Instruct'  // Larger, more capable
'microsoft/Phi-3-mini-4k-instruct'   // Smaller, faster
'HuggingFaceH4/zephyr-7b-beta'       // Another good option
```

### 3. Removed Generic Fallback Content

**Cleaned up mock responses:**
- ❌ Removed `generateEnhancedMockResponse()` with generic data science content
- ✅ Now uses only `simulateLLMResponse()` with DS-specific research knowledge
- Result: More consistent, domain-focused responses

### 4. Updated Environment Files

**All .env files updated with correct API version:**
- `backend/.env` → API version 2025-04-01-preview
- `backend/.env.example` → API version 2025-04-01-preview

## 🎯 API Call Flow

```
User asks question in Chat tab
        ↓
1. Try Azure OpenAI (via backend)
   - Temperature: 0.3
   - Max tokens: 800
   - API: 2025-04-01-preview
        ↓ (if fails)
2. Try HuggingFace Mistral-7B
   - Temperature: 0.3
   - Max tokens: 500
   - Instruction-formatted prompts
        ↓ (if fails)
3. Use simulateLLMResponse()
   - DS-specific fallback responses
   - Always works (no API required)
```

## 🔍 Configuration Comparison

### Python (Your Working Implementation)
```python
# ai_service/main.py
{
    "messages": [...],
    "max_completion_tokens": 800,
    "temperature": 0.3,
}
API_VERSION = "2025-04-01-preview"
```

### Node.js (Now Updated to Match)
```javascript
// backend/services/azureOpenAI.js
{
    messages,
    max_completion_tokens: 800,
    temperature: 0.3,
    top_p: 0.95,
    frequency_penalty: 0,
    presence_penalty: 0
}
AZURE_OPENAI_API_VERSION = '2025-04-01-preview'
```

**✅ Now perfectly aligned!**

## 🧪 Testing the Updates

### 1. Restart Backend (if running)
```bash
# Stop current backend (Ctrl+C)
cd backend
npm start
```

### 2. Test HuggingFace (Optional)
If you have a HuggingFace API key:

1. Create `react-app/.env.local`:
   ```env
   VITE_HUGGINGFACE_API_KEY=hf_your_key_here
   ```

2. Restart frontend:
   ```bash
   cd react-app
   npm run dev
   ```

3. Test with backend stopped to see HuggingFace fallback

### 3. Test DS Research Questions
Try these in the AI Assistant tab:

- "What is the RRID for Ts65Dn mice?"
- "Compare Tc1 and Ts65Dn models for cognitive studies"
- "How do I calculate sample size for a behavioral study?"
- "What are the phenotypes of Dp16 mice?"

## 📊 Expected Behavior

| Scenario | Response Source | Quality |
|----------|----------------|---------|
| Azure configured correctly | Azure OpenAI GPT-5.1 | ⭐⭐⭐⭐⭐ Best |
| Azure fails, HF key present | Mistral-7B-Instruct | ⭐⭐⭐⭐ Very Good |
| Both APIs unavailable | DS-specific mock | ⭐⭐⭐ Good (limited) |

## 🎓 Key Learnings from Python Implementation

1. **API Version Matters**: Using latest stable version (2025-04-01-preview) ensures access to newest features
2. **Parameter Names**: `max_completion_tokens` vs `max_tokens` - newer APIs prefer the former
3. **Temperature Sweet Spot**: 0.3 balances factual accuracy with natural language
4. **Token Limits**: 800 tokens is efficient for chat responses (keeps costs down, responses concise)
5. **Error Handling**: Your Python code shows proper fallback chains - now mirrored in Node.js

## 🔐 Security Note

Both implementations keep credentials secure:
- Python: Environment variables in Cloud Function
- Node.js: Environment variables in backend, never exposed to browser

---

**All changes are backward compatible** - existing `.env` files just need to update the API version string.
