/**
 * Test semantic content verification with embeddings
 * Tests the hybrid keyword + semantic approach for citation verification
 */

import { verifyAndCleanResponse } from './services/pubmedVerifier.js';

async function testSemanticVerification() {
  console.log('=== Testing Semantic Content Verification ===\n');
  
  // Test Case 1: Correct citation with high semantic match
  console.log('--- Test 1: Correct Citation (Expected: High Match) ---');
  const correctCitation = 
    'The Ts65Dn mouse model exhibits cognitive deficits in spatial learning and memory, ' +
    'as demonstrated by impaired performance in the Morris water maze task ' +
    '([Reeves et al., 1995](https://pubmed.ncbi.nlm.nih.gov/7550346/)).';
  
  const result1 = await verifyAndCleanResponse(correctCitation);
  console.log('Result 1:', JSON.stringify(result1.verificationReport, null, 2));
  console.log('');
  
  // Test Case 2: Wrong citation - semantic mismatch
  console.log('--- Test 2: Wrong Citation (Expected: Low Match) ---');
  const wrongCitation = 
    'Early postnatal Sonic hedgehog agonist treatment increases proliferation in the cerebellum ' +
    '([Reeves et al., 1995](https://pubmed.ncbi.nlm.nih.gov/7550346/)). ' +
    'This demonstrates the role of the Shh pathway in cerebellar development.';
  
  const result2 = await verifyAndCleanResponse(wrongCitation);
  console.log('Result 2:', JSON.stringify(result2.verificationReport, null, 2));
  console.log('');
  
  // Test Case 3: Related but different topic
  console.log('--- Test 3: Related Topic (Expected: Medium Match) ---');
  const relatedCitation = 
    'Down syndrome is caused by trisomy of chromosome 21, leading to various developmental abnormalities ' +
    '([Reeves et al., 1995](https://pubmed.ncbi.nlm.nih.gov/7550346/)).';
  
  const result3 = await verifyAndCleanResponse(relatedCitation);
  console.log('Result 3:', JSON.stringify(result3.verificationReport, null, 2));
  console.log('');
  
  console.log('=== Test Complete ===');
  console.log('\nSummary:');
  console.log('- Test 1 should show high content match (>70%)');
  console.log('- Test 2 should show low content match (<30%) with warning');
  console.log('- Test 3 should show medium match (30-70%)');
  console.log('\nIf semantic scores are shown, embeddings are working!');
}

// Run the test
testSemanticVerification().catch(console.error);
