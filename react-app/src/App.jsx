import React, { useState, useRef, useEffect } from 'react';
import { Search, FileText, CheckSquare, BookOpen, Info, ExternalLink, Download, FileDown } from 'lucide-react';
import MarkdownMessage from './MarkdownMessage';
function App() {
  const [activeTab, setActiveTab] = useState('models');
  const [selectedModels, setSelectedModels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const chatContainerRef = useRef(null);
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isLoading]);

  const [guidelines, setGuidelines] = useState([
    { id: 1, category: 'Study Design', item: 'Provide precise details of study design including primary research question', checked: false },
    { id: 2, category: 'Study Design', item: 'Explain how sample size was determined', checked: false },
    { id: 3, category: 'Animals', item: 'Provide details of animals used including species, strain, sex, age', checked: false },
    { id: 4, category: 'Animals', item: 'Explain housing and husbandry conditions', checked: false },
    { id: 5, category: 'Procedures', item: 'Describe procedures in detail for each experimental group', checked: false },
    { id: 6, category: 'Procedures', item: 'Describe experimental outcomes and how they were assessed', checked: false },
    { id: 7, category: 'Statistics', item: 'Describe statistical methods for each analysis', checked: false },
    { id: 8, category: 'Statistics', item: 'Report exact P values and effect sizes where possible', checked: false },
    { id: 9, category: 'Results', item: 'Report study timeline and actual sample sizes', checked: false },
    { id: 10, category: 'Results', item: 'Present results with appropriate statistics', checked: false }
  ]);

  const [animalModels, setAnimalModels] = useState([]);

  // Load animal models data
  useEffect(() => {
    fetch('/ds-research-tool-test/data/animal-models.json')
      .then(response => response.json())
      .then(data => setAnimalModels(data))
      .catch(error => console.error('Error loading animal models:', error));
  }, []);

  // HuggingFace API integration (fallback) - DEPRECATED
  // Note: HuggingFace free Inference API was discontinued in 2026
  const callHuggingFaceAPI = async (prompt) => {
    // HuggingFace Inference API is no longer available (returns 410 Gone)
    // Returning null to use knowledge-base fallback
    console.log('HuggingFace Inference API deprecated - using knowledge base fallback');
    return null;
  };

  const simulateLLMResponse = (query) => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('ts65dn') || lowerQuery.includes('cognitive')) {
      return 'For cognitive studies, Ts65Dn is the gold standard DS mouse model (RRID: IMSR_JAX:001924). It shows robust learning and memory deficits similar to DS. Recommended tests: Morris Water Maze, Novel Object Recognition, Y-maze. Consider n≥10 per group and account for sex differences.';
    }
    
    if (lowerQuery.includes('tc1') || lowerQuery.includes('human')) {
      return 'Tc1 mice (RRID: IMSR_JAX:004924) carry the complete human chromosome 21, making them genetically most similar to DS. However, they have breeding difficulties and high mortality. Best for molecular studies.';
    }
    
    if (lowerQuery.includes('dp16') || lowerQuery.includes('interferon')) {
      return 'Dp(16)1Yey mice (RRID: IMSR_JAX:013530) are excellent for interferon pathway and immunotherapy studies. Perfect for JAK inhibitor studies, cytokine analysis, and neuroinflammation research.';
    }
    
    if (lowerQuery.includes('sample size') || lowerQuery.includes('power')) {
      return 'Sample size depends on effect size and variability. For behavioral studies: n=8-12 per group (80% power, α=0.05). For molecular studies: n=6-8 may suffice. Use G*Power calculator and account for 10-20% attrition.';
    }
    
    if (lowerQuery.includes('rrid')) {
      return 'RRIDs are required for proper scientific reporting. DS models: Ts65Dn (IMSR_JAX:001924), Tc1 (IMSR_JAX:004924), Dp16 (IMSR_JAX:013530), Dp17 (IMSR_JAX:013529). Include in methods section for reproducibility.';
    }

    return 'I can help with DS animal model selection, experimental design, sample size calculations, ARRIVE compliance, and RRID identification. Ask me about specific models or research guidelines!';
  };

  const handleChat = async (userMessage) => {
    if (!userMessage.trim()) return;
    
    setIsLoading(true);
    setLoadingStatus('Sending to Azure OpenAI...');
    setChatInput('');
    
    const newMessage = { role: 'user', content: userMessage };
    const updatedMessages = [...chatMessages, newMessage];
    
    // Add user message to chat immediately
    setChatMessages(updatedMessages);

    try {
      // First, try calling backend (Azure OpenAI)
      const backendUrl = import.meta.env.DEV 
        ? '/api/chat'  // Vite proxy in dev mode
        : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/chat`;  // Production backend from env
      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: updatedMessages
        })
      });

      if (response.ok) {
        setLoadingStatus('Verifying citations...');
        const data = await response.json();
        if (data.success && data.response) {
          // Log verification report if available
          if (data.verification) {
            console.log('Citation verification:', data.verification);
            setLoadingStatus(`Verified ${data.verification.verified}/${data.verification.totalCitations} citations`);
          }
          const assistantMessage = { 
            role: 'assistant', 
            content: data.response,
            verification: data.verification // Store verification with message
          };
          setChatMessages([...updatedMessages, assistantMessage]);
          setIsLoading(false);
          setLoadingStatus('');
          return;
        }
      } else {
        // Handle error responses from backend
        const errorData = await response.json().catch(() => ({}));
        if (errorData.message) {
          console.warn('Azure OpenAI error:', errorData.message);
          // If it's a rate limit error, try HuggingFace fallback
          if (errorData.message.toLowerCase().includes('rate limit') || 
              errorData.message.toLowerCase().includes('quota') ||
              errorData.message.toLowerCase().includes('429')) {
            console.log('Azure OpenAI rate limit detected, using knowledge base fallback...');
            setLoadingStatus('Azure limit reached - using knowledge base...');
            
            // HuggingFace is deprecated, go directly to knowledge base
            const rateLimitMessage = { 
              role: 'assistant', 
              content: '⚠️ **Azure OpenAI rate limit reached.**\n\n_Using curated knowledge base response:_\n\n---\n\n' + simulateLLMResponse(userMessage)
            };
            setChatMessages([...updatedMessages, rateLimitMessage]);
            setIsLoading(false);
            setLoadingStatus('');
            return;
          }
        }
      }
      
      // Fallback: Backend unavailable, use knowledge base
      console.log('Backend unavailable, using knowledge base fallback...');
      setLoadingStatus('Using knowledge base...');
      const mockResponse = simulateLLMResponse(userMessage);
      const assistantMessage = { role: 'assistant', content: mockResponse };
      setChatMessages([...updatedMessages, assistantMessage]);
      
    } catch (error) {
      console.error('Chat error:', error);
      
      // Error fallback: Use domain-specific response
      const fallbackResponse = simulateLLMResponse(userMessage);
      const assistantMessage = { role: 'assistant', content: fallbackResponse };
      setChatMessages([...updatedMessages, assistantMessage]);
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  const handleGuidelineCheck = (id) => {
    setGuidelines(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const exportChecklist = () => {
    const completedItems = guidelines.filter(g => g.checked);
    const totalItems = guidelines.length;
    const completionRate = Math.round((completedItems.length / totalItems) * 100);
    
    const exportText = `ARRIVE Guidelines Checklist Export
Generated: ${new Date().toLocaleDateString()}
Completion: ${completedItems.length}/${totalItems} items (${completionRate}%)

COMPLETED ITEMS:
${completedItems.map(item => `✓ ${item.category}: ${item.item}`).join('\n')}

REMAINING ITEMS:
${guidelines.filter(g => !g.checked).map(item => `☐ ${item.category}: ${item.item}`).join('\n')}

DS Research Assistant - https://asathyanesan.github.io/ds-research-tool
`;

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

  const filteredModels = animalModels.filter(model =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.phenotypes.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
    model.applications.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex h-screen">
        {/* Left Sidebar Navigation */}
        <aside className="w-64 bg-white shadow-xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-800 mb-1">T21RS DS Animal Models</h1>
            <p className="text-xs text-gray-500">Assistant Tool</p>
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
                  onClick={() => setActiveTab(tab.id)}
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
              <p>• Verified Citations</p>
              <p>• Content Verification</p>
              <p className="mt-2 text-[10px] text-blue-600">
                <span className="font-semibold">AI:</span> Azure OpenAI + Knowledge Base
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Top Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 p-4">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-800">
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
                {activeTab === 'chat' && 'Get AI-powered research guidance with verified citations'}
              </p>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
          {activeTab === 'models' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search models by name, phenotype, or application..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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
                      <div className="flex gap-2">
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">{model.species}</span>
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

                    <div className="mb-3">
                      <span className="font-medium text-sm">Key Phenotypes:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {model.phenotypes.slice(0, 3).map((phenotype, idx) => (
                          <span key={idx} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            {phenotype}
                          </span>
                        ))}
                        {model.phenotypes.length > 3 && (
                          <span className="text-xs text-gray-500">+{model.phenotypes.length - 3} more</span>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <span className="font-medium text-sm">Best Applications:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {model.applications.slice(0, 2).map((app, idx) => (
                          <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {app}
                          </span>
                        ))}
                        {model.applications.length > 2 && (
                          <span className="text-xs text-gray-500">+{model.applications.length - 2} more</span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      Click to select for comparison • External link to Jackson Lab
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
                          
                          <div className="mb-3">
                            <h4 className="font-medium text-green-700">Advantages</h4>
                            <ul className="text-sm list-disc list-inside">
                              {model.advantages.map((adv, idx) => (
                                <li key={idx}>{adv}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="mb-3">
                            <h4 className="font-medium text-red-700">Limitations</h4>
                            <ul className="text-sm list-disc list-inside">
                              {model.limitations.map((limit, idx) => (
                                <li key={idx}>{limit}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-medium text-blue-700">Best Applications</h4>
                            <ul className="text-sm list-disc list-inside">
                              {model.applications.map((app, idx) => (
                                <li key={idx}>{app}</li>
                              ))}
                            </ul>
                          </div>
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
                      placeholder="What is your main research question? e.g., 'Does compound X improve learning deficits in Ts65Dn mice?'"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="3"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Animal Model</label>
                      <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">Select model...</option>
                        {animalModels.map(model => (
                          <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Study Type</label>
                      <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
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
                        placeholder="e.g., 10"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Study Duration</label>
                      <input
                        type="text"
                        placeholder="e.g., 8 weeks"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Primary Endpoint</label>
                    <input
                      type="text"
                      placeholder="e.g., Performance in Morris Water Maze"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-3">💡 Design Recommendations</h3>
                  <div className="space-y-3 text-sm text-blue-700">
                    <div>
                      <h4 className="font-medium">Sample Size Guidelines:</h4>
                      <ul className="list-disc list-inside mt-1">
                        <li>Behavioral studies: n≥10 per group</li>
                        <li>Molecular studies: n≥6 per group</li>
                        <li>Use G*Power for calculations</li>
                        <li>Account for 10-20% attrition</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">Experimental Design:</h4>
                      <ul className="list-disc list-inside mt-1">
                        <li>Include both sexes (sex as biological variable)</li>
                        <li>Randomize cage assignments</li>
                        <li>Blind investigators to treatment</li>
                        <li>Use appropriate controls</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium">Common Endpoints by Model:</h4>
                      <ul className="list-disc list-inside mt-1">
                        <li>Ts65Dn: Morris Water Maze, Y-maze, NOR</li>
                        <li>Tc1: Molecular markers, gene expression</li>
                        <li>Dp16: Cytokines, interferon signaling</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium">RRID Usage:</h4>
                      <ul className="list-disc list-inside mt-1">
                        <li>Always include RRIDs in methods</li>
                        <li>Required by most journals</li>
                        <li>Ensures reproducibility</li>
                      </ul>
                    </div>
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
            <div className="bg-white rounded-xl shadow-lg h-[calc(100vh-180px)] flex flex-col">
              {/* Chat Header with Download Options */}
              <div className="border-b p-4 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
                <div>
                  <p className="text-sm text-gray-600">💬 Powered by Azure OpenAI GPT-5.1 with verified PubMed citations</p>
                  <p className="text-xs text-gray-500 mt-1">(AI can make mistakes - please verify critical information)</p>
                </div>
                {chatMessages.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={downloadLastAnswer}
                      className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      title="Download last AI answer"
                    >
                      <FileDown size={16} />
                      Last Answer
                    </button>
                    <button
                      onClick={downloadConversation}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      title="Download entire conversation"
                    >
                      <Download size={16} />
                      Full Chat
                    </button>
                  </div>
                )}
              </div>

              {/* Chat Messages Area - Larger */}
              <div ref={chatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-16">
                    <BookOpen size={64} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-xl mb-4">Ask me about DS animal models, experimental design, or research guidance!</p>
                    <div className="text-sm space-y-2 bg-white p-6 rounded-lg max-w-2xl mx-auto shadow-md">
                      <p className="font-semibold text-gray-700 mb-3">💡 Example Questions:</p>
                      <div className="text-left space-y-2">
                        <p>• "Which DS model is best for cognitive studies?"</p>
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
                                🤖 AI Assistant with Verified Citations
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
              <div className="border-t p-4 bg-white">
                <div className="flex gap-3">
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
            <p>DS Research Assistant • Open Source • 
              <a href="https://github.com/asathyanesan/ds-research-tool" className="text-blue-600 hover:underline ml-1">
                View on GitHub
              </a>
            </p>
            <p className="mt-2 flex items-center justify-center gap-2">
              <span>🙏 Acknowledgement:</span>
              <a 
                href="https://www.udayton.edu" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:underline font-medium"
              >
                <img 
                  src="/ds-research-tool-test/ud-logo.png" 
                  alt="University of Dayton" 
                  className="h-6 w-6 rounded-full"
                />
                University of Dayton
              </a>
              <span>for providing access to FlyerGPT Azure OpenAI</span>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}


export default App;
