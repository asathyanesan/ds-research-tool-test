import axios from 'axios';

/**
 * Search PubMed and retrieve relevant papers for citation
 * Uses NCBI E-utilities API (ESearch + ESummary)
 */

const NCBI_API_KEY = process.env.NCBI_API_KEY;
const NCBI_ESEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const NCBI_ESUMMARY_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';

// Key Down syndrome research terms mapping
const DS_QUERY_MAPPINGS = {
  'ts65dn': 'Ts65Dn[Title/Abstract] OR "Ts(1716)65Dn"[Title/Abstract]',
  'tc1': 'Tc1[Title/Abstract] AND Down syndrome[Title/Abstract]',
  'dp16': 'Dp(16)[Title/Abstract] OR Dp16[Title/Abstract]',
  'dp17': 'Dp(17)[Title/Abstract] OR Dp17[Title/Abstract]',
  'cognitive': 'cognitive[Title/Abstract] OR learning[Title/Abstract] OR memory[Title/Abstract]',
  'morris water maze': '"Morris water maze"[Title/Abstract] OR "water maze"[Title/Abstract]',
  'rrid': '"Resource Identification"[Title/Abstract] OR RRID[Title/Abstract]',
  'interferon': 'interferon[Title/Abstract] AND Down syndrome[Title/Abstract]',
  'arrive': 'ARRIVE[Title/Abstract] OR "animal research"[Title/Abstract]',
  'sample size': '"sample size"[Title/Abstract] OR "power analysis"[Title/Abstract]'
};

/**
 * Build PubMed search query from user question
 * @param {string} userQuestion - User's question
 * @returns {string} - PubMed search query
 */
function buildSearchQuery(userQuestion) {
  const lowerQuery = userQuestion.toLowerCase();
  const queryParts = [];
  
  // Check for specific model mentions
  if (lowerQuery.includes('ts65dn')) {
    queryParts.push(DS_QUERY_MAPPINGS['ts65dn']);
  }
  if (lowerQuery.includes('tc1')) {
    queryParts.push(DS_QUERY_MAPPINGS['tc1']);
  }
  if (lowerQuery.includes('dp16') || lowerQuery.includes('dp(16)')) {
    queryParts.push(DS_QUERY_MAPPINGS['dp16']);
  }
  
  // Check for topic areas
  if (lowerQuery.match(/cognitiv|learning|memory|behavior/)) {
    queryParts.push(DS_QUERY_MAPPINGS['cognitive']);
  }
  if (lowerQuery.includes('water maze') || lowerQuery.includes('morris')) {
    queryParts.push(DS_QUERY_MAPPINGS['morris water maze']);
  }
  if (lowerQuery.includes('interferon')) {
    queryParts.push(DS_QUERY_MAPPINGS['interferon']);
  }
  
  // If no specific terms, use general DS + mouse/mice query
  if (queryParts.length === 0) {
    if (lowerQuery.match(/mouse|mice|model/)) {
      queryParts.push('Down syndrome[Title/Abstract] AND (mouse[Title/Abstract] OR mice[Title/Abstract])');
    } else {
      // Very generic - search DS literature
      queryParts.push('Down syndrome[Title/Abstract]');
    }
  }
  
  // Combine with OR (any matching paper)
  let finalQuery = queryParts.join(' OR ');
  
  // Add filters for quality
  finalQuery += ' AND (Review[PT] OR Research Support[PT] OR Clinical Trial[PT])';
  
  return finalQuery;
}

/**
 * Search PubMed for relevant papers
 * @param {string} query - PubMed search query
 * @param {number} maxResults - Maximum results to return (default: 10)
 * @returns {Promise<Array>} - Array of PMIDs
 */
async function searchPubMed(query, maxResults = 10) {
  try {
    const url = `${NCBI_ESEARCH_URL}?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json&sort=relevance${NCBI_API_KEY ? `&api_key=${NCBI_API_KEY}` : ''}`;
    
    console.log(`[PubMed Search] Query: ${query}`);
    
    const response = await axios.get(url, { timeout: 10000 });
    
    if (response.data && response.data.esearchresult && response.data.esearchresult.idlist) {
      const pmids = response.data.esearchresult.idlist;
      console.log(`[PubMed Search] Found ${pmids.length} papers`);
      return pmids;
    }
    
    return [];
  } catch (error) {
    console.error('[PubMed Search] Error:', error.message);
    return [];
  }
}

/**
 * Get paper details from PMIDs
 * @param {Array<string>} pmids - Array of PMIDs
 * @returns {Promise<Array>} - Array of paper objects
 */
async function getPaperDetails(pmids) {
  if (pmids.length === 0) {
    return [];
  }
  
  try {
    const pmidList = pmids.join(',');
    const url = `${NCBI_ESUMMARY_URL}?db=pubmed&id=${pmidList}&retmode=json${NCBI_API_KEY ? `&api_key=${NCBI_API_KEY}` : ''}`;
    
    const response = await axios.get(url, { timeout: 10000 });
    
    const papers = [];
    
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
          
          // Format author for citation (Last name + et al.)
          const authorParts = firstAuthor.split(' ');
          const lastName = authorParts[0]; // PubMed format: "Last FM"
          const citationAuthor = article.authors && article.authors.length > 1 
            ? `${lastName} et al.`
            : lastName;
          
          papers.push({
            pmid,
            title: article.title || '',
            authors: article.authors || [],
            firstAuthor,
            citationAuthor,
            year: pubYear,
            journal: article.fulljournalname || article.source || '',
            citation: `([${citationAuthor}, ${pubYear}](https://pubmed.ncbi.nlm.nih.gov/${pmid}/))`,
            plainCitation: `(${citationAuthor}, ${pubYear})`
          });
        }
      }
    }
    
    console.log(`[PubMed Search] Retrieved details for ${papers.length} papers`);
    return papers;
    
  } catch (error) {
    console.error('[PubMed Search] Error getting paper details:', error.message);
    return [];
  }
}

/**
 * Search PubMed and return formatted reference list for AI
 * @param {string} userQuestion - User's question
 * @param {number} maxResults - Maximum papers to retrieve (default: 10)
 * @returns {Promise<Object>} - { papers: Array, referenceText: string }
 */
export async function searchRelevantPapers(userQuestion, maxResults = 10) {
  // Build search query
  const query = buildSearchQuery(userQuestion);
  
  // Search PubMed
  const pmids = await searchPubMed(query, maxResults);
  
  if (pmids.length === 0) {
    console.log('[PubMed Search] No papers found');
    return { papers: [], referenceText: '' };
  }
  
  // Get paper details
  const papers = await getPaperDetails(pmids);
  
  // Format reference text for AI
  let referenceText = '\n\n**REFERENCE LIBRARY - Use these verified papers for citations:**\n\n';
  
  papers.forEach((paper, index) => {
    referenceText += `${index + 1}. **${paper.title}**\n`;
    referenceText += `   - Authors: ${paper.firstAuthor}${paper.authors.length > 1 ? ' et al.' : ''}\n`;
    referenceText += `   - Year: ${paper.year}\n`;
    referenceText += `   - Journal: ${paper.journal}\n`;
    referenceText += `   - PMID: ${paper.pmid}\n`;
    referenceText += `   - **Citation format to use:** ${paper.citation}\n\n`;
  });
  
  referenceText += '\n**IMPORTANT:** When citing these papers, use the EXACT citation format provided above with the verified PMIDs. These are real, verified papers - cite them liberally when relevant to the question.\n';
  
  return { papers, referenceText };
}
