const bib = require('../react-app/public/data/bibliography.json');
const models = require('../react-app/public/data/animal-models.json');

const t = s => Math.ceil((s || '').length / 4); // 1 token ≈ 4 chars

const topRefs = bib.slice(0, 30);
const topRefsDeep = bib.slice(0, 15);

const poolNormal = topRefs.map((r, i) => {
  const base = `PMID:${r.pmid} — ${r.authors || ''} (${r.year}) "${r.title || ''}"`;
  if (i < 8 && r.abstract) return base + '\n   Abstract: ' + r.abstract.slice(0, 350);
  return base;
}).join('\n');

const poolDeep = topRefsDeep.map(r => {
  const base = `PMID:${r.pmid} — ${r.authors || ''} (${r.year}) "${r.title || ''}"`;
  if (r.abstract) return base + '\n   Abstract: ' + r.abstract.slice(0, 600);
  return base;
}).join('\n');

const modelList = models.map(m =>
  `${m.name} (${m.rrid || ''}): ${m.type}, ${m.background} background`
).join('\n');

const fixedEst = 1800; // intro + rules + disambiguation + KB headers

const normalSys = t(poolNormal) + t(modelList) + fixedEst;
const deepSys   = t(poolDeep)   + t(modelList) + fixedEst;

console.log('--- Token estimates (1 token ≈ 4 chars) ---\n');
console.log(`Citation pool (normal, top 30, 8 with snippets): ${poolNormal.length} chars = ~${t(poolNormal)} tokens`);
console.log(`Citation pool (deep,   top 15, all with snippets): ${poolDeep.length} chars = ~${t(poolDeep)} tokens`);
console.log(`Model list (59 models):                          ${modelList.length} chars = ~${t(modelList)} tokens`);
console.log(`Fixed sections (intro, rules, disambig, KB):     est. ~${fixedEst} tokens\n`);
console.log(`SYSTEM PROMPT — Normal mode:   ~${normalSys} tokens`);
console.log(`SYSTEM PROMPT — Deep Dive:     ~${deepSys} tokens\n`);

// Typical query: system + short user message (~150 tok) + response (~600 tok)
const rates = [
  { name: 'GPT-4o',       inp: 2.50,  out: 10.0  },
  { name: 'GPT-4.1',      inp: 2.00,  out: 8.0   },
  { name: 'GPT-4.5',      inp: 75.0,  out: 150.0 },
];

console.log('Per-query cost at public Azure OpenAI rates (system + 150 tok user + 600 tok response):');
console.log('Model       | Normal mode        | Deep Dive');
console.log('------------|--------------------|-----------');
rates.forEach(r => {
  const inN  = normalSys + 150;
  const inD  = deepSys + 150;
  const outT = 600;
  const cN = (inN / 1e6 * r.inp + outT / 1e6 * r.out);
  const cD = (inD / 1e6 * r.inp + outT / 1e6 * r.out);
  console.log(
    `${r.name.padEnd(11)} | $${cN.toFixed(4)}/query  $${(cN*100).toFixed(2)}/100 | $${cD.toFixed(4)}/query  $${(cD*100).toFixed(2)}/100`
  );
});
console.log('\nNote: conversation history adds ~100-300 tokens per prior turn.');
console.log('FlyerGPT/Azure APIM rates may differ from public list prices above.');
