# DS Research Assistant (alpha)

A web tool for Down syndrome rodent model selection, experimental design, and ARRIVE-compliant reporting.

Live: [https://asathyanesan.github.io/ds-research-tool-test/](https://asathyanesan.github.io/ds-research-tool-test/)

---

## Features

- **Animal Model Database** — 59 DS rodent models (mouse and rat) with RRIDs, background strains, gene counts, and descriptions; filterable by type and species
- **AI Research Assistant** — GPT-5.5, GPT-5.4-pro, and GPT-5.4 via FlyerGPT Azure; citations grounded to a 1,200+ paper verified PubMed bibliography with clickable PMID links
- **Sample Size Calculator** — G\*Power-style two-group calculator with effect size presets, alpha/power controls, and attrition adjustment
- **ARRIVE Checklist** — DS-specific checklist covering source & strain, genotype, sex, developmental stage, age & weight, housing, procedures, statistics, and results
- **Model Comparison** — Side-by-side table and key paper cards for selected models

---

## Issues

Report bugs or suggest improvements via [GitHub Issues](https://github.com/asathyanesan/ds-research-tool-test/issues). Please include your browser, steps to reproduce, and any console errors.

---

## License

MIT — see [LICENSE](LICENSE).

---

## Acknowledgements

- Animal model data sourced from [abbash83/DS_Rodent_Models_Database](https://github.com/abbash83/DS_Rodent_Models_Database), compiled from: Folz, A., Sloan, K., Roper, R.J. (2025). *Mouse Models of Down Syndrome*. Springer.
- Bibliography assembled from PubMed via NCBI E-utilities — [browse the full bibliography (1,200+ papers)](https://github.com/asathyanesan/ds-research-tool-test/blob/main/react-app/public/data/bibliography.json)
- [Jackson Laboratory](https://www.jax.org/) for strain and RRID information
- [ARRIVE guidelines](https://arriveguidelines.org/) consortium
- AI powered by [University of Dayton](https://udayton.edu/) FlyerGPT Azure APIM (GPT-5.5, GPT-5.4-pro, GPT-5.4)

