# PR Draft: Add DialectOS to awesome-mcp-servers

**Repo to submit to:** `punkpeye/awesome-mcp-servers`
**Your fork:** `Pastorsimon1798/awesome-mcp-servers`
**Branch to create:** `add-dialectos`

---

## Step 1: Edit your fork

In `Pastorsimon1798/awesome-mcp-servers`, edit `README.md`.

Find the section `[🌐 - Translation](#translation)` (or create it after `[🛠️ - Developer Tools](#developer-tools)`).

Add this line alphabetically within that section:

```markdown
- 📇 🏠 [DialectOS](https://github.com/Pastorsimon1798/DialectOS) - Spanish dialect translation server with 25 regional variants, structure preservation, and adversarial quality gates. Supports markdown, i18n locales, and gender-neutral language.
```

If no Translation section exists, add this section before `## Frameworks`:

```markdown
### 🌐 Translation

- 📇 🏠 [DialectOS](https://github.com/Pastorsimon1798/DialectOS) - Spanish dialect translation server with 25 regional variants, structure preservation, and adversarial quality gates. Supports markdown, i18n locales, and gender-neutral language.
```

Also add the Translation link to the table of contents:
```markdown
* 🌐 - [Translation](#translation)
```

## Step 2: Commit and push

```bash
git checkout -b add-dialectos
git add README.md
git commit -m "Add DialectOS — MCP server for Spanish dialect translation"
git push origin add-dialectos
```

## Step 3: Create PR

Go to: `https://github.com/punkpeye/awesome-mcp-servers/compare/main...Pastorsimon1798:awesome-mcp-servers:add-dialectos`

**Title:** `Add DialectOS — MCP server for Spanish dialect translation`

**Body:**
```
Adds [DialectOS](https://github.com/Pastorsimon1798/DialectOS) to the Translation section.

DialectOS is an open-source MCP server for Spanish regional dialect translation:
- 25 Spanish dialects (es-MX, es-AR, es-CO, es-PR, etc.)
- 17 MCP tools for translation, i18n, glossary, and research workflows
- Structure-preserving markdown translation (tables, code blocks, links)
- Adversarial quality gates (semantic drift, negation preservation, structure validation)
- 1034 tests across 7 packages
- BSL 1.1 license (free for most use, Apache-2.0 in 2030)
```
