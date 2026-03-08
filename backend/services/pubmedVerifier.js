import axios from 'axios';

/**
 * Verify PMIDs using NCBI E-utilities API with semantic content verification
 * Parses AI responses for PMID links and validates them
 * Fetches abstracts and checks if cited papers support the claims using embeddings
 */

const NCBI_API_KEY = process.env.NCBI_API_KEY;
const NCBI_ESUMMARY_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
const NCBI_EFETCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

// Azure OpenAI configuration for embeddings
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_EMBEDDING_DEPLOYMENT = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-ada-002';

/**
 * Extract all PMIDs from markdown text
 * @param {string} text - Markdown text with potential PMID links
 * @returns {Array} - Array of {pmid, fullMatch, author, year}
 */
function extractPMIDs(text) {
  // Regex to match: ([Author et al., Year](https://pubmed.ncbi.nlm.nih.gov/PMID/))
  // Also handles: ([Author, Year](URL); other citations).
  const pmidRegex = /\[([^\]]+),\s*(\d{4})\]\(https?:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)\/?[^\)]*\)/g;
  const matches = [];
  
  let match;
  while ((match = pmidRegex.exec(text)) !== null) {
    matches.push({
      fullMatch: match[0],  // Just the markdown link [Author, Year](URL)
      author: match[1].trim(),
      year: match[2],
      pmid: match[3],
      startIndex: match.index
    });
  }
  
  return matches;
}

/**
 * Fetch abstract text for PMIDs using EFetch API
 * @param {Array<string>} pmids - Array of PMIDs
 * @returns {Promise<Object>} - Map of PMID -> abstract text
 */
async function fetchAbstracts(pmids) {
  if (pmids.length === 0) {
    return {};
  }

  try {
    const pmidList = pmids.join(',');
    const url = `${NCBI_EFETCH_URL}?db=pubmed&id=${pmidList}&rettype=abstract&retmode=xml${NCBI_API_KEY ? `&api_key=${NCBI_API_KEY}` : ''}`;
    
    console.log(`[Content Verifier] Fetching abstracts for ${pmids.length} PMIDs...`);
    
    const response = await axios.get(url, { timeout: 15000 });
    const xmlData = response.data;
    
    // Parse XML to extract abstracts (simple regex-based extraction)
    const abstracts = {};
    
    for (const pmid of pmids) {
      // Match abstract text between <AbstractText> tags for this PMID
      const pmidRegex = new RegExp(`<PMID[^>]*>${pmid}</PMID>([\\s\\S]*?)<\\/PubmedArticle>`, 'i');
      const pmidMatch = xmlData.match(pmidRegex);
      
      if (pmidMatch) {
        const articleSection = pmidMatch[1];
        const abstractRegex = /<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/gi;
        const abstractTexts = [];
        
        let match;
        while ((match = abstractRegex.exec(articleSection)) !== null) {
          // Remove XML tags and decode entities
          const text = match[1]
            .replace(/<[^>]+>/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/\s+/g, ' ')
            .trim();
          abstractTexts.push(text);
        }
        
        abstracts[pmid] = abstractTexts.join(' ');
        console.log(`[Content Verifier] ✓ Fetched abstract for PMID ${pmid} (${abstracts[pmid].length} chars)`);
      } else {
        abstracts[pmid] = '';
        console.log(`[Content Verifier] ✗ No abstract found for PMID ${pmid}`);
      }
    }
    
    return abstracts;
  } catch (error) {
    console.error('[Content Verifier] EFetch API error:', error.message);
    return {};
  }
}

/**
 * Extract context around a citation (the claim being made)
 * @param {string} text - Full text
 * @param {Object} citation - Citation object with startIndex
 * @param {number} contextChars - Number of characters before/after
 * @returns {string} - Context text
 */
function extractContext(text, citation, contextChars = 200) {
  const start = Math.max(0, citation.startIndex - contextChars);
  const end = Math.min(text.length, citation.startIndex + citation.fullMatch.length + contextChars);
  return text.substring(start, end);
}

/**
 * Extract key terms from text for semantic matching
 * @param {string} text - Text to analyze
 * @returns {Array<string>} - Key terms
 */
function extractKeyTerms(text) {
  // Convert to lowercase
  const lower = text.toLowerCase();
  
  // Remove punctuation and split into words
  const words = lower.replace(/[^\w\s-]/g, ' ').split(/\s+/).filter(w => w.length > 3);
  
  // Common stop words to ignore
  const stopWords = new Set([
    'that', 'this', 'with', 'from', 'have', 'been', 'were', 'their', 'there',
    'these', 'those', 'which', 'would', 'could', 'should', 'about', 'after',
    'before', 'between', 'through', 'during', 'also', 'more', 'some', 'such',
    'than', 'them', 'then', 'they', 'other', 'into', 'only', 'over', 'most',
    'both', 'each', 'make', 'made', 'many', 'much', 'well', 'down', 'even'
  ]);
  
  // Filter out stop words and get unique terms
  const keyTerms = [...new Set(words.filter(w => !stopWords.has(w)))];
  
  return keyTerms;
}

/**
 * Get embedding vector from Azure OpenAI
 * @param {string} text - Text to embed
 * @returns {Promise<Array<number>>} - Embedding vector
 */
async function getEmbedding(text) {
  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
    return null;
  }

  try {
    const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_EMBEDDING_DEPLOYMENT}/embeddings?api-version=2024-02-01`;
    
    const response = await axios.post(url, {
      input: text.substring(0, 8000) // Limit to 8000 chars for embedding
    }, {
      headers: {
        'api-key': AZURE_OPENAI_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.data && response.data.data && response.data.data[0]) {
      return response.data.data[0].embedding;
    }
    
    return null;
  } catch (error) {
    console.error('[Embedding] Error:', error.message);
    return null;
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} vec1 - First vector
 * @param {Array<number>} vec2 - Second vector
 * @returns {number} - Similarity score (0-1)
 */
function cosineSimilarity(vec1, vec2) {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) {
    return 0;
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Calculate content match score between claim and abstract
 * Uses hybrid approach: semantic embeddings (60%) + keyword matching (40%)
 * @param {string} claimContext - Context around citation
 * @param {string} abstract - Paper abstract
 * @returns {Promise<Object>} - {score, matchedTerms, totalTerms, semanticScore}
 */
async function calculateContentMatch(claimContext, abstract) {
  if (!abstract || abstract.length === 0) {
    return { score: 0, matchedTerms: [], totalTerms: 0, semanticScore: 0, warning: 'No abstract available' };
  }
  
  // 1. Keyword matching (fast, interpretable)
  const terms = extractKeyTerms(claimContext);
  const abstractLower = abstract.toLowerCase();
  const matchedTerms = terms.filter(term => abstractLower.includes(term));
  const keywordScore = terms.length > 0 ? matchedTerms.length / terms.length : 0;
  
  // 2. Semantic similarity using embeddings (more accurate for semantic meaning)
  let semanticScore = 0;
  try {
    const [claimEmbedding, abstractEmbedding] = await Promise.all([
      getEmbedding(claimContext),
      getEmbedding(abstract)
    ]);
    
    if (claimEmbedding && abstractEmbedding) {
      semanticScore = cosineSimilarity(claimEmbedding, abstractEmbedding);
    }
  } catch (error) {
    console.error('[Semantic] Error calculating similarity:', error.message);
  }
  
  // 3. Hybrid score: combine keyword (40%) + semantic (60%) if available
  let finalScore;
  if (semanticScore > 0) {
    finalScore = Math.round((keywordScore * 0.4 + semanticScore * 0.6) * 100);
  } else {
    // Fallback to keyword-only if embeddings unavailable
    finalScore = Math.round(keywordScore * 100);
  }
  
  return {
    score: finalScore,
    matchedTerms: matchedTerms.slice(0, 5),
    totalTerms: terms.length,
    semanticScore: Math.round(semanticScore * 100)
  };
}

/**
 * Calculate content match score between claim and abstract (DEPRECATED - replaced with async version above)
 */
function calculateContentMatchSync(claimContext, abstract) {
  if (!abstract || abstract.length === 0) {
    return { score: 0, matchedTerms: [], totalTerms: 0, warning: 'No abstract available' };
  }
  
  // Extract key terms from claim context (excluding the citation itself)
  const terms = extractKeyTerms(claimContext);
  const abstractLower = abstract.toLowerCase();
  
  // Count how many key terms appear in the abstract
  const matchedTerms = terms.filter(term => abstractLower.includes(term));
  
  // Calculate match score (0-1)
  const score = terms.length > 0 ? matchedTerms.length / terms.length : 0;
  
  return {
    score: Math.round(score * 100), // Convert to percentage
    matchedTerms: matchedTerms.slice(0, 5), // Top 5 matched terms
    totalTerms: terms.length
  };
}

/**
 * Verify PMIDs with NCBI E-utilities API
 * @param {Array<string>} pmids - Array of PMIDs to verify
 * @returns {Promise<Object>} - Map of PMID -> {valid, title, authors, year}
 */
async function verifyPMIDsWithNCBI(pmids) {
  if (pmids.length === 0) {
    return {};
  }

  try {
    const pmidList = pmids.join(',');
    const url = `${NCBI_ESUMMARY_URL}?db=pubmed&id=${pmidList}&retmode=json${NCBI_API_KEY ? `&api_key=${NCBI_API_KEY}` : ''}`;
    
    console.log(`[PubMed Verifier] Checking ${pmids.length} PMIDs with NCBI...`);
    
    const response = await axios.get(url, { timeout: 10000 });
    const results = {};
    
    if (response.data && response.data.result) {
      const resultData = response.data.result;
      
      for (const pmid of pmids) {
        if (resultData[pmid] && !resultData[pmid].error) {
          const article = resultData[pmid];
          
          // Extract first author
          const firstAuthor = article.authors && article.authors.length > 0 
            ? article.authors[0].name 
            : 'Unknown';
          
          // Extract year from pubdate
          const pubYear = article.pubdate ? article.pubdate.split(' ')[0] : '';
          
          results[pmid] = {
            valid: true,
            title: article.title || '',
            authors: article.authors || [],
            firstAuthor: firstAuthor,
            year: pubYear,
            journal: article.fulljournalname || article.source || ''
          };
          
          console.log(`[PubMed Verifier] ✓ PMID ${pmid}: ${firstAuthor} (${pubYear})`);
        } else {
          results[pmid] = {
            valid: false,
            error: 'PMID not found in PubMed'
          };
          console.log(`[PubMed Verifier] ✗ PMID ${pmid}: Not found`);
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error('[PubMed Verifier] NCBI API error:', error.message);
    // On error, mark all as unknown (don't remove them, just can't verify)
    const results = {};
    pmids.forEach(pmid => {
      results[pmid] = {
        valid: 'unknown',
        error: 'Could not verify with NCBI API'
      };
    });
    return results;
  }
}

/**
 * Verify and clean AI response containing PMID citations
 * Includes content verification to check if claims match abstracts
 * @param {string} aiResponse - AI response with potential PMID links
 * @returns {Promise<Object>} - {cleanedResponse, verificationReport}
 */
export async function verifyAndCleanResponse(aiResponse) {
  const citations = extractPMIDs(aiResponse);
  
  if (citations.length === 0) {
    console.log('[PubMed Verifier] No PMID citations found in response');
    return {
      cleanedResponse: aiResponse,
      verificationReport: {
        totalCitations: 0,
        verified: 0,
        invalid: 0,
        unverifiable: 0,
        contentWarnings: 0
      }
    };
  }
  
  console.log(`[PubMed Verifier] Found ${citations.length} PMID citations to verify`);
  
  // Get unique PMIDs
  const uniquePMIDs = [...new Set(citations.map(c => c.pmid))];
  
  // Verify with NCBI and fetch abstracts
  const [verificationResults, abstracts] = await Promise.all([
    verifyPMIDsWithNCBI(uniquePMIDs),
    fetchAbstracts(uniquePMIDs)
  ]);
  
  // Build verification report and clean response
  let cleanedResponse = aiResponse;
  let verified = 0;
  let invalid = 0;
  let unverifiable = 0;
  let contentWarnings = 0;
  const contentDetails = [];
  
  // Sort citations by startIndex in reverse order so replacements don't affect indices
  const sortedCitations = [...citations].sort((a, b) => b.startIndex - a.startIndex);
  
  // Process each citation with semantic content verification
  for (const citation of sortedCitations) {
    const result = verificationResults[citation.pmid];
    const abstract = abstracts[citation.pmid] || '';
    
    // Extract context around citation for semantic content matching
    const context = extractContext(aiResponse, citation);
    const contentMatch = await calculateContentMatch(context, abstract);
    
    if (result.valid === true) {
      // Check if year matches (allow ±1 year tolerance for publication delays)
      const citedYear = parseInt(citation.year);
      const actualYear = parseInt(result.year);
      const yearMatch = Math.abs(citedYear - actualYear) <= 1;
      
      // Check if author matches (extract last name from citation)
      const citedAuthor = extractLastName(citation.author);
      const actualAuthor = extractLastName(result.firstAuthor);
      const authorMatch = citedAuthor && actualAuthor && 
                          citedAuthor.toLowerCase() === actualAuthor.toLowerCase();
      
      // Check content match (flag if below 30% - likely wrong paper)
      const contentMatchThreshold = 30;
      const suspiciousContent = contentMatch.score < contentMatchThreshold && abstract.length > 0;
      
      if (yearMatch && authorMatch) {
        if (suspiciousContent) {
          // Valid PMID but content doesn't match - keep hyperlink but flag warning
          console.log(`[Content Verifier] ⚠ Low content match (${contentMatch.score}%, semantic: ${contentMatch.semanticScore}%) for ${citation.author}, ${citation.year} (PMID ${citation.pmid})`);
          console.log(`[Content Verifier]   Claim context: "${context.substring(0, 100)}..."`);
          console.log(`[Content Verifier]   Matched terms: ${contentMatch.matchedTerms.join(', ') || 'none'}`);
          contentWarnings++;
          verified++; // Still technically verified (author/year match)
          
          contentDetails.push({
            pmid: citation.pmid,
            author: citation.author,
            year: citation.year,
            contentScore: contentMatch.score,
            semanticScore: contentMatch.semanticScore,
            warning: `Content match ${contentMatch.score}%${contentMatch.semanticScore ? ` (semantic: ${contentMatch.semanticScore}%)` : ''} - verify citation supports claim`,
            context: context.substring(0, 150)
          });
        } else {
          verified++;
          console.log(`[PubMed Verifier] ✓ Verified: ${citation.author}, ${citation.year} (PMID ${citation.pmid}) - Content: ${contentMatch.score}%${contentMatch.semanticScore ? ` (semantic: ${contentMatch.semanticScore}%)` : ''}`);
        }
      } else {
        // Year or author mismatch - remove hyperlink but keep citation
        if (!yearMatch) {
          console.log(`[PubMed Verifier] ✗ Year mismatch: ${citation.author}, ${citation.year} vs actual ${result.firstAuthor}, ${result.year} (PMID ${citation.pmid})`);
        }
        if (!authorMatch) {
          console.log(`[PubMed Verifier] ✗ Author mismatch: "${citedAuthor}" vs "${actualAuthor}" (PMID ${citation.pmid})`);
        }
        invalid++;
        
        // Replace hyperlinked citation with plain text citation (keep just author, year)
        const plainCitation = `${citation.author}, ${citation.year}`;
        cleanedResponse = cleanedResponse.replace(citation.fullMatch, plainCitation);
      }
    } else if (result.valid === false) {
      // Invalid PMID - remove hyperlink
      invalid++;
      console.log(`[PubMed Verifier] ✗ Invalid PMID: ${citation.pmid}`);
      
      // Replace hyperlinked citation with plain text citation
      const plainCitation = `${citation.author}, ${citation.year}`;
      cleanedResponse = cleanedResponse.replace(citation.fullMatch, plainCitation);
    } else {
      // Could not verify (API error) - keep citation but log warning
      unverifiable++;
      console.log(`[PubMed Verifier] ? Could not verify PMID: ${citation.pmid}`);
    }
  }
  
  const report = {
    totalCitations: citations.length,
    verified,
    invalid,
    unverifiable,
    contentWarnings,
    contentDetails: contentDetails.length > 0 ? contentDetails : undefined
  };
  
  console.log(`[PubMed Verifier] Report: ${verified} verified, ${invalid} invalid, ${unverifiable} unverifiable, ${contentWarnings} content warnings`);
  
  if (contentWarnings > 0) {
    console.log(`[Content Verifier] ⚠ ${contentWarnings} citation(s) have low content match - may not support the claimed findings`);
  }
  
  return {
    cleanedResponse,
    verificationReport: report
  };
}

/**
 * Extract last name from author string
 * Handles formats like "Reeves et al.", "Smith", "van der Berg et al."
 */
function extractLastName(authorStr) {
  if (!authorStr) return null;
  
  // Remove ", et al." or " et al." from the end
  let cleaned = authorStr.replace(/,?\s*et\s+al\.?$/i, '').trim();
  
  // Handle PubMed format like "Reeves RH" or "Smith J"
  // Take the first word (last name comes first in PubMed)
  const parts = cleaned.split(/\s+/);
  
  if (parts.length > 0) {
    // Return first part (last name) if it looks like a name (not just initials)
    const firstPart = parts[0];
    // If it's more than 2 characters or has lowercase (not just initials), it's probably the last name
    if (firstPart.length > 2 || /[a-z]/.test(firstPart)) {
      return firstPart;
    }
  }
  
  return cleaned;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
