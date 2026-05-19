/**
 * Fetch DS rodent model bibliography from PubMed E-utils.
 * Saves to react-app/public/data/bibliography.json
 *
 * Usage: node scripts/fetch-bibliography.js
 * Rate-limited to 3 req/sec (NCBI free tier).
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Targeted PubMed searches for DS rodent model literature since 1990
const QUERIES = [
  '"Down syndrome"[MeSH Terms] AND "disease models, animal"[MeSH Terms]',
  'Ts65Dn[Title/Abstract]',
  'Tc1[Title/Abstract] AND "Down syndrome"[Title/Abstract]',
  '"Dp(16)"[Title/Abstract] AND "Down syndrome"[Title/Abstract]',
  '"Dp(17)"[Title/Abstract] AND "Down syndrome"[Title/Abstract]',
  '"Dp(10)"[Title/Abstract] AND "Down syndrome"[Title/Abstract]',
  'Ts1Cje[Title/Abstract]',
  'Ts2Cje[Title/Abstract]',
  'Ts1Rhr[Title/Abstract]',
  'Ts66Yah[Title/Abstract]',
  '"trisomy 16" AND mouse[Title/Abstract] AND "Down syndrome"[Title/Abstract]',
  '"Down syndrome" AND "mouse model"[Title/Abstract] AND cognition[Title/Abstract]',
  '"Down syndrome" AND "mouse model"[Title/Abstract] AND behavior[Title/Abstract]',
  '"Down syndrome" AND "mouse model"[Title/Abstract] AND therapeutic[Title/Abstract]',
  '"Down syndrome" AND "mouse model"[Title/Abstract] AND hippocampus[Title/Abstract]',
  '"Down syndrome" AND "mouse model"[Title/Abstract] AND interferon[Title/Abstract]',
  '"Down syndrome" AND "rat model"[Title/Abstract]',
  '"Down syndrome" AND "rodent model"[Title/Abstract]',
  '"Down syndrome" AND "animal model"[Title/Abstract] AND genotype[Title/Abstract]',
  '"Down syndrome" AND Alzheimer[Title/Abstract] AND mouse[Title/Abstract]',
  '"trisomy 21" AND mouse[Title/Abstract]',
  '"segmental trisomy" AND "Down syndrome"[Title/Abstract]',
  '"transchromosomic" AND "Down syndrome"[Title/Abstract]',
  'DYRK1A AND "Down syndrome"[Title/Abstract] AND mouse[Title/Abstract]',
  'GATA1 AND "Down syndrome"[Title/Abstract] AND mouse[Title/Abstract]',
  '"Down syndrome" AND "Morris water maze"[Title/Abstract]',
  '"Down syndrome" AND "novel object recognition"[Title/Abstract]',
  '"Down syndrome" AND neurogenesis[Title/Abstract] AND mouse[Title/Abstract]',
  '"Down syndrome" AND "long-term potentiation"[Title/Abstract]',
  '"Down syndrome" AND immunology[Title/Abstract] AND mouse[Title/Abstract]',
];

const MIN_DATE = '1990';
const MAX_RESULTS_PER_QUERY = 300;
const BATCH_SIZE = 200;
const DELAY_MS = 350; // ~2.8 req/sec, under NCBI limit of 3/sec

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error for ${url}: ${e.message}\nData: ${data.slice(0, 200)}`)); }
      });
    }).on('error', reject);
  });
}

async function searchPubMed(query) {
  const base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
  const url = `${base}esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${MAX_RESULTS_PER_QUERY}&mindate=${MIN_DATE}&datetype=pdat&retmode=json`;
  try {
    const result = await fetchJson(url);
    const ids = result.esearchresult?.idlist || [];
    console.log(`  "${query.slice(0, 60)}..." → ${ids.length} hits`);
    return ids;
  } catch (e) {
    console.warn(`  Search failed for query, skipping: ${e.message}`);
    return [];
  }
}

async function fetchSummaries(pmids) {
  if (!pmids.length) return {};
  const base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
  const url = `${base}esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
  try {
    const result = await fetchJson(url);
    return result.result || {};
  } catch (e) {
    console.warn(`  Summary fetch failed: ${e.message}`);
    return {};
  }
}

async function main() {
  console.log('Fetching DS rodent model bibliography from PubMed...\n');

  const allPmids = new Set();

  for (const query of QUERIES) {
    const ids = await searchPubMed(query);
    ids.forEach(id => allPmids.add(id));
    await delay(DELAY_MS);
  }

  const pmidArray = [...allPmids];
  console.log(`\nTotal unique PMIDs: ${pmidArray.length}`);
  console.log('Fetching summaries in batches...\n');

  const entries = [];

  for (let i = 0; i < pmidArray.length; i += BATCH_SIZE) {
    const batch = pmidArray.slice(i, i + BATCH_SIZE);
    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(pmidArray.length / BATCH_SIZE)} (${batch.length} records)...`);
    const summaries = await fetchSummaries(batch);

    for (const pmid of batch) {
      const s = summaries[pmid];
      if (!s || s.error) continue;

      const authorList = (s.authors || []).map(a => a.name);
      const firstAuthor = authorList[0] || '';
      const lastAuthor = authorList.length > 1 ? authorList[authorList.length - 1] : '';
      // Format as "Smith A, Jones B, ..., Last N" or just first author if solo
      const authorsShort = authorList.length <= 3
        ? authorList.join(', ')
        : `${firstAuthor}, ${authorList[1]}, ..., ${lastAuthor}`;

      const year = (s.pubdate || '').split(' ')[0] || '';

      entries.push({
        pmid,
        title: (s.title || '').replace(/\.$/, ''), // strip trailing period
        authors: authorsShort,
        year,
        journal: s.source || '',
      });
    }

    await delay(DELAY_MS);
  }

  // Sort by year descending (most recent first)
  entries.sort((a, b) => {
    const ya = parseInt(a.year) || 0;
    const yb = parseInt(b.year) || 0;
    return yb - ya;
  });

  const outPath = path.join(__dirname, '../react-app/public/data/bibliography.json');
  fs.writeFileSync(outPath, JSON.stringify(entries, null, 2));

  console.log(`\nDone. Saved ${entries.length} papers to bibliography.json`);
  console.log(`Output: ${outPath}`);

  // Quick stats
  const years = entries.map(e => parseInt(e.year)).filter(Boolean);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  console.log(`Year range: ${minYear}–${maxYear}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
