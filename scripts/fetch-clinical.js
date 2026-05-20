/**
 * Fetch DS clinical (human) literature from PubMed E-utils + Semantic Scholar.
 * Saves to react-app/public/data/clinical-papers.json
 *
 * Each entry gets: pmid, title, authors, year, journal, abstract, mesh, keywords, tldr
 * Plus: population: "human"  (used by App.jsx to label [human study] in the RAG citation pool)
 *
 * Usage: node scripts/fetch-clinical.js
 * Rate-limited to 3 req/sec (NCBI free tier).
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Targeted PubMed searches for DS clinical / translational literature
// Using humans[Filter] where possible to bias toward human studies.
// Overlap with bibliography.json (rodent papers) is harmless — App.jsx deduplicates by PMID.
const QUERIES = [
  '"Down syndrome"[MeSH Terms] AND "Alzheimer disease"[MeSH Terms] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND amyloid[Title/Abstract] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND "cognitive dysfunction"[MeSH Terms] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND cognition[Title/Abstract] AND "clinical study"[Title/Abstract]',
  '"Down syndrome"[MeSH Terms] AND "leukemia"[MeSH Terms] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND "GATA1"[Title/Abstract] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND "heart defects, congenital"[MeSH Terms] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND interferon[Title/Abstract] AND humans[Filter]',
  '"trisomy 21"[Title/Abstract] AND "gene expression"[Title/Abstract] AND humans[Filter]',
  '"trisomy 21"[Title/Abstract] AND transcriptome[Title/Abstract] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND "clinical trial"[Publication Type]',
  '"Down syndrome"[MeSH Terms] AND "randomized controlled trial"[Publication Type]',
  '"Down syndrome"[MeSH Terms] AND biomarkers[Title/Abstract] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND "immune system"[MeSH Terms] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND "inflammation"[MeSH Terms] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND aging[Title/Abstract] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND "DYRK1A"[Title/Abstract] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND "sleep"[MeSH Terms] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND "epilepsy"[MeSH Terms] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND translational[Title/Abstract]',
  '"Down syndrome"[MeSH Terms] AND "hippocampus"[MeSH Terms] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND "thyroid diseases"[MeSH Terms] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND "pharmacotherapy"[Title/Abstract] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND "quality of life"[MeSH Terms] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND "brain"[MeSH Terms] AND "magnetic resonance imaging"[MeSH Terms] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND "synaptic plasticity"[Title/Abstract] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND "human concordance"[Title/Abstract]',
  '"Down syndrome"[MeSH Terms] AND "oxidative stress"[MeSH Terms] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND "neuroinflammation"[Title/Abstract] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND "autism spectrum disorder"[MeSH Terms] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND "gut microbiome"[Title/Abstract] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND "epigenetics"[Title/Abstract] AND humans[Filter]',
  '"trisomy 21"[Title/Abstract] AND "phenotype"[Title/Abstract] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND "language"[MeSH Terms] AND humans[Filter]',
  '"Down syndrome"[MeSH Terms] AND "memory"[MeSH Terms] AND humans[Filter]',
];

const MIN_DATE = '1990';
const MAX_RESULTS_PER_QUERY = 200;
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

function fetchXml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function fetchPubMedData(pmids) {
  if (!pmids.length) return {};
  const base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
  const url = `${base}efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml&rettype=abstract`;
  const results = {};
  try {
    const xml = await fetchXml(url);
    const articleBlocks = xml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];
    for (const block of articleBlocks) {
      const pmidMatch = block.match(/<PMID[^>]*>(\d+)<\/PMID>/);
      if (!pmidMatch) continue;
      const pmid = pmidMatch[1];
      const texts = [];
      const re = /<AbstractText(?:[^>]*)>([\s\S]*?)<\/AbstractText>/g;
      let m;
      while ((m = re.exec(block)) !== null) {
        const t = m[1].replace(/<[^>]+>/g, '').trim();
        if (t) texts.push(t);
      }
      const mesh = [];
      const meshRe = /<DescriptorName[^>]*>([^<]+)<\/DescriptorName>/g;
      let mm;
      while ((mm = meshRe.exec(block)) !== null) {
        const term = mm[1].replace(/<[^>]+>/g, '').trim();
        if (term) mesh.push(term);
      }
      const keywords = [];
      const kwRe = /<Keyword[^>]*>([^<]+)<\/Keyword>/g;
      let kk;
      while ((kk = kwRe.exec(block)) !== null) {
        const kw = kk[1].replace(/<[^>]+>/g, '').trim();
        if (kw) keywords.push(kw);
      }
      results[pmid] = { abstract: texts.length ? texts.join(' ') : '', mesh, keywords };
    }
  } catch (e) {
    console.warn(`  PubMed data fetch failed: ${e.message}`);
  }
  return results;
}

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    };
    const req = require('https').request(options, (res) => {
      let out = '';
      res.on('data', c => { out += c; });
      res.on('end', () => { try { resolve(JSON.parse(out)); } catch(e) { reject(e); } });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function fetchSemanticScholarTldrs(pmids) {
  const tldrs = {};
  const BATCH = 500;
  for (let i = 0; i < pmids.length; i += BATCH) {
    const batch = pmids.slice(i, i + BATCH);
    const batchNum = Math.floor(i / BATCH) + 1;
    const totalBatches = Math.ceil(pmids.length / BATCH);
    console.log(`  S2 TL;DR batch ${batchNum}/${totalBatches} (${batch.length} papers)...`);
    try {
      const result = await postJson(
        'https://api.semanticscholar.org/graph/v1/paper/batch?fields=tldr',
        { ids: batch.map(p => `PMID:${p}`) }
      );
      if (Array.isArray(result)) {
        result.forEach((item, idx) => {
          if (item && item.tldr && item.tldr.text) {
            tldrs[batch[idx]] = item.tldr.text;
          }
        });
      }
    } catch (e) {
      console.warn(`  S2 TL;DR batch ${batchNum} failed: ${e.message}`);
    }
    await delay(1100);
  }
  return tldrs;
}

async function searchPubMed(query) {
  const base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
  const url = `${base}esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${MAX_RESULTS_PER_QUERY}&mindate=${MIN_DATE}&datetype=pdat&retmode=json`;
  try {
    const result = await fetchJson(url);
    const ids = result.esearchresult?.idlist || [];
    console.log(`  "${query.slice(0, 70)}..." → ${ids.length} hits`);
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
  console.log('Fetching DS clinical literature from PubMed...\n');

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
      const authorsShort = authorList.length <= 3
        ? authorList.join(', ')
        : `${firstAuthor}, ${authorList[1]}, ..., ${lastAuthor}`;

      const year = (s.pubdate || '').split(' ')[0] || '';

      entries.push({
        pmid,
        title: (s.title || '').replace(/\.$/, ''),
        authors: authorsShort,
        year,
        journal: s.source || '',
        population: 'human',
        abstract: '',
      });
    }

    await delay(DELAY_MS);
  }

  entries.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));

  // Fetch abstracts, MeSH terms, and author keywords
  const ABSTRACT_BATCH = 100;
  console.log(`\nFetching PubMed data (abstracts + MeSH + keywords) in batches of ${ABSTRACT_BATCH}...`);
  const pmidToData = {};
  const allEntryPmids = entries.map(e => e.pmid);
  for (let i = 0; i < allEntryPmids.length; i += ABSTRACT_BATCH) {
    const batch = allEntryPmids.slice(i, i + ABSTRACT_BATCH);
    const batchNum = Math.floor(i / ABSTRACT_BATCH) + 1;
    const totalBatches = Math.ceil(allEntryPmids.length / ABSTRACT_BATCH);
    console.log(`  PubMed batch ${batchNum}/${totalBatches} (${batch.length} records)...`);
    const data = await fetchPubMedData(batch);
    Object.assign(pmidToData, data);
    await delay(DELAY_MS);
  }

  // Fetch TL;DR summaries from Semantic Scholar
  console.log(`\nFetching TL;DR summaries from Semantic Scholar...`);
  const pmidToTldr = await fetchSemanticScholarTldrs(allEntryPmids);

  let withAbstract = 0;
  let withTldr = 0;
  entries.forEach(e => {
    const d = pmidToData[e.pmid] || {};
    e.abstract = d.abstract || '';
    e.mesh = d.mesh || [];
    e.keywords = d.keywords || [];
    e.tldr = pmidToTldr[e.pmid] || '';
    if (e.abstract) withAbstract++;
    if (e.tldr) withTldr++;
  });
  console.log(`  Abstracts found: ${withAbstract}/${entries.length}`);
  console.log(`  TL;DRs found:    ${withTldr}/${entries.length}`);

  const outPath = path.join(__dirname, '../react-app/public/data/clinical-papers.json');
  fs.writeFileSync(outPath, JSON.stringify(entries, null, 2));

  console.log(`\nDone. Saved ${entries.length} papers to clinical-papers.json`);
  console.log(`Output: ${outPath}`);

  const years = entries.map(e => parseInt(e.year)).filter(Boolean);
  if (years.length) {
    console.log(`Year range: ${Math.min(...years)}–${Math.max(...years)}`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
