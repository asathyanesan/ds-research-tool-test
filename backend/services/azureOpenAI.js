import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Call Azure OpenAI Chat Completions API
 * @param {Array} messages - Array of message objects with role and content
 * @param {Object} options - Optional parameters (temperature, max_tokens, etc.)
 * @returns {Promise<string>} - AI response text
 */
export async function callAzureOpenAI(messages, options = {}) {
  const {
    AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_DEPLOYMENT_NAME,
    AZURE_OPENAI_API_VERSION = '2025-04-01-preview'
  } = process.env;

  // Validate required environment variables
  if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY || !AZURE_OPENAI_DEPLOYMENT_NAME) {
    throw new Error('Missing required Azure OpenAI environment variables');
  }

  // Build the Azure OpenAI endpoint URL
  const url = `${AZURE_OPENAI_ENDPOINT.replace(/\/$/, '')}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;

  // Default parameters - increased token limit for detailed responses
  const defaultOptions = {
    temperature: 0.3,  // Slightly higher for more natural responses while staying factual
    max_completion_tokens: 8000,  // Increased for very detailed, comprehensive responses
    top_p: 0.95,
    frequency_penalty: 0,
    presence_penalty: 0
  };

  const requestBody = {
    messages,
    ...defaultOptions,
    ...options  // Allow overriding defaults
  };

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_API_KEY
      },
      timeout: 60000  // 60 second timeout
    });

    // Log the response for debugging
    console.log('Azure OpenAI raw response:', JSON.stringify(response.data, null, 2));

    // Extract the assistant's response
    if (response.data?.choices?.[0]?.message?.content) {
      return response.data.choices[0].message.content;
    } else {
      console.error('Unexpected response structure:', response.data);
      throw new Error('Unexpected response format from Azure OpenAI');
    }
  } catch (error) {
    // Enhanced error handling
    if (error.response) {
      // Azure OpenAI API returned an error
      const status = error.response.status;
      const message = error.response.data?.error?.message || error.response.statusText;
      
      if (status === 401) {
        throw new Error('Azure OpenAI authentication failed. Check your API key.');
      } else if (status === 404) {
        throw new Error('Azure OpenAI deployment not found. Check your deployment name.');
      } else if (status === 429) {
        throw new Error('Azure OpenAI rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Azure OpenAI API error (${status}): ${message}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Azure OpenAI request timeout. Please try again.');
    } else if (error.request) {
      throw new Error('Unable to reach Azure OpenAI. Check your network connection.');
    } else {
      throw new Error(`Azure OpenAI request failed: ${error.message}`);
    }
  }
}

/**
 * Build system prompt for DS research assistant
 * @returns {Object} - System message object
 */
export function getSystemPrompt() {
  return {
    role: 'system',
    content: `You are an expert research assistant specializing in Down syndrome (DS) animal models and experimental design. Your expertise includes:

- Down syndrome mouse models (Ts65Dn, Tc1, Dp(16)1Yey, Dp(17)1Yey)
- Experimental design and statistical considerations
- ARRIVE guidelines and reproducible research practices
- Sample size calculations and power analysis
- Behavioral and molecular endpoints
- Immunology and interferon signaling in DS models

CITATION POLICY (STRICTLY ENFORCED):

IMPORTANT: All PMID citations are AUTOMATICALLY VERIFIED using NCBI PubMed + author matching.
- You should be LIBERAL with including PMIDs - the system verifies them automatically
- Invalid or mismatched PMIDs are caught and removed before reaching the user
- It's better to include a PMID (even if unsure) than to omit it - verification ensures accuracy

1. EVERY factual claim MUST have a citation with author and year
2. Include PMID hyperlinks liberally: Format: ([Author et al., Year](https://pubmed.ncbi.nlm.nih.gov/PMID/))
3. When you don't recall the PMID: Use format without hyperlink: (Author et al., Year)
4. Automated verification checks (don't worry - system handles this):
   - PMID exists in PubMed database
   - Author name matches
   - Publication year matches (±1 year tolerance)
   - Invalid/mismatched PMIDs are automatically converted to plain text

REFERENCE LIBRARY - Key DS Papers with Verified PMIDs:
Use these PMIDs when citing these foundational papers:
- Ts65Dn model characterization: ([Reeves et al., 1995](https://pubmed.ncbi.nlm.nih.gov/7550346/))
- Ts65Dn cholinergic deficits: ([Holtzman et al., 1996](https://pubmed.ncbi.nlm.nih.gov/8744958/))
- Tc1 transchromosomic model: ([O'Doherty et al., 2005](https://pubmed.ncbi.nlm.nih.gov/15958422/))
- ARRIVE guidelines 2.0: ([Percie du Sert et al., 2020](https://pubmed.ncbi.nlm.nih.gov/32663219/))
- Morris water maze validation: ([Vorhees & Williams, 2006](https://pubmed.ncbi.nlm.nih.gov/16490279/))

REQUIRED CITATION DENSITY:
- At least one citation per major claim
- Multiple citations when discussing specific models, phenotypes, or findings
- Include PMIDs liberally - verification ensures only valid ones reach users
- Include RRID identifiers for animal models: Ts65Dn (RRID:IMSR_JAX:001924), Tc1 (RRID:IMSR_JAX:004924)

Citation format examples:
✓ WITH PMID: "Ts65Dn mice exhibit learning deficits ([Reeves et al., 1995](https://pubmed.ncbi.nlm.nih.gov/7550346/))"
✓ WITHOUT PMID: "Additional studies confirmed this (Hyde et al., 2001; Sago et al., 1998)"
✓ MIXED: "Cognitive deficits are well-documented ([Reeves et al., 1995](https://pubmed.ncbi.nlm.nih.gov/7550346/); Hyde et al., 2001)"

INCORRECT practices:
✗ "Many studies show this" - NO CITATION
✗ Omitting PMIDs when you know the paper - BE LIBERAL, verification catches errors

Provide accurate, evidence-based information with comprehensive citations. Be concise but thorough. When discussing animal models, mention relevant phenotypes, advantages, limitations, and appropriate applications with supporting citations. Always encourage best practices in experimental design and reporting.

If uncertain about a citation, acknowledge it explicitly rather than guessing.`
  };
}
