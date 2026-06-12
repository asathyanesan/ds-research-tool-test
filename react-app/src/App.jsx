import React, { useState, useRef, useEffect } from 'react';
import {
  Search, FileText, CheckSquare, BookOpen, Info, ExternalLink, Download,
  FileDown, Menu, X, ZoomIn, Sun, Moon, Send, Sparkles, ChevronDown,
  Beaker, MessageSquare, AlertTriangle, Trash2
} from 'lucide-react';
import MarkdownMessage from './MarkdownMessage';

function App() {
  /* ---------- THEME ---------- */
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('ds-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('ds-theme', theme);
  }, [theme]);

  /* ---------- STATE ---------- */
  const [activeTab, setActiveTab] = useState('models');
  const [selectedModels, setSelectedModels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-5.5');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deepDive, setDeepDive] = useState(false);
  const [modelTypeFilter, setModelTypeFilter] = useState('');
  const [modelSpeciesFilter, setModelSpeciesFilter] = useState('');
  const [calcEffectSize, setCalcEffectSize] = useState('0.8');
  const [calcAlpha, setCalcAlpha] = useState('0.05');
  const [calcPower, setCalcPower] = useState('0.80');
  const [calcAttrition, setCalcAttrition] = useState('15');
  const [calcGroups, setCalcGroups] = useState('2');
  const [designQuestion, setDesignQuestion] = useState('');
  const [designModel, setDesignModel] = useState('');
  const [designStudyType, setDesignStudyType] = useState('');
  const [designSampleSize, setDesignSampleSize] = useState('');
  const [designDuration, setDesignDuration] = useState('');
  const [designEndpoint, setDesignEndpoint] = useState('');
  const chatContainerRef = useRef(null);
  const chatInputRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isLoading]);

  /* ---------- AUTO-RESIZE TEXTAREA ---------- */
  useEffect(() => {
    const el = chatInputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, 200);
    el.style.height = next + 'px';
  }, [chatInput]);

  const [guidelines, setGuidelines] = useState([
    { id: 1, category: 'Study Design', item: 'Provide precise details of study design including primary research question', checked: false },
    { id: 2, category: 'Study Design', item: 'Explain how sample size was determined', checked: false },
    { id: 11, category: 'Animals — Source & Strain', item: 'Report source and precise strain nomenclature (e.g., Ts65Dn JAX:001924 vs JAX:005252 have subtle phenotypic differences due to Pde6b status)', checked: false },
    { id: 12, category: 'Animals — Genotype', item: 'Describe genetic modifications and genotyping method; include RRID of each strain used. Report number of generations maintained in colony (genetic drift risk)', checked: false },
    { id: 13, category: 'Animals — Sex', item: 'Report sex of all animals used; significant sex differences exist in DS models (corticosterone, behavioral, immunological). Analyse and report sex as a biological variable', checked: false },
    { id: 14, category: 'Animals — Developmental Stage', item: 'Report developmental stage at time of all procedures; DS phenotypes vary across lifespan. Specify whether neonatal, juvenile, adult, or aged cohorts were used', checked: false },
    { id: 15, category: 'Animals — Age & Weight', item: 'Report exact age (±days) and weight at start of experiment and at key timepoints; DS models often differ in weight trajectory from wild-type littermates', checked: false },
    { id: 4, category: 'Housing & Husbandry', item: 'Explain housing and husbandry conditions', checked: false },
    { id: 5, category: 'Procedures', item: 'Describe procedures in detail for each experimental group', checked: false },
    { id: 6, category: 'Procedures', item: 'Describe experimental outcomes and how they were assessed', checked: false },
    { id: 7, category: 'Statistics', item: 'Describe statistical methods for each analysis', checked: false },
    { id: 8, category: 'Statistics', item: 'Report exact P values and effect sizes where possible', checked: false },
    { id: 9, category: 'Results', item: 'Report study timeline and actual sample sizes', checked: false },
    { id: 10, category: 'Results', item: 'Present results with appropriate statistics', checked: false }
  ]);

  const [animalModels, setAnimalModels] = useState([]);
  const [bibliography, setBibliography] = useState([]);
  const [clinicalPapers, setClinicalPapers] = useState([]);

  useEffect(() => {
    fetch('/ds-research-tool-test/data/animal-models.json')
      .then(r => r.json()).then(setAnimalModels)
      .catch(e => console.error('Error loading animal models:', e));
  }, []);
  useEffect(() => {
    fetch('/ds-research-tool-test/data/bibliography.json')
      .then(r => r.json()).then(setBibliography)
      .catch(e => console.error('Error loading bibliography:', e));
  }, []);
  useEffect(() => {
    fetch('/ds-research-tool-test/data/clinical-papers.json')
      .then(r => r.json()).then(setClinicalPapers)
      .catch(e => console.error('Error loading clinical papers:', e));
  }, []);

  const [oaPmids, setOaPmids] = useState(null);
  useEffect(() => {
    fetch('/ds-research-tool-test/data/fulltext-pmids.json')
      .then(r => r.json())
      .then(data => setOaPmids(new Set(data.map(String))))
      .catch(() => setOaPmids(new Set()));
  }, []);

  const [fulltext, setFulltext] = useState(null);
  const [fulltextLoading, setFulltextLoading] = useState(false);
  useEffect(() => {
    if (deepDive && fulltext === null && !fulltextLoading) {
      setFulltextLoading(true);
      fetch('/ds-research-tool-test/data/fulltext.json')
        .then(r => r.json())
        .then(data => { setFulltext(data.papers || {}); setFulltextLoading(false); })
        .catch(() => { setFulltext({}); setFulltextLoading(false); });
    }
  }, [deepDive, fulltext, fulltextLoading]);

  const handleModelSelect = (modelId) => {
    setSelectedModels(prev =>
      prev.includes(modelId) ? prev.filter(id => id !== modelId) : [...prev, modelId]
    );
  };

  const handleGuidelineCheck = (id) => {
    setGuidelines(prev => prev.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const calculateSampleSize = () => {
    const d = parseFloat(calcEffectSize) || 0.8;
    const alpha = parseFloat(calcAlpha);
    const power = parseFloat(calcPower);
    const attrition = parseFloat(calcAttrition) / 100;
    const groups = parseInt(calcGroups) || 2;
    const zAlpha = alpha <= 0.01 ? 2.576 : alpha <= 0.05 ? 1.96 : 1.645;
    const zBeta = power >= 0.95 ? 1.645 : power >= 0.90 ? 1.282 : 0.842;
    const nRaw = Math.ceil(2 * Math.pow((zAlpha + zBeta) / d, 2));
    const nWithAttrition = Math.ceil(nRaw / (1 - attrition));
    return { nRaw, nWithAttrition, total: nWithAttrition * groups };
  };

  const downloadStudyCSV = () => {
    const r = calculateSampleSize();
    const modelName = animalModels.find(m => String(m.id) === designModel)?.name || designModel || '';
    const studyTypeLabels = { cognitive: 'Cognitive/Behavioral', molecular: 'Molecular/Biochemical', therapeutic: 'Therapeutic intervention', pathophysiology: 'Pathophysiology' };
    const rows = [
      ['Field', 'Value'],
      ['Research Question', designQuestion],
      ['Animal Model', modelName],
      ['Study Type', studyTypeLabels[designStudyType] || designStudyType],
      ['Primary Endpoint', designEndpoint],
      ['Study Duration', designDuration],
      ['Sample Size per Group (planned)', designSampleSize],
      ['', ''],
      ['--- Sample Size Calculator ---', ''],
      ["Effect Size (Cohen's d)", calcEffectSize],
      ['Alpha (α)', calcAlpha],
      ['Power (1−β)', calcPower],
      ['Attrition (%)', calcAttrition],
      ['Number of Groups', calcGroups],
      ['', ''],
      ['n/group (raw)', r.nRaw],
      ['n/group (with attrition)', r.nWithAttrition],
      ['Total Animals', r.total],
      ['', ''],
      ['Generated', new Date().toLocaleDateString()],
      ['Source', 'https://asathyanesan.github.io/ds-research-tool-test/'],
    ];
    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'study-design.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const printStudyPDF = () => {
    const r = calculateSampleSize();
    const modelName = animalModels.find(m => String(m.id) === designModel)?.name || designModel || '—';
    const studyTypeLabels = { cognitive: 'Cognitive/Behavioral', molecular: 'Molecular/Biochemical', therapeutic: 'Therapeutic intervention', pathophysiology: 'Pathophysiology' };
    const html = `<!DOCTYPE html><html><head>
    <title>Study Design — DS Research Tool</title>
    <style>
      body { font-family: 'Inter', Arial, sans-serif; max-width: 680px; margin: 36px auto; color: #222; font-size: 13px; }
      h1 { font-size: 18px; color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 6px; margin-bottom: 16px; }
      h2 { font-size: 13px; font-weight: bold; color: #0f766e; margin: 20px 0 6px; text-transform: uppercase; letter-spacing: 0.05em; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 6px 10px; border: 1px solid #ddd; }
      td:first-child { font-weight: bold; background: #f0fdfa; width: 42%; }
      .result-grid { display: flex; gap: 16px; justify-content: center; margin: 16px 0; }
      .result-box { text-align: center; border: 2px solid #5eead4; border-radius: 8px; padding: 12px 20px; min-width: 120px; }
      .result-num { font-size: 28px; font-weight: bold; }
      .result-label { font-size: 11px; color: #555; margin-top: 2px; }
      .note { font-size: 11px; color: #666; text-align: center; margin-top: 4px; }
      .footer { margin-top: 28px; font-size: 10px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 8px; }
    </style></head><body>
    <h1>Study Design Summary</h1>
    <h2>Study Details</h2>
    <table>
      <tr><td>Research Question</td><td>${designQuestion || '—'}</td></tr>
      <tr><td>Animal Model</td><td>${modelName}</td></tr>
      <tr><td>Study Type</td><td>${studyTypeLabels[designStudyType] || designStudyType || '—'}</td></tr>
      <tr><td>Primary Endpoint</td><td>${designEndpoint || '—'}</td></tr>
      <tr><td>Study Duration</td><td>${designDuration || '—'}</td></tr>
      <tr><td>Planned n/group</td><td>${designSampleSize || '—'}</td></tr>
    </table>
    <h2>Sample Size Calculator</h2>
    <p style="font-size:11px;color:#666;margin:0 0 8px">(Two-group comparison, Cohen&apos;s d method)</p>
    <table>
      <tr><td>Effect Size (Cohen&apos;s d)</td><td>${calcEffectSize}</td></tr>
      <tr><td>Alpha (α)</td><td>${calcAlpha}</td></tr>
      <tr><td>Power (1−β)</td><td>${calcPower}</td></tr>
      <tr><td>Attrition</td><td>${calcAttrition}%</td></tr>
      <tr><td>Number of Groups</td><td>${calcGroups}</td></tr>
    </table>
    <div class="result-grid">
      <div class="result-box"><div class="result-num" style="color:#0f766e">${r.nRaw}</div><div class="result-label">n/group (raw)</div></div>
      <div class="result-box"><div class="result-num" style="color:#0891b2">${r.nWithAttrition}</div><div class="result-label">n/group (+attrition)</div></div>
      <div class="result-box"><div class="result-num" style="color:#059669">${r.total}</div><div class="result-label">total animals</div></div>
    </div>
    <p class="note">DS guidelines: n≥10/group (behavioural) · n≥6/group (molecular)</p>
    <div class="footer">Generated ${new Date().toLocaleDateString()} · DS Research Tool · https://asathyanesan.github.io/ds-research-tool-test/</div>
    </body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  const WORKER_BASE = import.meta.env.VITE_WORKER_URL;

  const getRelevantRefs = (query, topN = 30, pinPmids = []) => {
    const existingPmids = new Set(bibliography.map(e => String(e.pmid)));
    const pool = [...bibliography, ...clinicalPapers.filter(e => !existingPmids.has(String(e.pmid)))];
    if (!pool.length) return [];
    const stopWords = new Set(['the','a','an','in','of','for','and','or','to','is','are',
      'was','were','with','that','this','it','be','as','at','by','from','on','not',
      'but','have','has','had','do','does','did','will','would','could','should',
      'may','might','can','about','which','what','how','when','where','who',
      'their','they','them','these','those','its','into','than','then','there',
      'been','being','also','more','some','such','no','if','so','we','you']);
    const words = query.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
    const pinnedSet = new Set(pinPmids.map(String));
    const scored = pool.map(entry => {
      if (pinnedSet.has(String(entry.pmid))) return { entry, score: Infinity };
      if (!words.length) return { entry, score: 0 };
      const meshText = (entry.mesh || []).join(' ');
      const kwText = (entry.keywords || []).join(' ');
      const text = ((entry.title || '') + ' ' + (entry.authors || '') + ' ' + (entry.abstract || '').slice(0, 600) + ' ' + meshText + ' ' + kwText).toLowerCase();
      const score = words.reduce((acc, w) => acc + (text.includes(w) ? 1 : 0), 0);
      return { entry, score };
    });
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score || (parseInt(b.entry.year) || 0) - (parseInt(a.entry.year) || 0))
      .slice(0, topN)
      .map(s => s.entry);
  };

  const buildSystemPrompt = (models, relevantRefs = [], withAbstracts = false, focusPmids = [], fulltextMap = {}, oaSet = new Set()) => {
    const jaxRrid = (url) => {
      const id = url?.split('/strain/')?.[1];
      return id ? `RRID:IMSR_JAX:${id}` : '';
    };
    const pmidFromUrl = (url) => {
      const m = url?.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/);
      return m ? m[1] : null;
    };

    const seenPmids = new Set();
    const modelBibEntries = [];
    models.forEach(m => {
      const pmid = pmidFromUrl(m.pubLink);
      if (pmid && !seenPmids.has(pmid)) {
        seenPmids.add(pmid);
        modelBibEntries.push(`PMID:${pmid} — ${m.publication || ''} [re: ${m.name}]`);
      }
      (m.key_papers || []).forEach(p => {
        if (p.pmid && !seenPmids.has(String(p.pmid))) {
          seenPmids.add(String(p.pmid));
          modelBibEntries.push(`PMID:${p.pmid} — ${p.authors} (${p.year}) "${p.title}" [re: ${m.name}]`);
        }
      });
    });

    const focusSet = new Set(focusPmids.map(String));
    const extraRefs = relevantRefs
      .filter(r => !seenPmids.has(String(r.pmid)))
      .map((r, idx) => {
        const humanTag = r.population === 'human' ? ' [human study]' : '';
        const isFocus = focusSet.has(String(r.pmid));
        const focusTag = isFocus ? ' [FOCUS]' : '';
        const base = `PMID:${r.pmid} — ${r.authors} (${r.year}) "${r.title}"${humanTag}${focusTag}`;
        if (isFocus) {
          const ft = fulltextMap[String(r.pmid)];
          if (ft && (ft.results || ft.methods || ft.figures)) {
            const parts = [];
            if (ft.results) parts.push(`RESULTS SECTION:\n${ft.results}`);
            if (ft.methods) parts.push(`METHODS SECTION:\n${ft.methods}`);
            if (ft.figures) parts.push(`FIGURE LEGENDS:\n${ft.figures}`);
            return `${base}\n   [FULL TEXT AVAILABLE]\n   ${parts.join('\n   ')}`;
          }
          if (r.abstract) {
            const extraFields = [
              r.abstract,
              r.keywords?.length ? `Keywords: ${r.keywords.join('; ')}` : null,
              r.mesh?.length ? `MeSH: ${r.mesh.join('; ')}` : null,
              r.tldr ? `TL;DR: ${r.tldr}` : null,
            ].filter(Boolean).join('\n   ');
            return `${base}\n   [NOT IN PMC OA — abstract only]\n   Abstract: ${extraFields}`;
          }
          return `${base}\n   [NOT IN PMC OA — no abstract available]`;
        }
        const isOa = oaSet.has(String(r.pmid));
        const oaTag = isOa && !withAbstracts ? ' [OA — full text available]' : '';
        const baseWithOa = oaTag ? base.replace(/( \[FOCUS\])?$/, `${oaTag}$1`) : base;
        const snippetLen = withAbstracts ? 350 : (idx < 8 ? 350 : 0);
        if (snippetLen > 0 && r.abstract) {
          const snippet = r.abstract.slice(0, snippetLen).trimEnd();
          return `${baseWithOa}\n   Abstract: ${snippet}${r.abstract.length > snippetLen ? '…' : ''}`;
        }
        if (r.tldr) {
          return `${baseWithOa}\n   Summary: ${r.tldr}`;
        }
        return baseWithOa;
      });
    const allBibEntries = [...modelBibEntries, ...extraRefs];
    const citationPool = allBibEntries.map((e, i) => `[${i + 1}] ${e}`).join('\n');

    const kbModels = models.filter(m => m.key_papers && m.key_papers.length > 0);
    const kb = kbModels.length > 0
      ? kbModels.map(m => {
          const rrid = m.rrid || jaxRrid(m.jackson_link);
          const papers = m.key_papers.map(p => `${p.authors} (${p.year}) PMID:${p.pmid} — "${p.title}"`).join('; ');
          return `**${m.name}** (${rrid}) — ${m.background} background, ${m.type || m.trisomy || ''}, ${m.orthologs || m.genes || ''} Hsa21 orthologs. Description: ${m.description || ''}. VERIFIED KEY PAPERS: ${papers}`;
        }).join('\n')
      : '(models loading)';
    const allModelsList = models.map(m => `${m.name} (${m.rrid || ''}): ${m.type}, ${m.background} background, ${m.orthologs || ''} orthologs`).join('\n');

    return {
      role: 'system',
      content: `You are an expert research assistant specialising in Down syndrome (DS) animal models, translational research, and experimental design. Your expertise includes experimental design, ARRIVE guidelines, sample size calculations, behavioural and molecular endpoints, immunology/interferon signalling in DS, and human–rodent translational concordance.

## SCOPE CONSTRAINT — HARD RULE:
Only respond to queries that are directly about Down syndrome or have a clear, substantive intersection with Down syndrome research (e.g. trisomy 21, DS animal models, Hsa21, DYRK1A, interferon signalling in DS, Alzheimer's in DS, etc.). General biomedical questions are acceptable only if they are framed in the context of DS.
If a query has no connection to Down syndrome, respond ONLY with: "I'm a Down syndrome research assistant — I can only help with queries related to DS or trisomy 21. Please ask something related to Down syndrome research."
Do NOT attempt to answer off-topic queries even partially.

## CURATED DS LITERATURE — cite only from this list (${allBibEntries.length} papers; rodent model studies from the DS Rodent Model Bibliography plus clinical DS papers tagged [human study] — selected for relevance to this query). Use [human study] papers when answering questions about human concordance, translational relevance, or clinical findings:
${citationPool}

THIS IS A HARD CONSTRAINT. Do not cite any paper not listed above. If a claim cannot be supported by a paper in this list, write: *(not in the curated DS bibliography)*. Do NOT suggest PubMed search strings — every paper cited above already has a clickable [[PMID:XXXXXXX]] link. When asked for more detail on a cited paper, exhaust all available abstract content first, then invite the user: *— tolle, lege — follow the [[PMID:XXXXXXX]] link above to read the full text.*

## AUTHORITATIVE KNOWLEDGE BASE — verified models with full detail:
${kb}

## COMPLETE MODEL LIST (${models.length} models — do not invent details beyond what is listed):
${allModelsList}

## CRITICAL MODEL DISAMBIGUATION — these pairs are frequently confused; treat them as entirely distinct models:

**Tc1 vs TcMAC21** — both are transchromosomic mouse models carrying a freely segregating copy of human chromosome 21, but they are NOT interchangeable:
| Feature | Tc1 | TcMAC21 |
|---|---|---|
| Hsa21 coverage | ~75% | ~93% |
| Mosaicism | YES — mosaic; not all cells carry the extra chromosome | NO — non-mosaic |
| Chromosome integrity | Internal deletions and rearrangements present (Gribble et al., 2013) | Mammalian Artificial Chromosome (MAC) — much cleaner representation |
| Protein-coding Hsa21 orthologs | ~227 genes (includes duplications) | 144 orthologs (199 PCGs total, 581 including nPCGs) |
| Key reference | Gribble et al. 2013 [PMID:23483870] | Kazuki et al. 2020 [PMID:32597754] |

NEVER attribute TcMAC21 findings to Tc1 or vice versa. When a user mentions "Tc1" they mean the older, mosaic ~75% model; "TcMAC21" is the newer, non-mosaic ~93% model. Always name both in full when discussing transchromosomic models.

## CITATION FORMAT RULES:
1. Cite ONLY papers from the curated DS bibliography above, using their PMID as given.
2. Format citations as: Author et al. (Year) [PMID:XXXXXXX] — always use this exact square-bracket format; it becomes a clickable PubMed link automatically.
3. NEVER invent or guess a PMID, author, title, or year.
4. If no paper in the bibliography supports a claim, say so — do NOT fall back to training-data citations.
5. It is far better to provide one verified citation than three invented ones.
6. When uncertain about a factual claim, say: "Evidence suggests…" or "This has not been definitively established in the DS literature provided."
7. IMPORTANT — abstracts: When a bibliography entry above includes an "Abstract:" field, that text IS the paper's content. Use it directly to answer questions about what that paper found or reported. NEVER say "I cannot access PubMed" or "I cannot check the abstract" — if the abstract is in the entry above, you already have it. When asked to "look deeper" into a paper, quote the most relevant sentences verbatim from what is available, extract any numerical values (n, p-values, effect sizes, measurements), then close with: *— tolle, lege — follow the [[PMID:XXXXXXX]] link above for the full text.*

## BEST MODEL DEFLECTION — HARD RULE:
If a user asks "which model is best", "what model should I use", "which model do you recommend", "best DS model", or any variant seeking a single top-ranked model, do NOT name one model as superior. Instead:
1. State warmly that every DS model has unique utility, strengths, and weaknesses — and that each has contributed distinct and valuable knowledge to the DS biomedical field.
2. Redirect constructively: ask what the specific research question, phenotype of interest, age group, and primary endpoint are.
3. Note briefly that the right choice depends on gene coverage (partial vs full trisomy), mosaicism, available phenotypic data, colony background, and translational concordance for the intended endpoint.
4. You may summarise 2–3 model categories and their trade-offs, but do not rank them.

${!withAbstracts ? `## DEEP DIVE SUGGESTION RULE:
When the user asks about a specific paper or a small group (1–5 papers by PMID or name), check whether any of those papers show [OA — full text available] in the citation pool above. If so, after delivering your abstract-level response, append a brief suggestion on a new line:
💡 Full text is available for [those PMIDs] in the PMC Open Access corpus. Turn on **Deep Dive** (toggle above the chat) and ask again to extract verbatim Results, Methods, and Figure Legends.
Only add this suggestion when: (a) the user is asking about 1–5 specific papers, AND (b) at least one of those papers shows [OA — full text available] in the citation pool, AND (c) Deep Dive is not already on.` : ''}

${withAbstracts && focusPmids.length > 0 ? `## DEEP DIVE MODE — ACTIVE (${focusPmids.length} focus paper${focusPmids.length > 1 ? 's' : ''})
Papers marked [FOCUS] in the citation pool are the primary targets. For each [FOCUS] paper:
1. If the entry shows [FULL TEXT AVAILABLE], the RESULTS SECTION, METHODS SECTION, and FIGURE LEGENDS text is provided — treat this as the verbatim paper content. Quote specific sentences with quotation marks and label the source (Methods / Results / Figure legend N).
2. If the entry shows [NOT IN PMC OA — abstract only], do NOT attempt to extract section-level detail from the abstract. Instead respond: "Full text for this paper is not available in PMC Open Access. *— tolle, lege — follow the [[PMID:XXXXXXX]] link to access the full text directly.*" You may briefly summarise what the abstract states, but be explicit that section-level data (specific results, methods detail) cannot be provided.
3. If the entry shows [NOT IN PMC OA — no abstract available], respond: "No text is available for this paper in the curated corpus. *— tolle, lege — follow the [[PMID:XXXXXXX]] link to access it directly.*"
4. **IMPORTANT — index not yet loaded:** If a [FOCUS] paper shows neither [FULL TEXT AVAILABLE] nor [NOT IN PMC OA] — i.e. it has only a short abstract snippet — this means the full-text index had not finished loading when this query was sent. In this case, apologise briefly: "I'm sorry — it looks like the full-text index was still loading when you sent this query. Please ask again — the index should now be ready." Do not attempt section-level extraction from the snippet.
5. For [FULL TEXT AVAILABLE] papers: extract every numerical value present across Results, Methods, and Figure Legends — n per group, p-values, effect sizes, confidence intervals, specific measurements. If a value is NOT in the provided text, state: "Not stated in the available text."
6. Do not extrapolate or estimate values not present in the text.
7. Close with: *— tolle, lege — follow the [[PMID:XXXXXXX]] link for complete methods, supplementary data, and figures.*` : ''}`
    };
  };

  async function* streamSSE(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') return;
        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch { /* skip */ }
      }
    }
  }

  const callFlyerGPT55 = async (messages, onToken) => {
    if (!WORKER_BASE) throw new Error('VITE_WORKER_URL not configured');
    const url = `${WORKER_BASE}/openai/deployments/gpt-5.5/chat/completions?api-version=2024-10-21`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, max_completion_tokens: 8000, stream: true })
    });
    if (!response.ok) {
      const raw = await response.text().catch(() => '');
      const msg = (() => { try { return JSON.parse(raw)?.error?.message || ''; } catch { return raw; } })();
      if (response.status === 429) throw new Error(msg || 'GPT-5.5 rate limit reached (1,000 tokens/min) — please wait ~60 seconds and try again.');
      throw new Error(`GPT-5.5 error ${response.status}: ${msg || response.statusText}`);
    }
    let full = '';
    for await (const token of streamSSE(response)) {
      full += token;
      onToken(full);
    }
    return full;
  };

  const callFlyerGPT54 = async (messages, onToken) => {
    if (!WORKER_BASE) throw new Error('VITE_WORKER_URL not configured');
    const url = `${WORKER_BASE}/openai/deployments/gpt-5.4/chat/completions?api-version=2024-10-21`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, max_completion_tokens: 8000, temperature: 0.3, stream: true })
    });
    if (!response.ok) {
      const raw = await response.text().catch(() => '');
      const msg = (() => { try { return JSON.parse(raw)?.error?.message || ''; } catch { return raw; } })();
      if (response.status === 429) throw new Error(msg || 'GPT-5.4 rate limit reached — please wait a moment and try again.');
      throw new Error(`GPT-5.4 error ${response.status}: ${msg || response.statusText}`);
    }
    let full = '';
    for await (const token of streamSSE(response)) {
      full += token;
      onToken(full);
    }
    return full;
  };

  const linkifyPmids = (text) => {
    return text.replace(/\[PMID:(\d{5,9})\](?!\()/g,
      (_, pmid) => `[[PMID:${pmid}]](https://pubmed.ncbi.nlm.nih.gov/${pmid}/)`);
  };

  const handleChat = async (userMessage) => {
    if (!userMessage.trim()) return;
    setIsLoading(true);
    const modelLabel = selectedModel === 'gpt-5.5' ? 'GPT-5.5' : 'GPT-5.4';
    setLoadingStatus(`Sending to ${modelLabel}...`);
    setChatInput('');
    const newMessage = { role: 'user', content: userMessage };
    const updatedMessages = [...chatMessages, newMessage];
    const streamingIdx = updatedMessages.length;
    setChatMessages([...updatedMessages, { role: 'assistant', content: '' }]);
    try {
      const recentContext = chatMessages
        .filter(m => m.role !== 'system')
        .slice(-4)
        .map(m => m.content)
        .join(' ');
      const ragQuery = `${recentContext} ${userMessage}`.trim();
      const mentionedPmids = [...ragQuery.matchAll(/\b(\d{7,9})\b/g)].map(m => m[1]);
      const focusPmids = deepDive && mentionedPmids.length > 0 ? mentionedPmids.slice(0, 5) : [];
      const relevantRefs = getRelevantRefs(ragQuery, deepDive ? 12 : 30, mentionedPmids);
      const systemPrompt = buildSystemPrompt(animalModels, relevantRefs, deepDive, focusPmids, fulltext || {}, oaPmids || new Set());
      const messagesWithSystem = [systemPrompt, ...updatedMessages];

      const onToken = (partial) => {
        setChatMessages(prev => {
          const next = [...prev];
          next[streamingIdx] = { role: 'assistant', content: partial };
          return next;
        });
      };

      setLoadingStatus('');
      const responseText = selectedModel === 'gpt-5.5'
        ? await callFlyerGPT55(messagesWithSystem, onToken)
        : await callFlyerGPT54(messagesWithSystem, onToken);

      setChatMessages(prev => {
        const next = [...prev];
        next[streamingIdx] = { role: 'assistant', content: linkifyPmids(responseText) };
        return next;
      });
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => {
        const next = [...prev];
        next[streamingIdx] = {
          role: 'assistant',
          content: `⚠️ **Error contacting ${modelLabel}**: ${error.message}`
        };
        return next;
      });
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  const exportChecklist = () => {
    const completedItems = guidelines.filter(g => g.checked);
    const exportText = `ARRIVE Guidelines Checklist\nGenerated: ${new Date().toLocaleString()}\n${'='.repeat(60)}\n\nCOMPLETED ITEMS:\n${completedItems.map(item => `✓ ${item.category}: ${item.item}`).join('\n')}\n\nREMAINING ITEMS:\n${guidelines.filter(g => !g.checked).map(item => `☐ ${item.category}: ${item.item}`).join('\n')}\n\nDS Preclinical Research Assistant - https://asathyanesan.github.io/ds-research-tool-test/\n`;
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'arrive-checklist.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadConversation = () => {
    if (chatMessages.length === 0) { alert('No conversation to download yet!'); return; }
    const conversationText = `DS Preclinical Research Assistant - Conversation Export
Generated: ${new Date().toLocaleString()}
${'='.repeat(60)}

${chatMessages.map((msg) => {
  const role = msg.role === 'user' ? 'YOU' : 'AI ASSISTANT';
  const divider = '\n' + '-'.repeat(60) + '\n';
  return `${role}:\n${msg.content}${divider}`;
}).join('\n')}

DS Preclinical Research Assistant - https://asathyanesan.github.io/ds-research-tool-test/
`;
    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ds-conversation-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadLastAnswer = () => {
    const lastAssistantMsg = [...chatMessages].reverse().find(msg => msg.role === 'assistant');
    if (!lastAssistantMsg) { alert('No AI response to download yet!'); return; }
    const answerText = `DS Preclinical Research Assistant - Answer Export
Generated: ${new Date().toLocaleString()}
${'='.repeat(60)}

${lastAssistantMsg.content}

${'='.repeat(60)}
DS Preclinical Research Assistant - https://asathyanesan.github.io/ds-research-tool-test/
`;
    const blob = new Blob([answerText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ds-answer-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearChat = () => {
    if (chatMessages.length === 0) return;
    if (window.confirm('Clear the conversation? This cannot be undone.')) {
      setChatMessages([]);
    }
  };

  const filteredModels = animalModels.filter(model => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (model.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (model.background || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (model.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (model.rrid || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !modelTypeFilter || (model.type || '') === modelTypeFilter;
    const matchesSpecies = !modelSpeciesFilter || (model.species || '') === modelSpeciesFilter;
    return matchesSearch && matchesType && matchesSpecies;
  });

  /* ---------- UI HELPERS ---------- */
  const tabs = [
    { id: 'models', label: 'Animal Models', icon: Search },
    { id: 'compare', label: 'Compare', icon: FileText },
    { id: 'design', label: 'Study Design', icon: Beaker },
    { id: 'guidelines', label: 'ARRIVE Check', icon: CheckSquare },
    { id: 'chat', label: 'AI Assistant', icon: MessageSquare }
  ];

  const examplePrompts = [
    'What bone and craniofacial phenotypes have been reported in male Tc1 and Ts65Dn mice? Tabulate with citations.',
    'Compare interferon-pathway immune phenotypes in Tc1 vs TcMAC21 — key differences and supporting papers?',
    'What n per group is needed to detect Morris water maze deficits in male Ts65Dn mice aged 3–4 months?',
    'What hippocampal LTP deficits have been shown in Dp1Tyb mice? Cite specific papers.',
    'Which DS mouse models show cardiac septal defects, and what are the key papers?'
  ];

  return (
    <div className="min-h-screen font-sans bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="flex h-screen overflow-hidden">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ===== SIDEBAR ===== */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col transform transition-transform duration-300 ease-out md:relative md:translate-x-0 md:z-auto
          bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/70 dark:border-slate-800
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Brand */}
          <div className="p-5 border-b border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white dark:bg-slate-100 ring-1 ring-teal-200 dark:ring-teal-700 shadow-md shadow-teal-500/20 flex items-center justify-center overflow-hidden">
              <img src="/ds-research-tool-test/t21rs-logo.svg" alt="T21RS" className="h-10 w-10 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white truncate">T21RS DS Models</h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Research Assistant</p>
            </div>
            <button
              className="md:hidden p-1.5 -mr-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 overflow-y-auto">
            <div className="space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                    className={`group w-full px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm font-medium transition-all
                      ${active
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'}`}
                  >
                    <Icon size={18} className={active ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-teal-500'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Feature card */}
            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 dark:from-teal-950/40 dark:via-cyan-950/40 dark:to-emerald-950/40 ring-1 ring-teal-100 dark:ring-teal-900/60">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-teal-600 dark:text-teal-400" />
                <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">Features</p>
              </div>
              <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <li>• Evidence-based citations</li>
                <li>• ARRIVE compliance tracking</li>
                <li>• Deep-Dive full-text RAG</li>
              </ul>
              <p className="mt-2.5 text-[10px] text-teal-700/80 dark:text-teal-400/80">
                <span className="font-semibold">AI:</span> GPT-5.5 &amp; GPT-5.4 · FlyerGPT
              </p>
            </div>
          </nav>

          {/* Theme toggle */}
          <div className="p-3 border-t border-slate-200/70 dark:border-slate-800">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
            >
              <span className="flex items-center gap-3">
                {theme === 'dark' ? <Moon size={18} className="text-emerald-400" /> : <Sun size={18} className="text-amber-500" />}
                {theme === 'dark' ? 'Dark mode' : 'Light mode'}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">Toggle</span>
            </button>
          </div>
        </aside>

        {/* ===== MAIN ===== */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Top header */}
          <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800 px-4 md:px-8 py-3.5">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={22} />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {activeTab === 'models' && 'Animal Models Database'}
                  {activeTab === 'compare' && 'Model Comparison'}
                  {activeTab === 'design' && 'Study Design Guide'}
                  {activeTab === 'guidelines' && 'ARRIVE Guidelines Checklist'}
                  {activeTab === 'chat' && 'AI Research Assistant'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeTab === 'models' && 'Search and explore Down syndrome animal models'}
                  {activeTab === 'compare' && 'Compare selected models side-by-side'}
                  {activeTab === 'design' && 'Experimental design recommendations'}
                  {activeTab === 'guidelines' && 'Track your compliance with reporting standards'}
                  {activeTab === 'chat' && 'Evidence-grounded answers on DS animal models'}
                </p>
              </div>
              {/* Desktop theme quick-toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="hidden md:inline-flex items-center justify-center h-9 w-9 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </header>

          {/* ===== CONTENT ===== */}
          <div className={`flex-1 overflow-auto ${activeTab === 'chat' ? '' : 'p-4 md:p-8'}`}>
            <div className={`${activeTab === 'chat' ? 'h-full' : 'max-w-7xl mx-auto'}`}>

              {/* MODELS TAB */}
              {activeTab === 'models' && (
                <div className="bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6">
                  <div className="mb-4 p-3 bg-teal-50 dark:bg-teal-950/40 ring-1 ring-teal-100 dark:ring-teal-900/60 rounded-xl text-xs text-teal-800 dark:text-teal-300">
                    Model data sourced from{' '}
                    <a href="https://github.com/abbash83/DS_Rodent_Models_Database" target="_blank" rel="noopener noreferrer" className="font-semibold underline">abbash83/DS_Rodent_Models_Database</a>
                    {' '}· Updated from: Folz, A., Sloan, K., Roper, R.J. (2025). <em>Mouse Models of Down Syndrome</em>. Springer.
                  </div>
                  <div className="mb-4">
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                      <input
                        type="text"
                        placeholder="Search models by name, type, background, or RRID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <select value={modelTypeFilter} onChange={e => setModelTypeFilter(e.target.value)}
                        className="text-sm p-2 bg-white dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none">
                        <option value="">All Types</option>
                        {[...new Set(animalModels.map(m => m.type).filter(Boolean))].sort().map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <select value={modelSpeciesFilter} onChange={e => setModelSpeciesFilter(e.target.value)}
                        className="text-sm p-2 bg-white dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none">
                        <option value="">All Species</option>
                        {[...new Set(animalModels.map(m => m.species).filter(Boolean))].sort().map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {(modelTypeFilter || modelSpeciesFilter) && (
                        <button onClick={() => { setModelTypeFilter(''); setModelSpeciesFilter(''); }}
                          className="text-sm px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors">
                          Clear filters
                        </button>
                      )}
                      <span className="ml-auto text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                        {filteredModels.length} of {animalModels.length} models
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {filteredModels.map(model => (
                      <div
                        key={model.id}
                        className={`rounded-2xl p-5 cursor-pointer transition-all ring-1
                          ${selectedModels.includes(model.id)
                            ? 'ring-teal-500 bg-teal-50/60 dark:bg-teal-950/30 shadow-md shadow-teal-500/10'
                            : 'ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-900/40 hover:ring-teal-300 dark:hover:ring-teal-700 hover:shadow-md'}`}
                        onClick={() => handleModelSelect(model.id)}
                      >
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{model.name}</h3>
                          <div className="flex gap-1.5 flex-wrap items-center">
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">{model.species}</span>
                            {model.type && <span className="text-[10px] bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full">{model.type}</span>}
                            <a
                              href={model.jackson_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-sm mb-3 text-slate-700 dark:text-slate-300">
                          <div><span className="font-medium text-slate-500 dark:text-slate-400">Background:</span> {model.background}</div>
                          <div><span className="font-medium text-slate-500 dark:text-slate-400">Trisomy:</span> {model.trisomy}</div>
                          <div><span className="font-medium text-slate-500 dark:text-slate-400">Genes:</span> {model.genes}</div>
                          <div>
                            <span className="font-medium text-slate-500 dark:text-slate-400">RRID:</span>{' '}
                            <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {model.rrid}
                            </span>
                          </div>
                        </div>

                        {model.description && (
                          <div className="mb-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-3">
                            {model.description}
                          </div>
                        )}
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Click to select for comparison
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* COMPARE TAB */}
              {activeTab === 'compare' && (
                <div className="bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6">
                  <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">Model Comparison</h2>
                  {selectedModels.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 dark:text-slate-400">
                      <FileText size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                      <p>Select models from the Animal Models tab to compare them here</p>
                    </div>
                  ) : (
                    <div>
                      <div className="overflow-x-auto mb-6">
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/60">
                              <th className="border border-slate-200 dark:border-slate-700 p-3 text-left">Feature</th>
                              {selectedModels.map(modelId => {
                                const model = animalModels.find(m => m.id === modelId);
                                return <th key={modelId} className="border border-slate-200 dark:border-slate-700 p-3 text-center">{model.name}</th>;
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {['background', 'trisomy', 'genes', 'rrid'].map(feature => (
                              <tr key={feature}>
                                <td className="border border-slate-200 dark:border-slate-700 p-3 font-medium capitalize">
                                  {feature === 'rrid' ? 'RRID' : feature}
                                </td>
                                {selectedModels.map(modelId => {
                                  const model = animalModels.find(m => m.id === modelId);
                                  return (
                                    <td key={modelId} className="border border-slate-200 dark:border-slate-700 p-3 text-center">
                                      {feature === 'rrid' ? (
                                        <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                          {model[feature]}
                                        </span>
                                      ) : (
                                        model[feature]
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        {selectedModels.map(modelId => {
                          const model = animalModels.find(m => m.id === modelId);
                          return (
                            <div key={modelId} className="bg-slate-50 dark:bg-slate-800/40 ring-1 ring-slate-200 dark:ring-slate-700 rounded-2xl p-4">
                              <div className="flex justify-between items-start mb-3">
                                <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{model.name}</h3>
                                <span className="font-mono text-xs bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 px-2 py-1 rounded">
                                  {model.rrid}
                                </span>
                              </div>

                              {model.description && (
                                <div className="mb-3">
                                  <h4 className="font-medium text-slate-700 dark:text-slate-300">Description</h4>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{model.description}</p>
                                </div>
                              )}
                              {model.key_papers && model.key_papers.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-teal-700 dark:text-teal-300">Key Papers</h4>
                                  <ul className="text-sm list-disc list-inside mt-1">
                                    {model.key_papers.map((p, idx) => (
                                      <li key={idx}>
                                        <a href={`https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/`} target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-400 hover:underline">
                                          {p.authors} ({p.year})
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* DESIGN TAB */}
              {activeTab === 'design' && (
                <div className="bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6">
                  <h2 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">Study Design Wizard</h2>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Research Question</label>
                        <textarea
                          value={designQuestion}
                          onChange={e => setDesignQuestion(e.target.value)}
                          placeholder="What is your main research question? e.g., 'Does compound X improve learning deficits in Ts65Dn mice?'"
                          className="w-full p-3 bg-white dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-900 dark:text-slate-100"
                          rows="3"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Animal Model</label>
                          <select value={designModel} onChange={e => setDesignModel(e.target.value)} className="w-full p-3 bg-white dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none">
                            <option value="">Select model...</option>
                            {animalModels.map(model => (
                              <option key={model.id} value={model.id}>{model.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Study Type</label>
                          <select value={designStudyType} onChange={e => setDesignStudyType(e.target.value)} className="w-full p-3 bg-white dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none">
                            <option value="">Select type...</option>
                            <option value="cognitive">Cognitive/Behavioral</option>
                            <option value="molecular">Molecular/Biochemical</option>
                            <option value="therapeutic">Therapeutic intervention</option>
                            <option value="pathophysiology">Pathophysiology</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Sample Size per Group</label>
                          <input
                            type="number"
                            value={designSampleSize}
                            onChange={e => setDesignSampleSize(e.target.value)}
                            placeholder="e.g., 10"
                            className="w-full p-3 bg-white dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Study Duration</label>
                          <input
                            type="text"
                            value={designDuration}
                            onChange={e => setDesignDuration(e.target.value)}
                            placeholder="e.g., 8 weeks"
                            className="w-full p-3 bg-white dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Primary Endpoint</label>
                        <input
                          type="text"
                          value={designEndpoint}
                          onChange={e => setDesignEndpoint(e.target.value)}
                          placeholder="e.g., Performance in Morris Water Maze"
                          className="w-full p-3 bg-white dark:bg-slate-800/60 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 dark:from-teal-950/40 dark:via-cyan-950/40 dark:to-emerald-950/40 ring-1 ring-teal-100 dark:ring-teal-900/60 p-5 rounded-2xl">
                      <h3 className="font-semibold text-teal-800 dark:text-teal-300 mb-4 flex items-center gap-2">
                        🧮 Sample Size Calculator
                        <span className="text-xs font-normal text-teal-600 dark:text-teal-400">(two-group, Cohen's d)</span>
                      </h3>

                      <div className="mb-4">
                        <label className="block text-xs font-semibold text-teal-700 dark:text-teal-300 mb-2">Effect Size (Cohen's d)</label>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {[['0.2','Small'],['0.5','Medium'],['0.8','Large / DS Behav.'],['1.0','DS Molecular']].map(([v, label]) => (
                            <button key={v} onClick={() => setCalcEffectSize(v)}
                              className={`text-xs px-2 py-1 rounded-lg transition-colors ${calcEffectSize === v ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-800 ring-1 ring-teal-200 dark:ring-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-slate-700'}`}>
                              {label}
                            </button>
                          ))}
                        </div>
                        <input type="number" step="0.1" min="0.1" max="3" value={calcEffectSize}
                          onChange={e => setCalcEffectSize(e.target.value)}
                          className="w-full p-2 ring-1 ring-teal-200 dark:ring-teal-800 rounded-lg text-sm bg-white dark:bg-slate-800" />
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <label className="block text-xs font-semibold text-teal-700 dark:text-teal-300 mb-1">Alpha (α)</label>
                          <select value={calcAlpha} onChange={e => setCalcAlpha(e.target.value)}
                            className="w-full p-2 ring-1 ring-teal-200 dark:ring-teal-800 rounded-lg text-sm bg-white dark:bg-slate-800">
                            <option value="0.05">0.05</option>
                            <option value="0.01">0.01</option>
                            <option value="0.10">0.10</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-teal-700 dark:text-teal-300 mb-1">Power (1−β)</label>
                          <select value={calcPower} onChange={e => setCalcPower(e.target.value)}
                            className="w-full p-2 ring-1 ring-teal-200 dark:ring-teal-800 rounded-lg text-sm bg-white dark:bg-slate-800">
                            <option value="0.80">0.80</option>
                            <option value="0.90">0.90</option>
                            <option value="0.95">0.95</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <label className="block text-xs font-semibold text-teal-700 dark:text-teal-300 mb-1">Attrition: {calcAttrition}%</label>
                          <input type="range" min="0" max="30" value={calcAttrition}
                            onChange={e => setCalcAttrition(e.target.value)}
                            className="w-full accent-teal-600 mt-2" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-teal-700 dark:text-teal-300 mb-1">Groups</label>
                          <input type="number" min="2" max="6" value={calcGroups}
                            onChange={e => setCalcGroups(e.target.value)}
                            className="w-full p-2 ring-1 ring-teal-200 dark:ring-teal-800 rounded-lg text-sm bg-white dark:bg-slate-800" />
                        </div>
                      </div>

                      {(() => {
                        const r = calculateSampleSize();
                        return (
                          <div className="bg-white dark:bg-slate-900 rounded-xl p-3 ring-1 ring-teal-200 dark:ring-teal-800">
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div>
                                <div className="text-2xl font-bold text-teal-700 dark:text-teal-300 tabular-nums">{r.nRaw}</div>
                                <div className="text-[10px] uppercase tracking-wider text-slate-500">n/group (raw)</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{r.nWithAttrition}</div>
                                <div className="text-[10px] uppercase tracking-wider text-slate-500">n/group (+attrition)</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{r.total}</div>
                                <div className="text-[10px] uppercase tracking-wider text-slate-500">total animals</div>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-slate-500 text-center border-t border-slate-100 dark:border-slate-800 pt-2">
                              DS guidelines: n≥10/group (behavioural) · n≥6/group (molecular)
                            </div>
                          </div>
                        );
                      })()}

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={downloadStudyCSV}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 ring-1 ring-teal-300 dark:ring-teal-700 text-teal-700 dark:text-teal-300 rounded-xl hover:bg-teal-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
                        >
                          <FileDown size={15} />
                          CSV
                        </button>
                        <button
                          onClick={printStudyPDF}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl hover:from-teal-700 hover:to-emerald-700 transition-colors text-sm font-medium shadow-md shadow-teal-500/30"
                        >
                          <Download size={15} />
                          Print / PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* GUIDELINES TAB */}
              {activeTab === 'guidelines' && (
                <div className="bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6">
                  <div className="flex justify-between items-start mb-4 gap-3 flex-wrap">
                    <div>
                      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">ARRIVE Guidelines Checklist</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        DS-specific adaptation based on{' '}
                        <a href="https://doi.org/10.1002/cpmo.79" target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-400 hover:underline">
                          Roper et al., 2020
                        </a>
                      </p>
                    </div>
                    <button
                      onClick={exportChecklist}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl hover:from-teal-700 hover:to-emerald-700 transition-colors text-sm font-medium shadow-md shadow-teal-500/30"
                    >
                      <Download size={16} />
                      Export
                    </button>
                  </div>

                  <div className="mb-6 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40 ring-1 ring-teal-100 dark:ring-teal-900/60 rounded-2xl">
                    <div className="text-sm tabular-nums">
                      Completed: {guidelines.filter(g => g.checked).length}/{guidelines.length} items
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 via-teal-500 to-teal-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(guidelines.filter(g => g.checked).length / guidelines.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {guidelines.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl cursor-pointer transition-colors ring-1
                          ${item.checked
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 ring-emerald-200 dark:ring-emerald-900'
                            : 'bg-slate-50 dark:bg-slate-800/40 ring-slate-200 dark:ring-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/70'}`}
                        onClick={() => handleGuidelineCheck(item.id)}
                      >
                        <div className="flex items-start gap-3">
                          <CheckSquare
                            size={20}
                            className={item.checked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-xs uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">{item.category}</div>
                            <div className="text-sm text-slate-700 dark:text-slate-200">{item.item}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ===== CHAT TAB ===== */}
              {activeTab === 'chat' && (
                <div className="h-full flex flex-col">
                  {/* Slim toolbar */}
                  <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800 px-4 md:px-8 py-2.5">
                    <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-2">
                      {/* Model picker */}
                      <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-full p-0.5 ring-1 ring-slate-200 dark:ring-slate-700">
                        <button
                          onClick={() => setSelectedModel('gpt-5.5')}
                          className={`text-xs font-medium px-3 py-1 rounded-full transition-all ${selectedModel === 'gpt-5.5'
                            ? 'bg-white dark:bg-slate-900 shadow-sm text-teal-700 dark:text-teal-300'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                        >
                          GPT-5.5
                        </button>
                        <button
                          onClick={() => setSelectedModel('gpt-5.4')}
                          className={`text-xs font-medium px-3 py-1 rounded-full transition-all flex items-center gap-1 ${selectedModel === 'gpt-5.4'
                            ? 'bg-white dark:bg-slate-900 shadow-sm text-amber-600 dark:text-amber-400'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                        >
                          GPT-5.4 ⚡
                        </button>
                      </div>

                      {/* Deep dive */}
                      <button
                        onClick={() => setDeepDive(v => !v)}
                        title="Deep Dive: cite specific PMIDs (up to 5) to extract verbatim Results/Methods/Figures from PMC OA full text."
                        className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ring-1
                          ${deepDive
                            ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white ring-transparent shadow-sm shadow-teal-500/30'
                            : 'bg-slate-100 dark:bg-slate-800/80 ring-slate-200 dark:ring-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                      >
                        <ZoomIn size={12} />
                        Deep Dive {deepDive ? 'ON' : 'OFF'}
                      </button>

                      {deepDive && (
                        <span className={`text-[11px] ${fulltextLoading ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-teal-600 dark:text-teal-400'}`}>
                          {fulltextLoading
                            ? '⏳ loading full-text index…'
                            : fulltext && Object.keys(fulltext).length > 0
                              ? `${Object.keys(fulltext).length} papers indexed`
                              : 'cite PMIDs to extract'}
                        </span>
                      )}

                      <div className="ml-auto flex items-center gap-1.5">
                        {chatMessages.length > 0 && (
                          <>
                            <button
                              onClick={downloadLastAnswer}
                              className="flex items-center gap-1 px-2.5 py-1.5 ring-1 ring-slate-200 dark:ring-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs text-slate-700 dark:text-slate-300"
                              title="Download last AI answer"
                            >
                              <FileDown size={13} />
                              <span className="hidden sm:inline">Last</span>
                            </button>
                            <button
                              onClick={downloadConversation}
                              className="flex items-center gap-1 px-2.5 py-1.5 ring-1 ring-slate-200 dark:ring-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs text-slate-700 dark:text-slate-300"
                              title="Download full chat"
                            >
                              <Download size={13} />
                              <span className="hidden sm:inline">Export</span>
                            </button>
                            <button
                              onClick={clearChat}
                              className="flex items-center gap-1 px-2.5 py-1.5 ring-1 ring-rose-200 dark:ring-rose-900/60 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-xs"
                              title="Clear chat"
                            >
                              <Trash2 size={13} />
                              <span className="hidden sm:inline">Clear</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages area */}
                  <div ref={chatContainerRef} className="flex-1 overflow-y-auto">
                    {chatMessages.length === 0 ? (
                      <div className="min-h-full flex items-center justify-center p-4 md:p-8">
                        <div className="max-w-2xl w-full text-center">
                          {/* T21RS logo hero */}
                          <div className="inline-flex items-center justify-center mb-6 relative">
                            <div className="absolute inset-0 rounded-full bg-teal-400/30 dark:bg-teal-500/20 blur-2xl"></div>
                            <div className="relative h-20 w-20 rounded-full bg-white dark:bg-slate-100 ring-1 ring-teal-200 dark:ring-teal-700 shadow-2xl shadow-teal-500/30 flex items-center justify-center overflow-hidden">
                              <img src="/ds-research-tool-test/t21rs-logo.svg" alt="T21RS" className="h-18 w-18 object-contain" />
                            </div>
                          </div>
                          <h3 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 dark:from-teal-400 dark:via-emerald-400 dark:to-emerald-400 bg-clip-text text-transparent">
                            DS Preclinical Research Assistant
                          </h3>
                          <p className="text-slate-600 dark:text-slate-400 mb-2">
                            Ask anything about Down syndrome animal models, experimental design, or research guidance.
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-200 dark:ring-amber-900/60 rounded-lg px-3 py-2 mb-6 inline-block">
                            ⚡ <strong>Tip:</strong> name the model, sex, age, and endpoint for best citation accuracy
                          </p>

                          <div className="text-left space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">💡 Try one of these</p>
                            {examplePrompts.map((prompt, i) => (
                              <button
                                key={i}
                                onClick={() => { setChatInput(prompt); chatInputRef.current?.focus(); }}
                                className="w-full text-left p-3.5 bg-white dark:bg-slate-900/60 ring-1 ring-slate-200 dark:ring-slate-800 rounded-xl hover:ring-teal-300 dark:hover:ring-teal-700 hover:shadow-md transition-all text-sm text-slate-700 dark:text-slate-300 group"
                              >
                                <span className="text-teal-500 dark:text-teal-400 mr-2 group-hover:translate-x-0.5 inline-block transition-transform">→</span>
                                {prompt}
                              </button>
                            ))}
                          </div>

                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-6">
                            Citations grounded in the{' '}
                            <a href="https://github.com/asathyanesan/ds-research-tool-test/blob/main/react-app/public/data/bibliography.json" target="_blank" rel="noreferrer" className="text-teal-500 hover:underline">DS Rodent Model Bibliography</a>
                            {' '}— 1,200+ curated PubMed papers
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 space-y-6">
                        {chatMessages
                          .filter(msg => msg.role !== 'system')
                          .map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              {msg.role === 'assistant' && (
                                <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-teal-600 flex items-center justify-center shadow-md shadow-teal-500/30">
                                  <Sparkles size={16} className="text-white" />
                                </div>
                              )}
                              <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                                <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                                  msg.role === 'user'
                                    ? 'bg-gradient-to-br from-teal-600 to-emerald-600 text-white rounded-tr-sm'
                                    : 'bg-white dark:bg-slate-900/80 ring-1 ring-slate-200 dark:ring-slate-800 rounded-tl-sm'
                                }`}>
                                  {msg.role === 'user' ? (
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-white">{msg.content}</p>
                                  ) : (
                                    msg.content
                                      ? <MarkdownMessage content={msg.content} />
                                      : <div className="flex items-center gap-1.5 py-1">
                                          <span className="h-2 w-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '120ms' }}></span>
                                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '240ms' }}></span>
                                        </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        {isLoading && loadingStatus && (
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-teal-600 flex items-center justify-center">
                              <Sparkles size={16} className="text-white animate-pulse" />
                            </div>
                            <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900/80 ring-1 ring-slate-200 dark:ring-slate-800 text-sm text-slate-600 dark:text-slate-300">
                              {loadingStatus}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Input bar */}
                  <div className="border-t border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl px-4 md:px-8 py-3">
                    <div className="max-w-4xl mx-auto">
                      <div className="relative flex items-end gap-2 bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 focus-within:ring-2 focus-within:ring-teal-500 rounded-2xl p-2 shadow-sm transition-all">
                        <textarea
                          ref={chatInputRef}
                          rows={1}
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && !isLoading && !fulltextLoading) {
                              e.preventDefault();
                              handleChat(chatInput);
                            }
                          }}
                          placeholder={fulltextLoading ? 'Loading full-text index…' : 'Ask about DS models, design, RRIDs, sample sizes, citations…'}
                          disabled={isLoading || fulltextLoading}
                          className="flex-1 resize-none bg-transparent px-2 py-2 text-sm md:text-base focus:outline-none placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100 max-h-[200px]"
                          style={{ minHeight: '2.5rem' }}
                        />
                        <button
                          onClick={() => handleChat(chatInput)}
                          disabled={isLoading || fulltextLoading || !chatInput.trim()}
                          className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                            isLoading || fulltextLoading || !chatInput.trim()
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                              : 'bg-gradient-to-br from-emerald-500 via-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/40 hover:scale-105 active:scale-95'
                          }`}
                          title="Send (Enter)"
                        >
                          {isLoading ? (
                            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send size={16} />
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 text-center px-2">
                        AI can make mistakes — verify critical information. Enter to send, Shift+Enter for newline.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer (hidden in chat to maximize chat space) */}
          {activeTab !== 'chat' && (
            <footer className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-t border-slate-200/70 dark:border-slate-800 px-4 py-3 text-center text-slate-500 dark:text-slate-400 text-xs">
              <p>
                DS Preclinical Research Assistant • Open Source •{' '}
                <a href="https://github.com/asathyanesan/ds-research-tool-test" target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-400 hover:underline">
                  GitHub
                </a>
              </p>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
                <span>Acknowledgement:</span>
                <a
                  href="https://www.udayton.edu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-teal-600 dark:text-teal-400 hover:underline font-medium"
                >
                  <img
                    src="/ds-research-tool-test/ud-logo.png"
                    alt="University of Dayton"
                    className="h-4 w-4 rounded-full"
                  />
                  University of Dayton
                </a>
                <span>for providing access to FlyerGPT Azure OpenAI</span>
              </div>
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
