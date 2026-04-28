# Hacker News: Show HN Post

**Title:** Show HN: DialectOS — MCP server for 25 Spanish dialects with quality gates

**URL:** https://github.com/Pastorsimon1798/DialectOS

**Best time to post:** Tuesday or Thursday, 7-9 AM PT

---

**Body:**

We built DialectOS after shipping Spain Spanish translations to Mexico and learning that users thought we were being intentionally rude.

Spanish is not one language — it's 25 regional variants with different vocabulary, formality levels, and grammar. Yet every translation API treats it as a monolith.

**What DialectOS does:**

- Translates to 25 Spanish dialects (es-MX, es-AR, es-CO, es-PR, etc.)
- Runs as an MCP server — Claude Desktop, Cursor use it natively
- Preserves markdown structure (tables, code blocks, links)
- Applies adversarial quality gates
- Works with any LLM (OpenAI, Anthropic, LM Studio local)

**Quality gates are the interesting part:**

Every translation passes 4 checks:
1. Token integrity — protected terms preserved
2. Glossary fidelity — enforced terminology used
3. Structure integrity — markdown intact
4. Semantic similarity — meaning didn't drift

A semantic backstop catches borderline scores. If "Do not click" becomes "Haz clic" (opposite meaning), it's auto-rejected.

**Tech:** TypeScript monorepo, 7 packages, 1034 tests, pnpm workspace, stdio MCP.

**Demo:** https://pastorsimon1798.github.io/DialectOS

Would love feedback on the architecture, the quality gate design, or any Spanish localization war stories.
