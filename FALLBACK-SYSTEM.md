# AI Fallback System

## Overview
The T21RS DS Animal Models Assistant Tool has a **2-tier fallback system** to ensure consistent service even when primary AI services experience rate limits or downtime.

> **Note:** HuggingFace free Inference API was discontinued in 2026. The system now uses Azure OpenAI with knowledge base fallback.

## Fallback Hierarchy

```
┌─────────────────────────────────────┐
│  1. Azure OpenAI GPT-5.1 (Primary)  │
│     - RAG with PubMed Search        │
│     - Content Verification          │
│     - Citation Validation           │
└──────────────┬──────────────────────┘
               │ Rate Limit / Quota / Unavailable
               ▼
┌─────────────────────────────────────┐
│  2. Knowledge Base Response         │
│     - Domain-specific templates     │
│     - Curated model information     │
│     - Always available              │
└─────────────────────────────────────┘
```

## Tier 1: Azure OpenAI (Primary)

**Service:** Azure OpenAI GPT-5.1  
**Endpoint:** `http://localhost:3002/api/chat`  
**Features:**
- Advanced RAG (Retrieval-Augmented Generation) with PubMed
- Fetches 8 relevant papers per query
- Author/year verification (±1 year tolerance)
- Content verification with abstract matching
- Warns when content match < 30%
- 20-31 verified citations per response

**Rate Limits:**
- Azure has quota limits on API calls
- When exceeded, automatically failover to Knowledge Base

## Tier 2: Knowledge Base (Fallback)

**Service:** Built-in `simulateLLMResponse()`  
**Data Source:** Curated domain-specific templates

**Features:**
- Pre-written responses for common queries
- Ts65Dn, Tc1, Dp(16), Dp(17) model information
- RRID references
- Morris water maze information
- ARRIVE guidelines
- Always available (offline-capable)

**Activation Triggers:**
- Azure OpenAI returns 429 (rate limit)
- Response contains "rate limit", "quota", or "429"
- Backend unavailable
- Network errors

**User Notification:**
```
⚠️ Azure OpenAI rate limit reached.

_Using curated knowledge base response:_
---
[Knowledge base response]
```

## Deprecated: HuggingFace (Tier 2)

**Status:** ❌ Discontinued  
**Reason:** HuggingFace free Inference API was deprecated in 2026 (returns 410 Gone)

Previously used:
- Model: `mistralai/Mistral-7B-Instruct-v0.3`
- Free tier inference API
- Instruction-following capabilities

The system now skips this tier and goes directly to Knowledge Base fallback.

## Error Handling Flow

```javascript
try {
  // Try Azure OpenAI
  const response = await fetch(backendUrl, { ... });
  
  if (response.status === 429 || errorMessage.includes('rate limit')) {
    // Use knowledge base directly
    return simulateLLMResponse(userMessage);
  }
  
} catch (error) {
  // Final fallback: knowledge base
  return simulateLLMResponse(userMessage);
}
```

## Setup Instructions

### 1. Azure OpenAI (Primary)
```bash
# backend/.env
AZURE_OPENAI_API_KEY=your_azure_key
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-15-preview
NCBI_API_KEY=your_ncbi_key  # For PubMed searches
```

### 2. Knowledge Base (No Setup Required)
Built-in, always available. No configuration needed.

## Testing Fallback System

### Test Rate Limit Fallback:
```bash
# Temporarily simulate Azure rate limit
# In backend/server.js, add before the chat endpoint:
app.post('/api/chat', async (req, res) => {
  return res.status(429).json({ 
    error: 'Rate limit exceeded',
    message: 'Rate limit exceeded' 
  });
});

# Query the chat - should see knowledge base response with warning message
```

### Test Backend Unavailable:
```bash
# Stop the backend server
# Frontend should automatically use knowledge base fallback
```

## Monitoring

The system logs fallback events to console:

```
[Chat] Azure OpenAI rate limit detected
[Chat] Using knowledge base fallback...
```

Or:

```
[Chat] Backend unavailable
[Chat] Using knowledge-base fallback
```

## Performance Comparison

| Tier | Response Time | Quality | Citations | Cost |
|------|---------------|---------|-----------|------|
| Azure OpenAI | 8-15s | Excellent | 20-31 verified | $$$ |
| Knowledge Base | <100ms | Basic | Pre-written | Free |

## Best Practices

1. **Monitor Azure Usage:** Check Azure portal for quota consumption  
2. **Update Knowledge Base:** Regularly update templates with latest research  
3. **User Communication:** Clear messaging when using fallbacks  
4. **Cache Responses:** Consider caching common queries to reduce API calls

## Future Enhancements

- [ ] Add Anthropic Claude as alternative Tier 1 provider
- [ ] Implement local LLM (Ollama) for offline mode  
- [ ] Add caching layer to reduce API calls  
- [ ] Rate limit prediction and proactive switching  
- [ ] User preference for preferred AI service  
- [ ] Integrate with OpenRouter for multi-provider fallback
