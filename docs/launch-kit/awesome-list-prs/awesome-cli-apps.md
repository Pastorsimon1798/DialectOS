# PR Draft: Add DialectOS to awesome-cli-apps

**Repo to submit to:** `agarrharr/awesome-cli-apps`
**Your fork:** `Pastorsimon1798/awesome-cli-apps` (fork if needed)
**Branch to create:** `add-dialectos`

---

## Step 1: Fork and edit

Fork `agarrharr/awesome-cli-apps`, then edit `README.md`.

Find the section for **Translation / Internationalization** or **Text** tools.

Add this line alphabetically:

```markdown
- [DialectOS](https://github.com/Pastorsimon1798/DialectOS) - Spanish dialect translation CLI with 25 regional variants, markdown preservation, and quality gates.
```

## Step 2: Commit and push

```bash
git checkout -b add-dialectos
git add README.md
git commit -m "Add DialectOS CLI for Spanish dialect translation"
git push origin add-dialectos
```

## Step 3: Create PR

**Title:** `Add DialectOS — Spanish dialect translation CLI`

**Body:**
```
DialectOS is a CLI tool and MCP server for Spanish regional dialect translation:

- Translate to 25 Spanish dialects from the command line
- Preserve markdown structure (tables, code blocks, links)
- i18n locale file diff and merge
- Adversarial quality gates catch semantic drift
- Works with any OpenAI/Anthropic/local LLM provider
```
