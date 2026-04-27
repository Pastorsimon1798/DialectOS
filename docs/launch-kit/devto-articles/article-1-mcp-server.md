---
title: "Building an MCP Server for Spanish Dialect Translation"
published: false
description: "How we built DialectOS — a Model Context Protocol server that translates across 25 Spanish regional variants with structure preservation and adversarial quality gates."
tags: mcp, spanish, translation, i18n, typescript, ai, openai, claude
---

# Building an MCP Server for Spanish Dialect Translation

Spanish is not one language. It's 25 regional variants with different vocabulary, formality levels, slang, and grammatical preferences. Yet every translation API treats it as a monolith.

We learned this the hard way.

> *"We shipped a product to Mexico using our Spain Spanish translations. Users thought we were being intentionally rude."*

That's why we built **DialectOS** — the first [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server built specifically for Spanish dialects.

## What is MCP?

MCP is an open protocol that lets AI assistants like Claude use external tools. Instead of copy-pasting text into a translation UI, your AI assistant can call DialectOS natively through 17 specialized tools.

## The Problem: Generic Spanish Fails

Here are three examples that break generic translation:

| English | Spain (es-ES) | Mexico (es-MX) | Puerto Rico (es-PR) |
|---------|---------------|----------------|---------------------|
| car | coche | carro | carro |
| orange juice | jugo de naranja | jugo de naranja | **jugo de china** |
| pick up (tidy) | recoger | recoger | **recoger el cuarto** |
| you (informal) | tú | tú | **tú** (but vocabulary shifts) |

Google Translate gives you generic Spanish. DeepL gives you ~5 variants. DialectOS handles all 25.

## Architecture

```
MCP Client (Claude Desktop)
  ↓ stdio
@dialectos/mcp (17 tools)
  ↓
@dialectos/cli
  ↓
@dialectos/providers
  ├─ LLM (OpenAI / Anthropic / LM Studio)
  ├─ DeepL
  └─ LibreTranslate / MyMemory
```

## 17 MCP Tools

**Markdown Translation (4):**
- `translate_markdown` — preserve tables, code blocks, links
- `extract_translatable` — extract only translatable text
- `translate_api_docs` — cell-level table translation
- `create_bilingual_doc` — side-by-side documents

**i18n (6):**
- `detect_missing_keys` — compare locale files
- `translate_missing_keys` — auto-translate gaps
- `batch_translate_locales` — batch to multiple dialects
- `manage_dialect_variants` — create dialect-specific variants
- `check_formality` — tú vs usted consistency
- `apply_gender_neutral` — elles / latine / -e / -x

**Translation (7):**
- `translate_text` — with semantic context and quality contracts
- `detect_dialect` — detect dialect from sample text
- `translate_code_comment` — preserve code, translate comments
- `translate_readme` — full README pipeline
- `search_glossary` — 300+ source-attributed terms
- `list_dialects` — all 25 supported variants
- `research_regional_term` — source-backed lexeme proposals

## Quality Gates

Every translation passes 4 dimensions:

```
Quality Score = tokenIntegrity×25% + glossaryFidelity×30% + structureIntegrity×20% + semanticSimilarity×25%
```

**Semantic backstop** catches borderline scores (0.35–0.6) with:
- Negation preservation ("Do not click" → "Haz clic" = auto-rejected)
- Keyword overlap
- Structural parity

## Try It

```bash
# MCP setup
npx -y @dialectos/mcp

# CLI
npm install -g @dialectos/cli
dialectos translate "Hello world" --dialect es-MX
```

## Open Source

- **746 tests** across 7 packages
- **BSL 1.1** — free for most use, becomes Apache-2.0 in 2030
- [GitHub](https://github.com/Pastorsimon1798/DialectOS)
- [Live Demo](https://pastorsimon1798.github.io/DialectOS)

---

*What's your Spanish localization horror story? Drop it in the comments.*
