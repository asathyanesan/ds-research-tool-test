import React, { useState, useRef, useEffect } from 'react';
import { Search, FileText, CheckSquare, BookOpen, Info, ExternalLink, Download } from 'lucide-react';
function App() {
  const [activeTab, setActiveTab] = useState('models');
  const [selectedModels, setSelectedModels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isLoading]);
}
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

  // Groq API integration (free tier with generous limits)
  // Perplexity API integration
    // Perplexity API integration (uses environment variable for credentials)
    const callPerplexityAPI = async (prompt, messageHistory) => {
      const apiKey = import.meta.env.VITE_PERPLEXITY_API_KEY;
      if (!apiKey) {
        console.log('No Perplexity API key found, using fallback response');
        return null;
      }
      try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'sonar-reasoning',
            messages: messageHistory,
            max_tokens: 2048,
            temperature: 0.2
          })
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Perplexity API Error ${response.status}:`, errorText);
          return null;
        }
        const data = await response.json();
        console.log('Perplexity API response:', data);
        if (data.choices && data.choices[0]?.message?.content) {
          let content = data.choices[0].message.content.trim();
          return content;
        }
        console.log('Unexpected Perplexity response format:', data);
        return null;
      } catch (error) {
        console.error('Perplexity API error:', error);
        return null;
      }
    };

  // HuggingFace API integration (fallback)
  const callHuggingFaceAPI = async (prompt) => {
    const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
    
    if (!apiKey) {
      console.log('No HuggingFace API key found, using fallback response');
      return null;
    }

    try {
      // Try a simple, free text generation model
      const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          options: {
            wait_for_model: true
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error ${response.status}:`, errorText);
        
        // If we get a 404 or billing limit error, return a special mock response
        if (response.status === 404 || response.status === 429 || errorText.includes('billing')) {
          console.log('Using enhanced mock AI response due to API limitations');
          return generateEnhancedMockResponse(prompt);
        }
        
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('HuggingFace API response:', data);
      
      // Handle different response formats
      if (data.generated_text) {
        return data.generated_text.trim();
      } else if (Array.isArray(data) && data[0]?.generated_text) {
        return data[0].generated_text.trim();
      } else if (Array.isArray(data) && data[0]?.label) {
        // Classification response format
        return `Classification result: ${data[0].label} (confidence: ${(data[0].score * 100).toFixed(1)}%)`;
      }
      
      console.log('Unexpected response format, using mock response');
      return generateEnhancedMockResponse(prompt);
    } catch (error) {
      console.error('HuggingFace API error:', error);
      console.log('Falling back to enhanced mock AI response');
      return generateEnhancedMockResponse(prompt);
    }
  };

  const generateEnhancedMockResponse = (prompt) => {
    const lowerPrompt = prompt.toLowerCase();
    
    // More sophisticated AI-like responses
    if (lowerPrompt.includes('machine learning') || lowerPrompt.includes('ml')) {
      return "Machine learning is a subset of AI that enables computers to learn patterns from data without explicit programming. Key types include supervised learning (labeled data), unsupervised learning (pattern discovery), and reinforcement learning (reward-based learning). Popular algorithms include neural networks, decision trees, and support vector machines.";
    }
    
    if (lowerPrompt.includes('data science') || lowerPrompt.includes('data scientist')) {
      return "Data science combines statistics, programming, and domain expertise to extract insights from data. The typical workflow involves data collection, cleaning, exploratory analysis, modeling, and interpretation. Essential skills include Python/R programming, SQL, statistics, and visualization tools like Matplotlib or Tableau.";
    }
    
    if (lowerPrompt.includes('neural network') || lowerPrompt.includes('deep learning')) {
      return "Neural networks are computing models inspired by biological neural networks. They consist of interconnected nodes (neurons) organized in layers. Deep learning uses multiple hidden layers to learn complex patterns. Common architectures include CNNs for image processing, RNNs for sequences, and Transformers for natural language processing.";
    }
    
    if (lowerPrompt.includes('python') || lowerPrompt.includes('programming')) {
      return "Python is the most popular language for data science due to its simplicity and rich ecosystem. Key libraries include NumPy (numerical computing), Pandas (data manipulation), Scikit-learn (machine learning), and TensorFlow/PyTorch (deep learning). Jupyter notebooks provide an interactive development environment.";
    }
    
    if (lowerPrompt.includes('statistics') || lowerPrompt.includes('statistical')) {
      return "Statistics provides the mathematical foundation for data science. Key concepts include descriptive statistics (mean, median, variance), inferential statistics (hypothesis testing, confidence intervals), and probability distributions. Understanding p-values, correlation vs causation, and experimental design is crucial for valid analysis.";
    }
    
    // Default intelligent response
    return `That's an interesting question about ${prompt}. In data science, this topic relates to understanding patterns in data and making evidence-based decisions. I'd recommend exploring relevant datasets, considering statistical methods, and validating any findings through proper experimental design. Would you like me to elaborate on any specific aspect?`;
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
    setIsLoading(true);
    const newMessage = { role: 'user', content: userMessage };
    // Always build message history for context retention
    const updatedMessages = chatMessages && chatMessages.length > 0 ? [...chatMessages, newMessage] : [
      { role: 'system', content: 'You are a helpful scientific research assistant.' },
      newMessage
    ];
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

  const filteredModels = animalModels.filter(model =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.phenotypes.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
    model.applications.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">DS Research Assistant</h1>
          <p className="text-gray-600">Down syndrome animal model comparison and experimental design guidance</p>
          <div className="text-sm text-gray-500 mt-2 bg-white/50 rounded-lg p-2 inline-block">
            💡 Open Source • Evidence-Based • ARRIVE compliance
          </div>
        </header>

        <nav className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-lg">
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
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="bg-white rounded-xl shadow-lg p-6">
          {activeTab === 'models' && (
            <div>
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
            <div>
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
            <div>
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
            <div>
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
            <div>
              <h2 className="text-2xl font-semibold mb-4">AI Research Assistant</h2>
              <div className="border rounded-lg h-96 flex flex-col">
                <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                      <p className="mb-4">Ask me about DS animal models, experimental design, or research guidance!</p>
                      <div className="text-sm space-y-2 bg-gray-50 p-4 rounded-lg">
                        <p><strong>Try asking:</strong></p>
                        <p>• "Which model is best for cognitive studies?"</p>
                        <p>• "How many mice do I need for behavioral testing?"</p>
                        <p>• "What are the advantages of Ts65Dn vs Tc1?"</p>
                        <p>• "Design tips for immunotherapy studies?"</p>
                        <p>• "What RRID should I use for Dp16 mice?"</p>
                        <p>• "ARRIVE guidelines for my study?"</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {chatMessages
                        .filter(msg => msg.role !== 'system')
                        .map((msg, idx) => (
                          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-lg ${
                              msg.role === 'user'
                                ? 'bg-blue-500 text-white'
                                : msg.isAiResponse
                                  ? 'bg-green-50 text-gray-800 border-2 border-green-200'
                                  : 'bg-gray-100 text-gray-800'
                            }`}>
                              {msg.role === 'assistant' && msg.isAiResponse && (
                                <div className="text-xs text-green-600 mb-1 flex items-center gap-1">
                                  🤖 AI Enhanced • Real-time response
                                </div>
                              )}
                              {/* Render <think>...</think> as grey italic, rest as normal markdown */}
                              {(() => {
                                const thinkMatch = msg.content.match(/<think>([\s\S]*?)<\/think>/i);
                                if (thinkMatch) {
                                  const before = msg.content.slice(0, thinkMatch.index);
                                  const thinkText = thinkMatch[1];
                                  const after = msg.content.slice(thinkMatch.index + thinkMatch[0].length);
                                  return (
                                    <>
                                      {before && <MarkdownMessage content={before} />}
                                      <div style={{ color: '#6b7280', fontStyle: 'italic', margin: '0.5em 0' }}>
                                        {thinkText}
                                      </div>
                                      {after && <MarkdownMessage content={after} />}
                                    </>
                                  );
                                } else {
                                  return <MarkdownMessage content={msg.content} />;
                                }
                              })()}
                            </div>
                          </div>
                        ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                              <span>AI is thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="border-t p-4 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleChat(chatInput)}
                    placeholder="Ask about DS models, experimental design, RRIDs, sample sizes..."
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => handleChat(chatInput)}
                    disabled={isLoading || !chatInput.trim()}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isLoading || !chatInput.trim()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isLoading ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="text-center text-gray-500 text-sm mt-8">
          <p>DS Research Assistant • Open Source • 
            <a href="https://github.com/asathyanesan/ds-research-tool" className="text-blue-600 hover:underline ml-1">
              View on GitHub
            </a>
          </p>
          <p className="mt-2">✨ Featuring proper RRIDs for reproducible research</p>
        </footer>
      </div>
    </div>
  );
}


export default App;
