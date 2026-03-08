# Semantic Content Verification

## Overview

The DS Research Assistant now includes **semantic content verification** to detect when citations may not support the claims being made. This helps catch:
- Wrong paper citations
- Misattributed findings  
- Out-of-context citations

## How It Works

### Hybrid Verification Approach

The system uses a **two-tier hybrid approach**:

1. **Keyword Matching (40%)**: Fast, interpretable term-based matching
2. **Semantic Embeddings (60%)**: Deep semantic understanding using Azure OpenAI embeddings

When embeddings are unavailable, the system gracefully falls back to keyword-only matching.

### Verification Process

For each citation in the AI response:

1. **Extract Claim Context** - 200 characters before/after the citation
2. **Fetch Abstract** - Retrieve the paper's abstract from PubMed
3. **Keyword Analysis** - Extract key terms, remove stop words, count matches
4. **Semantic Analysis** (if configured) - Generate embeddings, calculate cosine similarity
5. **Hybrid Score** - Combine both metrics for final content match percentage
6. **Flag Warnings** - Citations below 30% threshold are flagged for review

## Configuration

### Required for Embeddings

Add to your backend `.env` file:

```bash
# Azure OpenAI Embedding Configuration
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-ada-002
# or use newer model:
# AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-small
```

### Optional (Keyword-Only Fallback)

If embeddings are not configured, the system automatically uses keyword matching only. This still provides good detection of misattributed citations.

## Example Results

### ✅ Correct Citation (High Match)
```
Claim: "Ts65Dn mice show cognitive deficits in Morris water maze"
Citation: Reeves et al., 1995
Result: 85% match (keyword: 75%, semantic: 90%)
Status: ✓ Verified
```

### ⚠️ Wrong Citation (Low Match)  
```
Claim: "Sonic hedgehog agonist increases cerebellar proliferation"
Citation: Reeves et al., 1995 (actually about Ts65Dn chromosome mapping)
Result: 5% match (keyword: 5%, semantic: 7%)
Status: ⚠ Content Warning
```

## User Interface

Low-match citations are displayed with amber warning boxes showing:
- Citation details (author, year, PMID)
- Content match percentage
- Semantic score (if available)
- Warning message
- Claim context for verification

## API Response

Verification results are included in the response:

```json
{
  "response": "AI response with citations...",
  "verification": {
    "totalCitations": 3,
    "verified": 2,
    "invalid": 0,
    "unverifiable": 0,
    "contentWarnings": 1,
    "contentDetails": [
      {
        "pmid": "7550346",
        "author": "Reeves et al.",
        "year": "1995",
        "contentScore": 5,
        "semanticScore": 7,
        "warning": "Content match 5% (semantic: 7%) - verify citation supports claim",
        "context": "Early postnatal Sonic hedgehog..."
      }
    ]
  }
}
```

## Performance

- **Keyword matching**: <100ms per citation
- **Semantic embeddings**: 200-500ms per citation (parallel batch processing)
- **Total overhead**: ~1-2 seconds for typical responses with 3-5 citations

## Threshold

Citations with match scores **below 30%** are flagged as potentially problematic. This threshold can be adjusted in `pubmedVerifier.js`:

```javascript
const contentMatchThreshold = 30; // Adjust as needed (0-100)
```

## Limitations

1. **Abstract availability**: Only works for papers with PubMed abstracts
2. **Context window**: Analyzes 200 characters around citation (configurable)
3. **API rate limits**: NCBI allows 3 requests/second (10/sec with API key)
4. **Embedding costs**: Azure OpenAI charges ~$0.0001 per 1K tokens for embeddings

## Testing

Run the test suite to verify semantic verification:

```bash
cd backend
node test-semantic-verification.js
```

Expected output:
- Test 1: High match for correct citation (>70%)
- Test 2: Low match for wrong citation (<30%) with warning
- Test 3: Medium match for related topic (30-70%)

## Future Enhancements

Potential improvements:
- MeSH term matching for medical concepts
- TF-IDF weighting for keyword scoring  
- PubMedBERT fine-tuned embeddings
- Citation context caching
- Batch embedding requests for efficiency
