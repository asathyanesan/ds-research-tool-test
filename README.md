# DS Research Assistant (alpha version) 🧬

A demo web application for Down syndrome animal model comparison and experimental design guidance. Built with React and deployed free on GitHub Pages.

## 🐁 Features

- **Animal Model Database**: Compare Ts65Dn, Tc1, Dp(16)1Yey, and other DS mouse models
- **Study Design Wizard**: Get guidance on experimental design and sample sizes
- **ARRIVE Compliance**: Interactive checklist for reproducible research
- **Model Comparison Tool**: Side-by-side comparison of different animal models
- **Repository Links**: Direct links to strain information and ordering
- **Search & Filter**: Find the right model for your research question

## 🌐 Demo

Visit: [https://asathyanesan.github.io/ds-research-tool](https://asathyanesan.github.io/ds-research-tool)

## 🛠️ Local Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Azure OpenAI API access (endpoint and API key)

### Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/asathyanesan/ds-research-tool.git
cd ds-research-tool
```

#### 2. Backend Setup (Azure OpenAI Proxy)
```bash
cd backend
npm install

# Copy environment template and configure Azure credentials
cp .env.example .env
# Edit .env and add your Azure OpenAI credentials:
# - AZURE_OPENAI_ENDPOINT (e.g., https://your-resource.openai.azure.com/)
# - AZURE_OPENAI_API_KEY (from Azure Portal)
# - AZURE_OPENAI_DEPLOYMENT_NAME (your GPT deployment name)

# Start backend server (runs on port 3001)
npm start
```

#### 3. Frontend Setup
```bash
cd ../react-app
npm install

# Start development server (runs on port 5173)
npm run dev
```

#### 4. Access the Application
Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

The frontend will automatically proxy API requests to the backend server running on port 3001.

### Azure OpenAI Configuration

To use the AI Assistant chat feature, you need:

1. **Azure OpenAI Resource**: Create one at [Azure Portal](https://portal.azure.com)
2. **Model Deployment**: Deploy GPT-4, GPT-4 Turbo, or GPT-3.5 Turbo in Azure OpenAI Studio
3. **API Credentials**: Get your endpoint URL and API key from Azure Portal
4. **Environment Variables**: 
   - **Local dev**: Configure `backend/.env` with your credentials (see `backend/.env.example`)
   - **Production**: Add secrets to GitHub for automated deployment (see [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md))

Without Azure OpenAI configured, the chat will fall back to mock responses with DS research knowledge.

## 📊 Animal Models Included

| Model | Type | Genes | Best For | RRID |
|-------|------|-------|----------|------|
| **Ts65Dn** | Partial trisomy | 104 | Cognitive studies | IMSR_JAX:001924 |
| **Tc1** | Complete HSA21 | Most DS genes | Molecular studies | IMSR_JAX:004924 |
| **Dp(16)1Yey** | Partial trisomy | 33 | Interferon/immune | IMSR_JAX:013530 |
| **Dp(17)1Yey** | Control model | 24 | Control studies | IMSR_JAX:013529 |

## 🧪 Research Guidelines

### Sample Size Recommendations
- **Behavioral studies**: n≥10 per group (80% power, α=0.05)
- **Molecular studies**: n≥6 per group
- **Account for attrition**: Add 10-20% extra animals
- **Sex as biological variable**: Use equal males/females

### Common Endpoints by Model
- **Ts65Dn**: Morris Water Maze, Y-maze, Novel Object Recognition
- **Tc1**: Gene expression, molecular markers, human relevance
- **Dp16**: Cytokine levels, interferon signaling, neuroinflammation

## 📋 ARRIVE Guidelines

The tool includes a comprehensive ARRIVE checklist covering:
- Study design and sample size calculation
- Animal details and housing conditions  
- Experimental procedures and outcomes
- Statistical analysis and reporting
- Results presentation

## 🔄 Data Updates

Animal model data and research guidelines are automatically updated weekly via GitHub Actions. Data sources include:
- PubMed literature database
- Jackson Laboratory strain information
- ARRIVE guidelines consortium
- Community contributions

## 🤝 Contributing

Coming soon!

### Adding New Models
1. Edit `react-app/public/data/animal-models.json`
2. Follow the existing data structure
3. Include Jackson Lab links where available
4. Submit a pull request

### Reporting Issues
- Use GitHub Issues for bug reports
- Include browser and device information
- Provide steps to reproduce

## 🏗️ Project Structure

```
ds-research-tool/
├── backend/
│   ├── services/
│   │   └── azureOpenAI.js       # Azure OpenAI API integration
│   ├── server.js                 # Express server with API proxy
│   ├── package.json
│   ├── .env.example             # Environment variable template
│   └── .env                     # Your Azure credentials (gitignored)
├── react-app/
│   ├── public/
│   │   └── data/
│   │       ├── animal-models.json
│   │       └── arrive-guidelines.json
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── .github/
│   └── workflows/
│       └── deploy.yml
├── .gitignore
└── README.md
```

## 🚀 Deployment

### Frontend Deployment (GitHub Pages)

The frontend automatically deploys to GitHub Pages via GitHub Actions when changes are pushed to the main branch. 

To deploy manually:
```bash
cd react-app
npm run build
npm run deploy
```

### Backend Deployment (Automated via GitHub Actions)

The backend automatically deploys to Azure Web App using GitHub Actions when you push to the main branch.

#### Setup (One-Time)

1. **Create Azure Web App** and get publish profile
2. **Add GitHub Secrets** with your Azure credentials
3. **Update production backend URL** in `react-app/.env.production`

**📋 Detailed Instructions:** See [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md)

#### Required GitHub Secrets

Add these in **Settings → Secrets and variables → Actions**:
- `AZURE_OPENAI_ENDPOINT` - Your Azure OpenAI endpoint
- `AZURE_OPENAI_API_KEY` - Your Azure OpenAI API key
- `AZURE_OPENAI_DEPLOYMENT_NAME` - Your GPT deployment name
- `AZURE_WEBAPP_NAME` - Your Azure Web App name
- `AZURE_WEBAPP_PUBLISH_PROFILE` - Download from Azure Portal

#### Manual Deployment

Trigger manually from **Actions** tab → **Deploy Backend to Azure** → **Run workflow**

#### Alternative Deployment Options

**Option 1: Oracle Cloud Always Free (Recommended - FREE Forever!)**

Deploy your backend to Oracle Cloud's free tier - never expires, no credit card required!

📖 **[Complete Oracle Cloud Setup Guide](ORACLE_CLOUD_SETUP.md)** ← **START HERE**

Features:
- ✅ **FREE forever** (4 OCPUs + 24 GB RAM)
- ✅ Handles 100-200 daily users
- ✅ Never sleeps (unlike Render/Railway)
- ✅ 10 TB bandwidth/month
- ✅ Full backend functionality (RAG + citations)

**Option 2: Vercel**
```bash
npm i -g vercel
cd backend
vercel
```

**Option 3: Railway / Render**
1. Connect GitHub repo
2. Select `backend` folder as root directory
3. Add environment variables
4. Deploy on git push

## 🧬 Model Selection Guide

### For Cognitive/Behavioral Studies
- **Ts65Dn**: Most established, extensive literature
- **Tc1**: Human chromosome 21, all DS genes

### For Molecular Studies
- **Tc1**: High genetic relevance to human trisomy
- **Dp(16)1Yey**: Defined gene set, interferon focus

### For Immunology/Inflammation
- **Dp(16)1Yey**: JAK/STAT pathway, interferon dysregulation

### For Control Studies
- **Dp(17)1Yey**: Complementary to Ts65Dn studies

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Trisomy 21 Research Society
- Jackson Laboratory for strain information
- ARRIVE guidelines consortium
- Open source contributors

## 📞 Support

- 🐛 Issues: [GitHub Issues](https://github.com/asathyanesan/ds-research-tool/issues)
- 💬 Discussions: coming soon!

---

**Made with ❤️ for the DS community**

## 🔧 Technical Details

- **Frontend**: React 18 with Vite
- **Backend**: Node.js + Express (API proxy for Azure OpenAI)
- **AI**: Azure OpenAI (GPT-4/GPT-5.1) via secure backend proxy
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Markdown Rendering**: react-markdown for AI responses
- **Deployment**: 
  - Frontend: GitHub Pages with GitHub Actions
  - Backend: Azure App Service, Vercel, or Railway (requires separate deployment)
- **Data**: JSON files served statically
- **Security**: API keys stored server-side, never exposed to browser
Down syndrome animal model research assistant
