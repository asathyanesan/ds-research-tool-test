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

### Setup
```bash
git clone https://github.com/asathyanesan/ds-research-tool.git
cd ds-research-tool/react-app
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

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
└── README.md
```

## 🚀 Deployment

The application automatically deploys to GitHub Pages via GitHub Actions when changes are pushed to the main branch. To deploy manually:

1. Build the application:
   ```bash
   cd react-app
   npm run build
   ```

2. Deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

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
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Search**: Fuse.js for fuzzy search
- **Deployment**: GitHub Pages with GitHub Actions
- **Data**: JSON files served statically
Down syndrome animal model research assistant
