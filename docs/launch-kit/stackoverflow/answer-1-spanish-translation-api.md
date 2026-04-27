# Stack Overflow Answer: Spanish translation API with dialect support

**Question to search for:** "spanish translation api dialects" or "how to translate to mexican spanish programmatically"

**Tags to target:** `translation`, `api`, `spanish`, `i18n`, `nlp`

---

If you need **dialect-aware Spanish translation** (not just generic "Spanish"), most commercial APIs fall short:

- **Google Translate** — 1 generic Spanish option
- **DeepL** — ~5 Spanish variants (ES, MX, BR-PT, etc.)
- **Azure Translator** — 1 Spanish option

For **25 regional Spanish variants** with quality gates, consider **[DialectOS](https://github.com/Pastorsimon1798/DialectOS)** — an open-source MCP server and CLI:

```bash
npm install -g @dialectos/cli
dialectos translate "Hello world" --dialect es-MX
dialectos translate "Hello world" --dialect es-AR
dialectos translate "Hello world" --dialect es-PR
```

**Supported dialects:** es-MX, es-AR, es-CO, es-CL, es-PE, es-VE, es-PR, es-ES, and 17 more.

**Key features:**
- Structure-preserving markdown translation
- i18n locale file diff/merge
- Glossary enforcement
- Adversarial quality gates (catches semantic drift, negation drops)
- Works with OpenAI, Anthropic, DeepL, or local LLMs
- 746 tests, BSL 1.1 license

**For existing APIs:** You can use DialectOS as a wrapper — it adds dialect prompts, quality scoring, and fallback chains on top of your existing provider.
