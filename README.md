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
- FlyerGPT Azure APIM API key

### Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/asathyanesan/ds-research-tool-test.git
cd ds-research-tool-test
```

#### 2. Frontend Setup
```bash
cd react-app
npm install
```

#### 3. Configure API Key
Create `react-app/.env.local` with your FlyerGPT key:
```
VITE_FLYER_API_KEY=your-flyergpt-api-key-here
```

#### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

### FlyerGPT Configuration

The app calls FlyerGPT Azure APIM (`https://apim-n1ai-use2-flyer.azure-api.net`) directly from the browser — no backend required. It supports two models:

- **GPT-5.5** — OpenAI-style endpoint, selected by default
- **Claude Opus 4.7** — Anthropic-style endpoint

The `VITE_FLYER_API_KEY` environment variable is used for both models.

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
ds-research-tool-test/
├── react-app/
│   ├── public/
│   │   └── data/
│   │       ├── animal-models.json
│   │       └── arrive-guidelines.json
│   ├── src/
│   │   ├── App.jsx              # Main app with FlyerGPT direct calls
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Pages deployment
├── .gitignore
└── README.md
```

## 🚀 Deployment

### Deployment (GitHub Pages)

The app deploys automatically to GitHub Pages via GitHub Actions on every push to `main`.

#### Required GitHub Secret

Add one secret in **Settings → Secrets and variables → Actions**:
- `VITE_FLYER_API_KEY` — Your FlyerGPT Azure APIM API key

No backend deployment needed — the app calls FlyerGPT directly from the browser.

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
- **AI**: FlyerGPT Azure APIM — GPT-5.5 (OpenAI-style) + Claude Opus 4.7 (Anthropic-style)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Markdown Rendering**: react-markdown for AI responses
- **Deployment**: GitHub Pages via GitHub Actions (single `VITE_FLYER_API_KEY` secret)
- **Data**: JSON files served statically
Down syndrome animal model research assistant
