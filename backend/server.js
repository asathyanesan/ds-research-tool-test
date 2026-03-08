import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { callAzureOpenAI, getSystemPrompt } from './services/azureOpenAI.js';
import { verifyAndCleanResponse } from './services/pubmedVerifier.js';
import { searchRelevantPapers } from './services/pubmedSearch.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Parse allowed origins from environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'https://asathyanesan.github.io'];

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any allowed origins (including wildcard subdomain matching)
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin === origin) return true;
      // Allow subdomains for GitHub Pages
      if (allowedOrigin.includes('github.io') && origin?.includes('github.io')) return true;
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'DS Research Assistant Backend',
    version: '1.0.0'
  });
});

// Chat endpoint - proxies requests to Azure OpenAI
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, options = {} } = req.body;

    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request must include a "messages" array'
      });
    }

    // Validate message format
    const validMessages = messages.every(msg => 
      msg.role && msg.content && 
      ['system', 'user', 'assistant'].includes(msg.role)
    );

    if (!validMessages) {
      return res.status(400).json({
        error: 'Invalid message format',
        message: 'Each message must have "role" (system/user/assistant) and "content" properties'
      });
    }

    // Add system prompt if not present
    let messagesWithSystem = [...messages];
    if (!messages.some(msg => msg.role === 'system')) {
      messagesWithSystem = [getSystemPrompt(), ...messages];
    }

    // Search PubMed for relevant papers based on user's question
    const userQuestion = messages[messages.length - 1].content;
    console.log(`[Chat] Searching PubMed for papers related to: ${userQuestion}`);
    
    const { papers, referenceText } = await searchRelevantPapers(userQuestion, 8);
    
    // If we found papers, add them as context to the user's message
    if (papers.length > 0) {
      console.log(`[Chat] Found ${papers.length} relevant papers, adding as context`);
      
      // Enhance the last user message with reference context
      const enhancedMessages = [...messagesWithSystem];
      const lastUserMsgIndex = enhancedMessages.map((m, i) => m.role === 'user' ? i : -1).filter(i => i >= 0).pop();
      
      enhancedMessages[lastUserMsgIndex] = {
        role: 'user',
        content: `${userQuestion}${referenceText}`
      };
      
      messagesWithSystem = enhancedMessages;
    } else {
      console.log('[Chat] No relevant papers found in PubMed search');
    }

    // Call Azure OpenAI
    const response = await callAzureOpenAI(messagesWithSystem, options);

    // Verify and clean PMID citations
    const { cleanedResponse, verificationReport } = await verifyAndCleanResponse(response);

    // Return successful response with verification report
    res.json({
      success: true,
      response: cleanedResponse,
      verification: verificationReport,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat endpoint error:', error);

    // Return error response
    res.status(500).json({
      error: 'Chat request failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DS Research Assistant Backend running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
  
  // Validate environment variables
  const requiredVars = [
    'AZURE_OPENAI_ENDPOINT',
    'AZURE_OPENAI_API_KEY',
    'AZURE_OPENAI_DEPLOYMENT_NAME'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('⚠️  Warning: Missing required environment variables:');
    missingVars.forEach(varName => console.warn(`   - ${varName}`));
    console.warn('   Please check your .env file');
  } else {
    console.log('✅ Azure OpenAI configuration validated');
  }
});
