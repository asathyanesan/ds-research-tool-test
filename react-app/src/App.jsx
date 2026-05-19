import React, { useState, useRef, useEffect } from 'react';
import { Search, FileText, CheckSquare, BookOpen, Info, ExternalLink, Download, FileDown, Menu, X, ZoomIn } from 'lucide-react';
import MarkdownMessage from './MarkdownMessage';
function App() {
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
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isLoading]);

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

  // Load animal models data
  const [bibliography, setBibliography] = useState([]);

  useEffect(() => {
    fetch('/ds-research-tool-test/data/animal-models.json')
      .then(response => response.json())
      .then(data => setAnimalModels(data))
      .catch(error => console.error('Error loading animal models:', error));
  }, []);

  useEffect(() => {
    fetch('/ds-research-tool-test/data/bibliography.json')
      .then(response => response.json())
      .then(data => setBibliography(data))
      .catch(error => console.error('Error loading bibliography:', error));
  }, []);

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
      body { font-family: Arial, sans-serif; max-width: 680px; margin: 36px auto; color: #222; font-size: 13px; }
      h1 { font-size: 18px; color: #1d4ed8; border-bottom: 2px solid #1d4ed8; padding-bottom: 6px; margin-bottom: 16px; }
      h2 { font-size: 13px; font-weight: bold; color: #1d4ed8; margin: 20px 0 6px; text-transform: uppercase; letter-spacing: 0.05em; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 6px 10px; border: 1px solid #ddd; }
      td:first-child { font-weight: bold; background: #f0f4ff; width: 42%; }
      .result-grid { display: flex; gap: 16px; justify-content: center; margin: 16px 0; }
      .result-box { text-align: center; border: 2px solid #93c5fd; border-radius: 8px; padding: 12px 20px; min-width: 120px; }
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
      <div class="result-box"><div class="result-num" style="color:#1d4ed8">${r.nRaw}</div><div class="result-label">n/group (raw)</div></div>
      <div class="result-box"><div class="result-num" style="color:#ea580c">${r.nWithAttrition}</div><div class="result-label">n/group (+attrition)</div></div>
      <div class="result-box"><div class="result-num" style="color:#16a34a">${r.total}</div><div class="result-label">total animals</div></div>
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

  // Score bibliography entries by keyword overlap with a query string (client-side RAG)
  const getRelevantRefs = (query, topN = 30) => {
    if (!bibliography.length) return [];
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
    if (!words.length) return bibliography.slice(0, topN);
    const scored = bibliography.map(entry => {
      // Score against title + authors + abstract (first 600 chars of abstract to keep fast)
      const text = ((entry.title || '') + ' ' + (entry.authors || '') + ' ' + (entry.abstract || '').slice(0, 600)).toLowerCase();
      const score = words.reduce((acc, w) => acc + (text.includes(w) ? 1 : 0), 0);
      return { entry, score };
    });
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score || (parseInt(b.entry.year) || 0) - (parseInt(a.entry.year) || 0))
      .slice(0, topN)
      .map(s => s.entry);
  };

  const buildSystemPrompt = (models, relevantRefs = [], withAbstracts = false) => {
    const jaxRrid = (url) => {
      const id = url?.split('/strain/')?.[1];
      return id ? `RRID:IMSR_JAX:${id}` : '';
    };
    const pmidFromUrl = (url) => {
      const m = url?.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/);
      return m ? m[1] : null;
    };

    // Verified papers anchored to each model (always included)
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

    // Query-relevant papers from the full bibliography (deduplicated)
    // Abstracts only included when deepDive mode is active (caller passes withAbstracts=true)
    const extraRefs = relevantRefs
      .filter(r => !seenPmids.has(String(r.pmid)))
      .map(r => {
        const base = `PMID:${r.pmid} — ${r.authors} (${r.year}) "${r.title}"`;
        if (withAbstracts && r.abstract) {
          const snippet = r.abstract.slice(0, 600).trimEnd();
          return `${base}\n   Abstract: ${snippet}${r.abstract.length > 600 ? '…' : ''}`;
        }
        return base;
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
      content: `You are an expert research assistant specialising in Down syndrome (DS) animal models and experimental design. Your expertise includes experimental design, ARRIVE guidelines, sample size calculations, behavioural and molecular endpoints, and immunology/interferon signalling in DS.

## CURATED DS LITERATURE — cite only from this list (${allBibEntries.length} papers from the DS rodent model bibliography, selected for relevance to this query):
${citationPool}

THIS IS A HARD CONSTRAINT. Do not cite any paper not listed above. If a claim cannot be supported by a paper in this list, write: *(not in the curated DS bibliography — suggested PubMed search: [suggested search terms])*

## AUTHORITATIVE KNOWLEDGE BASE — verified models with full detail:
${kb}

## COMPLETE MODEL LIST (${models.length} models — do not invent details beyond what is listed):
${allModelsList}

## CITATION FORMAT RULES:
1. Cite ONLY papers from the curated DS bibliography above, using their PMID as given.
2. Format citations as: Author et al. (Year) [PMID:XXXXXXX] — always use this exact square-bracket format; it becomes a clickable PubMed link automatically.
3. NEVER invent or guess a PMID, author, title, or year.
4. If no paper in the bibliography supports a claim, say so — do NOT fall back to training-data citations.
5. It is far better to provide one verified citation than three invented ones.
6. When uncertain about a factual claim, say: "Evidence suggests…" or "This has not been definitively established in the DS literature provided."`
    };
  };

  const callFlyerGPT55 = async (messages) => {
    if (!WORKER_BASE) throw new Error('VITE_WORKER_URL not configured');
    const url = `${WORKER_BASE}/openai/deployments/gpt-5.5/chat/completions?api-version=2024-10-21`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, max_completion_tokens: 8000 })
    });
    if (!response.ok) {
      const raw = await response.text().catch(() => '');
      const msg = (() => { try { return JSON.parse(raw)?.error?.message || ''; } catch { return raw; } })();
      if (response.status === 429) throw new Error('GPT-5.5 rate limit reached (1,000 tokens/min) — please wait ~60 seconds and try again.');
      throw new Error(`GPT-5.5 error ${response.status}: ${msg || response.statusText}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
  };

  const callFlyerGPT54Pro = async (messages) => {
    if (!WORKER_BASE) throw new Error('VITE_WORKER_URL not configured');
    const url = `${WORKER_BASE}/openai/deployments/gpt-5.4-pro/chat/completions?api-version=2024-10-21`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, max_completion_tokens: 8000 })
    });
    if (!response.ok) {
      const raw = await response.text().catch(() => '');
      const msg = (() => { try { return JSON.parse(raw)?.error?.message || ''; } catch { return raw; } })();
      if (response.status === 429) throw new Error('GPT-5.4-pro rate limit reached — please wait a moment and try again.');
      throw new Error(`GPT-5.4-pro error ${response.status}: ${msg || response.statusText}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
  };

  const callFlyerGPT54 = async (messages) => {
    if (!WORKER_BASE) throw new Error('VITE_WORKER_URL not configured');
    const url = `${WORKER_BASE}/openai/deployments/gpt-5.4/chat/completions?api-version=2024-10-21`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, max_completion_tokens: 8000, temperature: 0.3 })
    });
    if (!response.ok) {
      const raw = await response.text().catch(() => '');
      const msg = (() => { try { return JSON.parse(raw)?.error?.message || ''; } catch { return raw; } })();
      if (response.status === 429) throw new Error('GPT-5.4 rate limit reached — please wait a moment and try again.');
      throw new Error(`GPT-5.4 error ${response.status}: ${msg || response.statusText}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
  };



  // Convert [PMID:XXXXXXX] patterns to clickable PubMed markdown links
  const linkifyPmids = (text) => {
    // Match [PMID:digits] not already followed by ( (i.e. not already a markdown link target)
    return text.replace(/\[PMID:(\d{5,9})\](?!\()/g,
      (_, pmid) => `[[PMID:${pmid}]](https://pubmed.ncbi.nlm.nih.gov/${pmid}/)`);
  };

  const handleChat = async (userMessage) => {
    if (!userMessage.trim()) return;
    setIsLoading(true);
    const modelLabel = selectedModel === 'gpt-5.5' ? 'GPT-5.5' : selectedModel === 'gpt-5.4-pro' ? 'GPT-5.4-pro' : 'GPT-5.4';
    setLoadingStatus(`Sending to ${modelLabel}...`);
    setChatInput('');
    const newMessage = { role: 'user', content: userMessage };
    const updatedMessages = [...chatMessages, newMessage];
    setChatMessages(updatedMessages);
    try {
      // Build RAG query from last 4 turns + current message so short follow-ups
      // ("yes", "sex specific", "expand on that") still pull the right papers
      const recentContext = chatMessages
        .filter(m => m.role !== 'system')
        .slice(-4)
        .map(m => m.content)
        .join(' ');
      const ragQuery = `${recentContext} ${userMessage}`.trim();
      const relevantRefs = getRelevantRefs(ragQuery, deepDive ? 12 : 30);
      const systemPrompt = buildSystemPrompt(animalModels, relevantRefs, deepDive);
      const messagesWithSystem = [systemPrompt, ...updatedMessages];
      const responseText = selectedModel === 'gpt-5.5'
        ? await callFlyerGPT55(messagesWithSystem)
        : selectedModel === 'gpt-5.4-pro'
          ? await callFlyerGPT54Pro(messagesWithSystem)
          : await callFlyerGPT54(messagesWithSystem);
      setChatMessages([...updatedMessages, { role: 'assistant', content: linkifyPmids(responseText) }]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages([...updatedMessages, {
        role: 'assistant',
        content: `⚠️ **Error contacting ${modelLabel}**: ${error.message}`
      }]);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  const exportChecklist = () => {
    const completedItems = guidelines.filter(g => g.checked);
    const exportText = `ARRIVE Guidelines Checklist\nGenerated: ${new Date().toLocaleString()}\n${'='.repeat(60)}\n\nCOMPLETED ITEMS:\n${completedItems.map(item => `✓ ${item.category}: ${item.item}`).join('\n')}\n\nREMAINING ITEMS:\n${guidelines.filter(g => !g.checked).map(item => `☐ ${item.category}: ${item.item}`).join('\n')}\n\nDS Research Assistant - https://asathyanesan.github.io/ds-research-tool\n`;

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
    if (chatMessages.length === 0) {
      alert('No conversation to download yet!');
      return;
    }

    const conversationText = `DS Research Assistant - Conversation Export
Generated: ${new Date().toLocaleString()}
${'='.repeat(60)}

${
      chatMessages.map((msg, idx) => {
        const role = msg.role === 'user' ? 'YOU' : 'AI ASSISTANT';
        const divider = '\n' + '-'.repeat(60) + '\n';
        return `${role}:\n${msg.content}${divider}`;
      }).join('\n')
    }

DS Research Assistant - https://asathyanesan.github.io/ds-research-tool
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
    
    if (!lastAssistantMsg) {
      alert('No AI response to download yet!');
      return;
    }

    const answerText = `DS Research Assistant - Answer Export
Generated: ${new Date().toLocaleString()}
${'='.repeat(60)}

${lastAssistantMsg.content}

${'='.repeat(60)}
DS Research Assistant - https://asathyanesan.github.io/ds-research-tool
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex h-screen overflow-hidden">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* Left Sidebar Navigation */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800 mb-1">T21RS DS Animal Models</h1>
              <p className="text-xs text-gray-500">Assistant Tool</p>
            </div>
            <button
              className="md:hidden text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {[
                { id: 'models', label: 'Animal Models', icon: Search },
                { id: 'compare', label: 'Compare', icon: FileText },
                { id: 'design', label: 'Study Design', icon: Info },
                { id: 'guidelines', label: 'ARRIVE Check', icon: CheckSquare },
                { id: 'chat', label: 'AI Assistant', icon: BookOpen }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white shadow-md transform scale-105'
                      : 'text-gray-700 hover:bg-gray-100 hover:translate-x-1'
                  }`}
                >
                  <tab.icon size={20} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Footer Info */}
          <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="font-semibold text-blue-700 mb-1">💡 Features</p>
              <p>• Evidence-Based</p>
              <p>• ARRIVE Compliance</p>

              <p>• Content Verification</p>
              <p className="mt-2 text-[10px] text-blue-600">
                <span className="font-semibold">AI:</span> GPT-5.5, GPT-5.4-pro &amp; GPT-5.4 via FlyerGPT
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Top Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 p-4">
            <div className="max-w-7xl mx-auto flex items-start gap-3">
              <button
                className="md:hidden mt-1 text-gray-600 hover:text-gray-800 flex-shrink-0"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={24} />
              </button>
              <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                {activeTab === 'models' && 'Animal Models Database'}
                {activeTab === 'compare' && 'Model Comparison'}
                {activeTab === 'design' && 'Study Design Guide'}
                {activeTab === 'guidelines' && 'ARRIVE Guidelines Checklist'}
                {activeTab === 'chat' && 'AI Research Assistant'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {activeTab === 'models' && 'Search and explore Down syndrome animal models'}
                {activeTab === 'compare' && 'Compare selected models side-by-side'}
                {activeTab === 'design' && 'Experimental design recommendations'}
                {activeTab === 'guidelines' && 'Track your compliance with reporting standards'}
                {activeTab === 'chat' && 'Get AI-powered research guidance'}
              </p>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-3 md:p-6">
            <div className="max-w-7xl mx-auto">
          {activeTab === 'models' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                Model data sourced from{' '}
                <a href="https://github.com/abbash83/DS_Rodent_Models_Database" target="_blank" rel="noopener noreferrer" className="font-semibold underline">abbash83/DS_Rodent_Models_Database</a>
                {' '}· Compiled from: Folz, A., Sloan, K., Roper, R.J. (2025). <em>Mouse Models of Down Syndrome</em>. Springer.
              </div>
              <div className="mb-4">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search models by name, type, background, or RRID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <select value={modelTypeFilter} onChange={e => setModelTypeFilter(e.target.value)}
                    className="text-sm p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">All Types</option>
                    {[...new Set(animalModels.map(m => m.type).filter(Boolean))].sort().map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <select value={modelSpeciesFilter} onChange={e => setModelSpeciesFilter(e.target.value)}
                    className="text-sm p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">All Species</option>
                    {[...new Set(animalModels.map(m => m.species).filter(Boolean))].sort().map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {(modelTypeFilter || modelSpeciesFilter) && (
                    <button onClick={() => { setModelTypeFilter(''); setModelSpeciesFilter(''); }}
                      className="text-sm px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                      Clear filters
                    </button>
                  )}
                  <span className="ml-auto text-sm text-gray-500">
                    {filteredModels.length} of {animalModels.length} models
                  </span>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                {filteredModels.map(model => (
                  <div 
                    key={model.id} 
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedModels.includes(model.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleModelSelect(model.id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">{model.name}</h3>
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">{model.species}</span>
                        {model.type && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">{model.type}</span>}
                        <a 
                          href={model.jackson_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm mb-3">
                      <div><span className="font-medium">Background:</span> {model.background}</div>
                      <div><span className="font-medium">Trisomy:</span> {model.trisomy}</div>
                      <div><span className="font-medium">Genes:</span> {model.genes}</div>
                      <div>
                        <span className="font-medium">RRID:</span>{' '}
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {model.rrid}
                        </span>
                      </div>
                    </div>

                    {model.description && (
                      <div className="mb-3 text-sm text-gray-600 line-clamp-3">
                        {model.description}
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Click to select for comparison
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'compare' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Model Comparison</h2>
              {selectedModels.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Select models from the Animal Models tab to compare them here</p>
                </div>
              ) : (
                <div>
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border p-3 text-left">Feature</th>
                          {selectedModels.map(modelId => {
                            const model = animalModels.find(m => m.id === modelId);
                            return <th key={modelId} className="border p-3 text-center">{model.name}</th>;
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {['background', 'trisomy', 'genes', 'rrid'].map(feature => (
                          <tr key={feature}>
                            <td className="border p-3 font-medium capitalize">
                              {feature === 'rrid' ? 'RRID' : feature}
                            </td>
                            {selectedModels.map(modelId => {
                              const model = animalModels.find(m => m.id === modelId);
                              return (
                                <td key={modelId} className="border p-3 text-center">
                                  {feature === 'rrid' ? (
                                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
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

                  <div className="grid gap-6 md:grid-cols-2">
                    {selectedModels.map(modelId => {
                      const model = animalModels.find(m => m.id === modelId);
                      return (
                        <div key={modelId} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-lg">{model.name}</h3>
                            <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                              {model.rrid}
                            </span>
                          </div>
                          
                          {model.description && (
                            <div className="mb-3">
                              <h4 className="font-medium text-gray-700">Description</h4>
                              <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                            </div>
                          )}
                          {model.key_papers && model.key_papers.length > 0 && (
                            <div>
                              <h4 className="font-medium text-blue-700">Key Papers</h4>
                              <ul className="text-sm list-disc list-inside mt-1">
                                {model.key_papers.map((p, idx) => (
                                  <li key={idx}>
                                    <a href={`https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
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

          {activeTab === 'design' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Study Design Wizard</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Research Question</label>
                    <textarea
                      value={designQuestion}
                      onChange={e => setDesignQuestion(e.target.value)}
                      placeholder="What is your main research question? e.g., 'Does compound X improve learning deficits in Ts65Dn mice?'"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="3"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Animal Model</label>
                      <select value={designModel} onChange={e => setDesignModel(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Select model...</option>
                        {animalModels.map(model => (
                          <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Study Type</label>
                      <select value={designStudyType} onChange={e => setDesignStudyType(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
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
                      <label className="block text-sm font-medium mb-2">Sample Size per Group</label>
                      <input
                        type="number"
                        value={designSampleSize}
                        onChange={e => setDesignSampleSize(e.target.value)}
                        placeholder="e.g., 10"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Study Duration</label>
                      <input
                        type="text"
                        value={designDuration}
                        onChange={e => setDesignDuration(e.target.value)}
                        placeholder="e.g., 8 weeks"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Primary Endpoint</label>
                    <input
                      type="text"
                      value={designEndpoint}
                      onChange={e => setDesignEndpoint(e.target.value)}
                      placeholder="e.g., Performance in Morris Water Maze"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
                    🧮 Sample Size Calculator
                    <span className="text-xs font-normal text-blue-600">(two-group comparison, Cohen's d)</span>
                  </h3>

                  {/* Effect size presets */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-blue-700 mb-2">Effect Size (Cohen's d)</label>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {[['0.2','Small'],['0.5','Medium'],['0.8','Large / DS Behavioural'],['1.0','DS Molecular']].map(([v, label]) => (
                        <button key={v} onClick={() => setCalcEffectSize(v)}
                          className={`text-xs px-2 py-1 rounded transition-colors ${calcEffectSize === v ? 'bg-blue-500 text-white' : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-100'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <input type="number" step="0.1" min="0.1" max="3" value={calcEffectSize}
                      onChange={e => setCalcEffectSize(e.target.value)}
                      className="w-full p-2 border border-blue-200 rounded text-sm bg-white" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-blue-700 mb-1">Alpha (α)</label>
                      <select value={calcAlpha} onChange={e => setCalcAlpha(e.target.value)}
                        className="w-full p-2 border border-blue-200 rounded text-sm bg-white">
                        <option value="0.05">0.05</option>
                        <option value="0.01">0.01</option>
                        <option value="0.10">0.10</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-blue-700 mb-1">Power (1−β)</label>
                      <select value={calcPower} onChange={e => setCalcPower(e.target.value)}
                        className="w-full p-2 border border-blue-200 rounded text-sm bg-white">
                        <option value="0.80">0.80</option>
                        <option value="0.90">0.90</option>
                        <option value="0.95">0.95</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-blue-700 mb-1">Attrition: {calcAttrition}%</label>
                      <input type="range" min="0" max="30" value={calcAttrition}
                        onChange={e => setCalcAttrition(e.target.value)}
                        className="w-full accent-blue-500 mt-2" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-blue-700 mb-1">Groups</label>
                      <input type="number" min="2" max="6" value={calcGroups}
                        onChange={e => setCalcGroups(e.target.value)}
                        className="w-full p-2 border border-blue-200 rounded text-sm bg-white" />
                    </div>
                  </div>

                  {(() => {
                    const r = calculateSampleSize();
                    return (
                      <div className="bg-white rounded-lg p-3 border border-blue-200">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="text-2xl font-bold text-blue-700">{r.nRaw}</div>
                            <div className="text-xs text-gray-500">n/group (raw)</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-orange-600">{r.nWithAttrition}</div>
                            <div className="text-xs text-gray-500">n/group (+attrition)</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-700">{r.total}</div>
                            <div className="text-xs text-gray-500">total animals</div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 text-center border-t pt-2">
                          DS guidelines: n≥10/group (behavioural) · n≥6/group (molecular)
                        </div>
                      </div>
                    );
                  })()}

                  {/* Export buttons */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={downloadStudyCSV}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                    >
                      <FileDown size={15} />
                      Download CSV
                    </button>
                    <button
                      onClick={printStudyPDF}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Download size={15} />
                      Print / Save PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guidelines' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">ARRIVE Guidelines Checklist</h2>
                <button
                  onClick={exportChecklist}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Download size={16} />
                  Export Checklist
                </button>
              </div>

              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="text-sm">
                  Completed: {guidelines.filter(g => g.checked).length}/{guidelines.length} items
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(guidelines.filter(g => g.checked).length / guidelines.length) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-3">
                {guidelines.map((item) => (
                  <div 
                    key={item.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      item.checked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => handleGuidelineCheck(item.id)}
                  >
                    <div className="flex items-start gap-3">
                      <CheckSquare 
                        size={20} 
                        className={item.checked ? 'text-green-600' : 'text-gray-400'}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm text-blue-600 mb-1">{item.category}</div>
                        <div className="text-sm text-gray-700 mb-2">{item.item}</div>
                        {item.details && (
                          <div className="text-xs text-gray-500 whitespace-pre-line">{item.details}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="bg-white rounded-xl shadow-lg h-[calc(100vh-140px)] md:h-[calc(100vh-180px)] flex flex-col">
              {/* Chat Header with Download Options */}
              <div className="border-b p-3 md:p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-600">💬 FlyerGPT Azure — {selectedModel === 'gpt-5.5' ? 'GPT-5.5' : selectedModel === 'gpt-5.4-pro' ? 'GPT-5.4-pro' : 'GPT-5.4 (Fast)'}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-xs text-gray-500">Model:</span>
                      <button onClick={() => setSelectedModel('gpt-5.5')} className={`text-xs px-2 py-0.5 rounded transition-colors ${selectedModel === 'gpt-5.5' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>GPT-5.5</button>
                      <button onClick={() => setSelectedModel('gpt-5.4-pro')} className={`text-xs px-2 py-0.5 rounded transition-colors ${selectedModel === 'gpt-5.4-pro' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>GPT-5.4-pro</button>
                      <button onClick={() => setSelectedModel('gpt-5.4')} className={`text-xs px-2 py-0.5 rounded transition-colors ${selectedModel === 'gpt-5.4' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>GPT-5.4 ⚡</button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-xs text-gray-500">Context:</span>
                      <button
                        onClick={() => setDeepDive(v => !v)}
                        title="Deep Dive: include full abstracts for top 12 papers — richer context, more tokens"
                        className={`text-xs px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                          deepDive ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        <ZoomIn size={11} />
                        Deep Dive {deepDive ? 'ON' : 'OFF'}
                      </button>
                      {deepDive && <span className="text-xs text-purple-500">abstracts · top 12 refs</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">(AI can make mistakes - please verify critical information)</p>
                  </div>
                  {chatMessages.length > 0 && (
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={downloadLastAnswer}
                        className="flex items-center gap-1 px-2 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs"
                        title="Download last AI answer"
                      >
                        <FileDown size={14} />
                        <span className="hidden sm:inline">Last Answer</span>
                      </button>
                      <button
                        onClick={downloadConversation}
                        className="flex items-center gap-1 px-2 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs"
                        title="Download entire conversation"
                      >
                        <Download size={14} />
                        <span className="hidden sm:inline">Full Chat</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Messages Area */}
              <div ref={chatContainerRef} className="flex-1 p-3 md:p-6 overflow-y-auto space-y-4 bg-gray-50">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-16">
                    <BookOpen size={64} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-xl mb-4">Ask me about DS animal models, experimental design, or research guidance!</p>
                    <div className="text-sm space-y-2 bg-white p-6 rounded-lg max-w-2xl mx-auto shadow-md">
                      <p className="font-semibold text-gray-700 mb-3">💡 Example Questions:</p>
                      <div className="text-left space-y-2">
                        <p>• "Explain Morris water maze testing in Ts65Dn mice"</p>
                        <p>• "Design tips for immunotherapy studies in DS models"</p>
                        <p>• "What is the RRID for Ts65Dn mice?"</p>
                        <p>• "Compare Ts65Dn and Tc1 mouse models"</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {chatMessages
                      .filter(msg => msg.role !== 'system')
                      .map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-4 rounded-lg shadow-md ${
                            msg.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : msg.isAiResponse
                                ? 'bg-white text-gray-800 border-2 border-blue-200'
                                : 'bg-white text-gray-800 border border-gray-200'
                          }`}>
                            {msg.role === 'assistant' && (
                              <div className="text-xs text-blue-600 mb-2 flex items-center gap-1 font-semibold">
                                🤖 AI Research Assistant
                              </div>
                            )}
                            {msg.role === 'user' && (
                              <div className="text-xs text-white/80 mb-2 flex items-center gap-1">
                                👤 You
                              </div>
                            )}
                            <MarkdownMessage content={msg.content} />
                            
                            {/* Display content warnings if present */}
                            {msg.role === 'assistant' && msg.verification?.contentWarnings > 0 && msg.verification?.contentDetails && (
                              <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
                                <div className="flex items-start gap-2">
                                  <span className="text-amber-600 text-xl">⚠</span>
                                  <div className="flex-1">
                                    <p className="font-semibold text-amber-800 mb-2">
                                      Content Verification Warning
                                    </p>
                                    <p className="text-sm text-amber-700 mb-3">
                                      {msg.verification.contentWarnings} citation(s) may not fully support the claims made. Review these carefully:
                                    </p>
                                    {msg.verification.contentDetails.map((detail, idx) => (
                                      <div key={idx} className="mb-3 last:mb-0 pl-4 border-l-2 border-amber-300">
                                        <p className="text-sm font-medium text-amber-900">
                                          {detail.author}, {detail.year} (PMID {detail.pmid})
                                        </p>
                                        <p className="text-xs text-amber-700 mt-1">
                                          Content match: <span className="font-semibold">{detail.contentScore}%</span>
                                          {detail.semanticScore > 0 && (
                                            <span className="ml-2 text-amber-600">
                                              (semantic: {detail.semanticScore}%)
                                            </span>
                                          )}
                                        </p>
                                        <p className="text-xs text-amber-600 mt-1 italic">
                                          {detail.warning}
                                        </p>
                                      </div>
                                    ))}
                                    <p className="text-xs text-amber-600 mt-3">
                                      💡 Low content match indicates the cited paper may discuss different aspects than claimed. Verify citations independently.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white text-gray-800 p-4 rounded-lg shadow-md border border-blue-200">
                          <div className="flex items-center gap-3">
                            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            <span className="font-medium">{loadingStatus || 'AI is thinking...'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t p-3 md:p-4 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleChat(chatInput)}
                    placeholder="Ask about DS models, experimental design, RRIDs, sample sizes, citations..."
                    className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => handleChat(chatInput)}
                    disabled={isLoading || !chatInput.trim()}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      isLoading || !chatInput.trim()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {isLoading ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          )}
            </div>
          </div>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 p-4 text-center text-gray-500 text-sm">
            <p>
              DS Research Assistant • Open Source •{' '}
              <a href="https://github.com/asathyanesan/ds-research-tool" className="text-blue-600 hover:underline">
                View on GitHub
              </a>
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
              <span>🙏 Acknowledgement:</span>
              <a
                href="https://www.udayton.edu"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-blue-600 hover:underline font-medium"
              >
                <img
                  src="/ds-research-tool-test/ud-logo.png"
                  alt="University of Dayton"
                  className="h-5 w-5 rounded-full"
                />
                University of Dayton
              </a>
              <span>for providing access to FlyerGPT Azure OpenAI</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}


export default App;
