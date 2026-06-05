/**
 * Fetch structured full text (Results + Methods sections) for DS papers via
 * NCBI efetch PMC XML (JATS format). Reads PMIDs from bibliography.json and
 * clinical-papers.json, converts to PMCIDs via PMC ID Converter, then
 * retrieves section-tagged XML for each Open Access paper.
 *
 * Output: react-app/public/data/fulltext.json
 *   { papers: { "<pmid>": { pmcid, methods, results }, ... }, generated, stats }
 *
 * Usage:
 *   node scripts/fetch-fulltext.js
 *   node scripts/fetch-fulltext.js --limit 50      # test run first
 *   node scripts/fetch-fulltext.js --dry-run       # PMID->PMCID only, no XML
 *
 * Set NCBI_API_KEY env var for 10 req/sec (vs 3/sec free tier):
 *   $env:NCBI_API_KEY="your_key_here"; node scripts/fetch-fulltext.js
 *
 * Fully resumable - already-fetched PMIDs are skipped on re-run.
 */

const fs   = require('fs');
const path = require('path');

const NCBI_API_KEY = process.env.NCBI_API_KEY || '';
const HAS_API_KEY  = NCBI_API_KEY.length > 0;
const DELAY_MS     = HAS_API_KEY ? 105 : 370;
const IDCONV_BATCH = 200;
const MAX_METHODS  = 3500;  // target chars after condensation
const MAX_RESULTS  = 5500;  // target chars after condensation

const args     = process.argv.slice(2);
const DRY_RUN  = args.includes('--dry-run');
const limitIdx = args.indexOf('--limit');
const LIMIT    = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : Infinity;

const OUT_PATH = path.join(__dirname, '../react-app/public/data/fulltext.json');

// ---- HTTP helpers ----
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function httpGet(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) { reject(new Error('Too many redirects')); return; }
    const lib = url.startsWith('https') ? require('https') : require('http');
    lib.get(url, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        resolve(httpGet(res.headers.location, redirectCount + 1));
        return;
      }
      if (res.statusCode === 404) { resolve({ status: 404, body: '' }); return; }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function fetchJson(url) {
  const { status, body } = await httpGet(url);
  if (status === 404) return null;
  if (status !== 200) throw new Error(`HTTP ${status}`);
  return JSON.parse(body);
}

async function fetchXml(url) {
  const { status, body } = await httpGet(url);
  if (status !== 200 || !body) return null;
  return body;
}

// ---- JATS XML section extractor ----
// Finds <sec> blocks whose <title> matches any of the given patterns and
// returns their concatenated plain text (XML tags and entities stripped).
function extractSection(xml, titlePatterns) {
  if (!xml) return '';
  const doc = xml.replace(/<!--[\s\S]*?-->/g, '').replace(/\r\n?/g, '\n');
  const chunks = [];
  let pos = 0;

  while (pos < doc.length) {
    const secStart = doc.indexOf('<sec', pos);
    if (secStart === -1) break;
    const tagEnd = doc.indexOf('>', secStart);
    if (tagEnd === -1) break;

    // Title is usually the first child element
    const titleSearch = doc.slice(tagEnd + 1, tagEnd + 300);
    const titleMatch  = titleSearch.match(/<title>([\s\S]*?)<\/title>/);

    if (titleMatch) {
      const titleText = titleMatch[1].replace(/<[^>]+>/g, '').trim();
      const isMatch = titlePatterns.some(p =>
        typeof p === 'string'
          ? titleText.toLowerCase().includes(p.toLowerCase())
          : p.test(titleText)
      );

      if (isMatch) {
        // Walk forward tracking open/close <sec> to find the matching </sec>
        let depth = 1, scanPos = tagEnd + 1;
        while (depth > 0 && scanPos < doc.length) {
          const nextOpen  = doc.indexOf('<sec', scanPos);
          const nextClose = doc.indexOf('</sec>', scanPos);
          if (nextClose === -1) break;
          if (nextOpen !== -1 && nextOpen < nextClose) {
            depth++;
            scanPos = nextOpen + 4;
          } else {
            depth--;
            if (depth === 0) {
              chunks.push(doc.slice(secStart, nextClose + 6));
              pos = nextClose + 6;
              break;
            }
            scanPos = nextClose + 6;
          }
        }
        if (depth > 0) break;
        continue;
      }
    }
    pos = tagEnd + 1;
  }

  if (!chunks.length) return '';
  return chunks.join(' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&#[0-9]+;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

const METHODS_TITLES = [
  'material', 'method', 'experimental procedure', 'experimental design',
  'study design', 'animals', 'subjects', 'patients', 'protocol'
];
const RESULTS_TITLES = ['result', 'finding', 'outcome'];

// ---- Sentence-level condensation ----
// Splits text into sentences, scores each by information density, then
// greedily selects the highest-scoring sentences (preserving original order)
// until the character budget is filled. This keeps the most data-rich
// sentences from across the entire section rather than hard-truncating.

// Terms that signal high-value content for each section type
const RESULTS_SIGNAL = [
  // statistics & numbers
  /p\s*[=<>≤≥]\s*0\.\d/i, /p\s*[=<>]\s*[0-9]/i,
  /\d+(\.\d+)?\s*%/, /fold[\s-]?change/i, /\d+\s*±\s*\d/,
  /significantly?/i, /coefficient/i, /correlation/i,
  /confidence interval/i, /\bci\b/i, /odds ratio/i,
  /effect size/i, /cohen/i, /r\s*=\s*[-0-9.]+/i,
  // phenotype outcome language
  /reduc\w+/i, /increas\w+/i, /impair\w+/i, /decreas\w+/i,
  /defici\w+/i, /elevat\w+/i, /comparedw?/i, /versus\b/i,
  /greater\b/i, /lower\b/i, /higher\b/i, /differ\w+/i,
  /rescue\w*/i, /restor\w+/i, /normal\w+/i, /wild.?type/i,
];

const METHODS_SIGNAL = [
  // sample sizes
  /\bn\s*=\s*\d/i, /per group/i, /\d+\s*(male|female|mice|rats|animals|subjects|patients)/i,
  /sample size/i, /cohort/i,
  // model / subject descriptors
  /ts65dn|tc1|dp\(16\)|dp1tyb|tcmac21|tg2576|ts1cje|ts1rhr/i,
  /wild.?type|wt\b/i, /genotyp\w+/i, /littermate/i,
  /\d+\s*(month|week|day)s?[\s-]old/i, /age\w*/i,
  // key procedure terms
  /inject\w+/i, /treat\w+/i, /administ\w+/i, /sacrific\w+/i,
  /stereotax\w*/i, /anesthes\w+/i, /perfus\w+/i,
  /randomiz\w+/i, /blind\w+/i, /counterbal\w+/i,
  // stats / analysis
  /anova\b/i, /t.?test\b/i, /mann.?whitney/i, /tukey/i,
  /bonferroni/i, /statistical\w*/i, /prism\b/i, /spss\b/i, /r\s+software/i,
];

function scoreSentence(sentence, signals) {
  let score = 0;
  for (const pattern of signals) {
    if (pattern.test(sentence)) score++;
  }
  // Bonus for sentences with numeric data (catches tables/measurements)
  if (/\d/.test(sentence)) score += 0.5;
  // Slight length preference — avoid ultra-short fragments
  if (sentence.length > 60) score += 0.3;
  return score;
}

function condenseSectionText(text, maxChars, signals) {
  if (!text) return '';

  // If already within budget, return as-is
  if (text.length <= maxChars) return text;

  // Split on sentence boundaries (period/!/?  followed by space+capital or end)
  // Also split on subsection-like all-caps labels (e.g. "RESULTS 2.1 ...")
  const raw = text.replace(/([.!?])\s+(?=[A-Z])/g, '$1\n')
                  .replace(/(\d+\.\d+\s+[A-Z][A-Z])/g, '\n$1')
                  .split('\n')
                  .map(s => s.trim())
                  .filter(s => s.length > 15);

  if (!raw.length) return text.slice(0, maxChars);

  // Score each sentence
  const scored = raw.map((sentence, idx) => ({
    sentence,
    idx,                              // preserve original order
    score: scoreSentence(sentence, signals),
  }));

  // Greedy selection: highest score first, stop when budget fills
  const sorted = [...scored].sort((a, b) => b.score - a.score || a.idx - b.idx);
  const selected = new Set();
  let used = 0;

  for (const item of sorted) {
    if (used + item.sentence.length + 1 > maxChars) continue;
    selected.add(item.idx);
    used += item.sentence.length + 1;
    if (used >= maxChars * 0.95) break;
  }

  // Reconstruct in original document order
  return scored
    .filter(item => selected.has(item.idx))
    .map(item => item.sentence)
    .join(' ');
}

// ---- Phase 1: PMID -> PMCID ----
async function pmidsToPmcids(pmids) {
  const map      = new Map();
  const total    = Math.ceil(pmids.length / IDCONV_BATCH);
  const apiParam = HAS_API_KEY ? `&api_key=${NCBI_API_KEY}` : '';

  for (let i = 0; i < pmids.length; i += IDCONV_BATCH) {
    const batch    = pmids.slice(i, i + IDCONV_BATCH);
    const batchNum = Math.floor(i / IDCONV_BATCH) + 1;
    process.stdout.write(`  ID converter batch ${batchNum}/${total} (${batch.length} PMIDs)... `);

    const url = `https://pmc.ncbi.nlm.nih.gov/tools/idconv/api/v1/articles/?ids=${batch.join(',')}&format=json&tool=ds-research-assistant${apiParam}`;
    try {
      const result = await fetchJson(url);
      let found = 0;
      if (result && Array.isArray(result.records)) {
        for (const rec of result.records) {
          if (rec.pmid && rec.pmcid && !rec.errmsg) {
            map.set(String(rec.pmid), String(rec.pmcid).replace(/^PMC/i, ''));
            found++;
          }
        }
      }
      console.log(`${found} with PMC full text`);
    } catch (e) {
      console.warn(`  FAILED: ${e.message}`);
    }
    await delay(DELAY_MS);
  }
  return map;
}

// ---- Phase 2: Fetch JATS XML ----
async function fetchFullText(pmcid) {
  const apiParam = HAS_API_KEY ? `&api_key=${NCBI_API_KEY}` : '';
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=${pmcid}&retmode=xml${apiParam}`;
  try {
    const xml = await fetchXml(url);
    if (!xml || xml.length < 500) return null;
    const rawMethods = extractSection(xml, METHODS_TITLES);
    const rawResults = extractSection(xml, RESULTS_TITLES);
    if (!rawMethods && !rawResults) return null;
    const methods = condenseSectionText(rawMethods, MAX_METHODS, METHODS_SIGNAL) || null;
    const results = condenseSectionText(rawResults, MAX_RESULTS, RESULTS_SIGNAL) || null;
    return { methods, results };
  } catch { return null; }
}

// ---- Save ----
function saveOutput(papers, corpusSize) {
  const vals = Object.values(papers).filter(Boolean);
  const output = {
    generated: new Date().toISOString(),
    stats: {
      corpus_size:          corpusSize,
      papers_with_fulltext: vals.length,
      with_methods_section: vals.filter(p => p.methods).length,
      with_results_section: vals.filter(p => p.results).length,
    },
    papers,
  };
  fs.writeFileSync(OUT_PATH, JSON.stringify(output));
}

// ---- Main ----
async function main() {
  console.log('=== DS Research Tool - Full Text Fetcher ===');
  console.log(`NCBI API key: ${HAS_API_KEY ? 'YES (' + NCBI_API_KEY.slice(0, 6) + '...)' : 'NO (free tier ~3 req/sec)'}`);
  if (DRY_RUN)         console.log('DRY RUN - PMID->PMCID only, no XML fetch');
  if (LIMIT < Infinity) console.log(`LIMIT: ${LIMIT} papers`);
  console.log('');

  // Load existing cache for resume support
  let existing = { papers: {} };
  if (fs.existsSync(OUT_PATH)) {
    try {
      existing = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'));
      const n = Object.keys(existing.papers).length;
      console.log(`Resuming: ${n} papers already cached`);
    } catch { existing = { papers: {} }; }
  }

  const bibPath  = path.join(__dirname, '../react-app/public/data/bibliography.json');
  const clinPath = path.join(__dirname, '../react-app/public/data/clinical-papers.json');
  const bib  = JSON.parse(fs.readFileSync(bibPath, 'utf8'));
  const clin = JSON.parse(fs.readFileSync(clinPath, 'utf8'));
  const allPmids = [...new Set([...bib, ...clin].map(p => String(p.pmid)).filter(Boolean))];
  console.log(`Total unique PMIDs in corpus: ${allPmids.length}`);

  const alreadyDone = new Set(Object.keys(existing.papers));
  const limited     = allPmids.filter(p => !alreadyDone.has(p)).slice(0, LIMIT);
  console.log(`To process this run: ${limited.length}  (${alreadyDone.size} already cached)\n`);

  if (!limited.length) { console.log('Nothing to do.'); return; }

  // Phase 1
  console.log('Phase 1: Resolving PMIDs to PMCIDs...');
  const pmidToPmcid = await pmidsToPmcids(limited);
  console.log(`\nPMC full text available: ${pmidToPmcid.size}/${limited.length} papers`);

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Sample PMID->PMCID:');
    [...pmidToPmcid.entries()].slice(0, 10)
      .forEach(([pmid, pmcid]) => console.log(`  PMID:${pmid} -> PMC${pmcid}`));
    console.log('\nRe-run without --dry-run to fetch full text.');
    return;
  }

  // Phase 2
  console.log('\nPhase 2: Fetching JATS XML and extracting Results + Methods...');
  const papers = { ...existing.papers };
  let fetched = 0, withContent = 0, notOA = 0;

  for (const [pmid, pmcid] of pmidToPmcid.entries()) {
    const pct = (++fetched / pmidToPmcid.size * 100).toFixed(1);
    process.stdout.write(`  [${pct}%] PMID:${pmid} (PMC${pmcid})... `);

    const result = await fetchFullText(pmcid);
    if (result) {
      papers[pmid] = { pmcid, ...result };
      withContent++;
      const mLen = result.methods?.length || 0;
      const rLen = result.results?.length || 0;
      const mFlag = mLen >= MAX_METHODS * 0.98 ? '!' : '';
      const rFlag = rLen >= MAX_RESULTS * 0.98 ? '!' : '';
      console.log(`OK  methods:${mLen}c${mFlag}  results:${rLen}c${rFlag}`);
    } else {
      papers[pmid] = null; // sentinel � skip on next resume run
      notOA++;
      console.log('�  (not OA or no structured sections)');
    }

    if (fetched % 100 === 0) {
      saveOutput(papers, allPmids.length);
      console.log(`  [checkpoint saved at ${fetched}]\n`);
    }
    await delay(DELAY_MS);
  }

  // Final save - strip null sentinels
  const cleanPapers = Object.fromEntries(Object.entries(papers).filter(([, v]) => v !== null));
  saveOutput(cleanPapers, allPmids.length);

  console.log('\n=== Done ===');
  console.log(`Fetched this run:       ${fetched}`);
  console.log(`With content:           ${withContent}`);
  console.log(`Not in PMC OA:          ${notOA}`);
  console.log(`Total in fulltext.json: ${Object.keys(cleanPapers).length}`);
  const sz = (fs.statSync(OUT_PATH).size / 1024 / 1024).toFixed(2);
  console.log(`File size:              ${sz} MB`);
}

main().catch(err => { console.error('\nFatal:', err); process.exit(1); });
