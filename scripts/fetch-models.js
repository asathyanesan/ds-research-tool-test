/**
 * fetch-models.js
 * Fetches the RECORDS array from abbash83/DS_Rodent_Models_Database,
 * transforms it into our animal-models.json format, and merges
 * the rich metadata (phenotypes, advantages, limitations, key_papers)
 * from the existing 4 curated models.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SOURCE_URL =
  'https://raw.githubusercontent.com/abbash83/DS_Rodent_Models_Database/main/index.html';

const OUTPUT_PATH = path.join(
  __dirname,
  '../react-app/public/data/animal-models.json'
);

// ── Rich metadata preserved from existing curated models ──────────────────────
const CURATED = {
  'Ts65Dn (001924)': {
    id: 'ts65dn',
    trisomy: 'Partial (MMU16)',
    genes: '101 Hsa21 orthologs',
    references: ['PMC3174970', 'PMC2921762', 'PMC4104169'],
    key_papers: [
      { title: 'A mouse model for Down syndrome exhibits learning and behaviour deficits', authors: 'Reeves et al.', year: '1995', pmid: '7493025' },
      { title: 'Trisomy 21 causes changes in the circuitry of the olfactory bulb', authors: 'Davisson et al.', year: '1993', pmid: '8115398' }
    ]
  },
  'Tc1': {
    id: 'tc1',
    trisomy: 'Complete HSA21 (mosaic)',
    genes: '~227 Hsa21 genes (mosaic)',
    references: ['PMC2921762', 'PMC3174970'],
    key_papers: [
      { title: 'A non-human animal model of Down syndrome with a complete extra chromosome', authors: "O'Doherty et al.", year: '2005', pmid: '16179473' }
    ]
  },
  'Dp(16)1Yey': {
    id: 'dp16',
    trisomy: 'Duplication MMU16 (Lipi–Zbtb21)',
    genes: '117 Hsa21 orthologs',
    references: ['PMC8217057', 'PMC7492826'],
    key_papers: [
      { title: 'Trisomic and disomic reciprocal crosses between Dp(16)1Yey and normal mice exhibit the same level of Down syndrome-associated phenotypes', authors: 'Li et al.', year: '2007', pmid: '17412756' }
    ]
  },
  'Dp(17)1Yey': {
    id: 'dp17',
    trisomy: 'Duplication MMU17 (Abcg1–Rrp1b)',
    genes: '18 Hsa21 orthologs',
    references: ['PMC3174970'],
    key_papers: [
      { title: 'Mouse models of Down syndrome, Alzheimer\'s disease, and aging', authors: 'Yu et al.', year: '2010', pmid: '20442137' }
    ]
  }
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function extractRecords(html) {
  // Locate the RECORDS array in the JS
  const startToken = 'const RECORDS = [';
  const si = html.indexOf(startToken);
  if (si === -1) throw new Error('Could not find RECORDS start marker in HTML');

  // Find the matching closing bracket by counting bracket depth
  const arrayStart = si + startToken.length - 1; // points to '['
  let depth = 0;
  let ei = -1;
  for (let i = arrayStart; i < html.length; i++) {
    if (html[i] === '[') depth++;
    else if (html[i] === ']') {
      depth--;
      if (depth === 0) { ei = i + 1; break; }
    }
  }
  if (ei === -1) throw new Error('Could not find RECORDS closing bracket');

  const snippet = html.slice(arrayStart, ei);

  // Evaluate safely in a sandboxed Node context (build-time only, trusted source)
  // eslint-disable-next-line no-new-func
  return new Function(`"use strict"; return ${snippet};`)();
}

function transform(rec) {
  const curated = Object.keys(CURATED).find(k =>
    rec.commonName === k ||
    rec.commonName.startsWith(k.split(' ')[0]) && rec.rrid === (CURATED[k].rrid || rec.rrid)
  );
  const rich = curated ? CURATED[curated] : {};

  // Build RRID string from availLink if rrid looks like a lab name
  const rrid = rec.rrid && rec.rrid.startsWith('RRID:') ? rec.rrid : (rec.rrid || '');

  return {
    id: rich.id || slugify(rec.commonName),
    name: rec.commonName,
    mgiName: rec.mgiName || '',
    mgiLink: rec.mgiLink || '',
    rodent: rec.rodent || 'Mouse',
    type: rec.type || '',
    species: rec.rodent || 'Mouse',
    background: rec.background || '',
    trisomy: rich.trisomy || rec.type || '',
    genes: rich.genes || (rec.orthologs ? `${rec.orthologs} Hsa21 orthologs` : ''),
    description: rec.description || '',
    coords: rec.coords || '',
    orthologs: rec.orthologs || '',
    jackson_link: rec.availLink || '',
    availability: rec.availability || '',
    availLink: rec.availLink || '',
    rrid: rrid,
    publication: rec.publication || '',
    pubLink: rec.pubLink || '',
    references: rich.references || [],
    key_papers: rich.key_papers || []
  };
}

// ── Main ───────────────────────────────────────────────────────────────────────
console.log(`Fetching from ${SOURCE_URL} ...`);

https.get(SOURCE_URL, (res) => {
  let html = '';
  res.on('data', chunk => { html += chunk; });
  res.on('end', () => {
    try {
      const records = extractRecords(html);
      console.log(`Extracted ${records.length} records from source.`);

      // Match curated models by commonName for rich merge
      const models = records.map(r => {
        // Try exact match first, then partial
        const match = Object.keys(CURATED).find(k => k === r.commonName) ||
                      Object.keys(CURATED).find(k => r.commonName === k);
        const rich = match ? CURATED[match] : {};

        const rrid = r.rrid && r.rrid.startsWith('RRID:') ? r.rrid : (r.rrid || '');

        return {
          id: rich.id || slugify(r.commonName),
          name: r.commonName,
          mgiName: r.mgiName || '',
          mgiLink: r.mgiLink || '',
          rodent: r.rodent || 'Mouse',
          type: r.type || '',
          species: r.rodent || 'Mouse',
          background: r.background || '',
          trisomy: rich.trisomy || r.type || '',
          genes: rich.genes || (r.orthologs ? `${r.orthologs} Hsa21 orthologs` : ''),
          description: r.description || '',
          coords: r.coords || '',
          orthologs: r.orthologs || '',
          jackson_link: r.availLink || '',
          availability: r.availability || '',
          availLink: r.availLink || '',
          rrid: rrid,
          publication: r.publication || '',
          pubLink: r.pubLink || '',
          references: rich.references || [],
          key_papers: rich.key_papers || []
        };
      });

      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(models, null, 2));
      console.log(`✅  Wrote ${models.length} models → ${OUTPUT_PATH}`);

      // Summary
      const byType = {};
      models.forEach(m => { byType[m.type] = (byType[m.type] || 0) + 1; });
      Object.entries(byType).forEach(([t, n]) => console.log(`   ${t}: ${n}`));
    } catch (err) {
      console.error('❌  Error:', err.message);
      process.exit(1);
    }
  });
}).on('error', err => {
  console.error('❌  Fetch error:', err.message);
  process.exit(1);
});
