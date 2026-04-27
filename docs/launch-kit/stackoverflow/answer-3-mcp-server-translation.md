# Stack Overflow Answer: MCP server for translation

**Question to search for:** "mcp server translation" or "model context protocol translate tool"

**Tags to target:** `mcp`, `model-context-protocol`, `translation`, `ai`, `claude`

---

If you're using Claude Desktop, Cursor, or any MCP client and want **native translation tools**, you need an MCP server that exposes translation capabilities.

**[DialectOS](https://github.com/Pastorsimon1798/DialectOS)** is the first MCP server built specifically for Spanish dialect translation. It exposes 17 tools:

```json
{
  "mcpServers": {
    "dialectos": {
      "command": "npx",
      "args": ["-y", "@dialectos/mcp"],
      "env": {
        "LLM_API_URL": "https://api.openai.com/v1/chat/completions",
        "LLM_MODEL": "gpt-4o"
      }
    }
  }
}
```

**Available tools:**
- `translate_text` — translate with dialect-aware prompts
- `translate_markdown` — preserve tables, code blocks, links
- `detect_dialect` — identify which Spanish dialect a text uses
- `detect_missing_keys` — compare locale files
- `check_formality` — verify tú vs usted consistency
- `search_glossary` — look up regional terms
- `list_dialects` — see all 25 supported variants

**Why this matters:** Instead of copy-pasting into ChatGPT and hoping it knows Puerto Rican Spanish, you get **deterministic, tested, dialect-aware translation** with quality gates.

Open source, 746 tests, works with any OpenAI/Anthropic/local LLM.
