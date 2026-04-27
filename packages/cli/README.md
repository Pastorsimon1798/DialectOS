# @dialectos/cli

CLI commands for Spanish dialect translation workflows.

## Installation

```bash
npm install -g @dialectos/cli
```

## Commands

### Translation

```bash
# Translate text to a specific dialect
dialectos translate "Hello world" --dialect es-MX

# Translate with formal / slang register
dialectos translate "Hello world" --dialect es-MX --register formal
dialectos translate "Hello world" --dialect es-AR --register slang

# Translate a README preserving structure
dialectos translate-readme README.md --dialect es-AR --output README.ar.md

# Translate API documentation
dialectos translate-api-docs api.md --dialect es-CO --output api.co.md
```

### i18n

```bash
# Detect missing keys between locale files
dialectos i18n detect-missing ./locales/en.json ./locales/es.json

# Translate missing keys
dialectos i18n translate-missing ./locales/en.json ./locales/es.json --dialect es-MX

# Batch translate to multiple dialects
dialectos i18n batch-translate ./locales/en.json --dialects es-MX,es-AR,es-CO

# Create dialect-specific variant from es-ES base
dialectos i18n manage-variants ./locales/es-ES.json --variant es-MX --output ./locales/es-MX.json

# Check formality consistency
dialectos i18n check-formality ./locales/es.json --expected formal

# Apply gender-neutral language
dialectos i18n apply-gender-neutral ./locales/es.json --output ./locales/es-neutral.json
```

### Dialects

```bash
# List all supported dialects
dialectos dialects list

# Detect dialect from text (includes register classification)
dialectos dialects detect "Che boludo, qué onda?"
dialectos dialects detect "Estimado señor, le saludo cordialmente"
```

### Glossary

```bash
# Search glossary terms
dialectos glossary search "API"

# Get detailed term info
dialectos glossary get "machine learning"
```

## Policy Profiles

Choose a preset for safety/reliability tradeoffs:

```bash
# Strict: fail on any error, enforce all validations
dialectos translate-readme README.md --policy strict --dialect es-ES

# Balanced (default): allow partial output, warn on issues
dialectos translate-readme README.md --policy balanced --dialect es-MX

# Permissive: maximize throughput, skip validations
dialectos translate-readme README.md --policy permissive --dialect es-AR
```

## Quality Gates

Every translation is scored across 4 dimensions:
- **Token Integrity** — Protected terms preserved
- **Glossary Fidelity** — Enforced terminology used
- **Structure Integrity** — Markdown structure intact
- **Semantic Similarity** — Meaning not drifted

Output: `score=95 token=100% glossary=100% structure=pass semantic=91%`
