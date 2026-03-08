import { verifyAndCleanResponse } from './services/pubmedVerifier.js';

// Test case: Sonic hedgehog agonist treatment claim with wrong citation
const testResponse = `Early postnatal Sonic hedgehog agonist treatment partially rescues cerebellar size and granule cell number, confirming a proliferation-driven hypoplasia ([Reeves et al., 1995](https://pubmed.ncbi.nlm.nih.gov/7550346/)). However, the actual treatment study was done by ([Das et al., 2013](https://pubmed.ncbi.nlm.nih.gov/23303760/)).`;

console.log('Testing content verification...\n');
console.log('Original text:', testResponse);
console.log('\n' + '='.repeat(80) + '\n');

const result = await verifyAndCleanResponse(testResponse);

console.log('\n' + '='.repeat(80));
console.log('VERIFICATION REPORT:');
console.log('='.repeat(80));
console.log(`Total citations: ${result.verificationReport.totalCitations}`);
console.log(`Verified: ${result.verificationReport.verified}`);
console.log(`Invalid: ${result.verificationReport.invalid}`);
console.log(`Content warnings: ${result.verificationReport.contentWarnings || 0}`);

if (result.verificationReport.contentDetails) {
  console.log('\n' + '='.repeat(80));
  console.log('CONTENT WARNINGS:');
  console.log('='.repeat(80));
  result.verificationReport.contentDetails.forEach(detail => {
    console.log(`\nPMID ${detail.pmid}: ${detail.author}, ${detail.year}`);
    console.log(`  Content match: ${detail.contentScore}%`);
    console.log(`  Warning: ${detail.warning}`);
    console.log(`  Context: "${detail.context}"`);
  });
}

console.log('\n' + '='.repeat(80));
console.log('CLEANED RESPONSE:');
console.log('='.repeat(80));
console.log(result.cleanedResponse);
