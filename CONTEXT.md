# DialectOS Context

## Product

**DialectOS** is a Spanish dialect translation toolkit delivered as:
- A **CLI** (`dialectos`) for translation, validation, and batch i18n workflows.
- An **MCP server** (`dialectos-mcp`) exposing translation tools to AI assistants.
- A **browser demo** (`docs/index.html`) that can run in client-only mode or backed by a live HTTP API.
- A **library monorepo** (`@dialectos/*`) for programmatic use.

> **Launch readiness** means: every public claim in README, SECURITY, and package docs is backed by a passing automated verifier that can be run from a clean checkout or against the live public URL.

---

## Core Domain Terms

### Dialect
One of 25 regional Spanish variants identified by a BCP-47 code (e.g., `es-MX`, `es-AR`). The canonical list is `ALL_SPANISH_DIALECTS` in `@dialectos/types`.

### Translation Provider
A backend that performs actual translation. Supported providers: `llm`, `deepl`, `libre`, `mymemory`. Consumers should not instantiate providers directly; they should use `createProviderRegistry()`.

### Provider Registry
Factory that selects and configures providers. Always use `createProviderRegistry()` or `getDefaultProviderRegistry()` rather than constructing `LLMProvider` directly.

### Quality Gate
A validation step (semantic, structural, adversarial) that blocks bad translations. Examples: negation preservation, markdown link cardinality, table row count, dialect-specific vocabulary.

### Certification (internal)
The adversarial benchmark run (`scripts/dialect-certify-adversarial.mjs`) that proves the engine passes a corpus of adversarial fixtures. **This is not a customer deliverable.**

### Customer Audit (paid)
A human-reviewed launch-readiness report generated from real translations of a customer's content. Distinct from internal certification.

### Client Mode
The browser demo's fallback behavior when the backend is unreachable. It performs static dialect detection and vocabulary adaptation without calling a provider. Also called "vocabulary engine" in UI copy.

### Backend / Demo Server
The HTTP server (`scripts/demo-server.mjs`) that serves the static demo and routes `/api/translate` to the configured provider stack.

### Launch Gate
The single executable script (`scripts/launch-gate.mjs`) that must pass before any positive launch claim is restored. It orchestrates build, test, coverage, audit, benchmark, certification, package smoke, and compose validation.

---

## Workspace Packages

| Package | Role | Verified Export Surface |
|---------|------|------------------------|
| `@dialectos/types` | Types, schemas, dictionary data | `SpanishDialect`, `ALL_SPANISH_DIALECTS`, `DICTIONARY`, `VERB_CONJUGATIONS`, `Result`, `ok`, `err` |
| `@dialectos/security` | Path validation, sanitization, rate limiting | `validateFilePath`, `validateJsonPath`, `validateMarkdownUrl`, `sanitizeErrorMessage`, `sanitizeHtml`, `RateLimiter`, `SecurityError`, `ErrorCode` |
| `@dialectos/locale-utils` | Locale file operations | `readLocaleFile`, `writeLocaleFile`, `flattenLocale`, `unflattenLocale`, `diffLocales` |
| `@dialectos/markdown-parser` | Markdown structure preservation | `parseMarkdown`, `reconstructMarkdown`, `extractTranslatableText`, `countCodeBlocks`, `countLinks` |
| `@dialectos/providers` | Translation providers + bulk engine | `createProviderRegistry`, `LLMProvider`, `ProviderRegistry`, `TranslationMemory`, `BulkTranslationEngine` |
| `@dialectos/cli` | CLI commands | `dialectos` binary. **Not importable as a library until API split is complete.** |
| `@dialectos/mcp` | MCP server | `createServer` binary. **Not importable as a library.** |

> **Rule:** If an export is listed above, it must be present in `dist/index.d.ts` after `pnpm build`. If it is not listed, do not tell consumers it exists.

---

## Key Runtime Concepts

### Locale File
A JSON file of key-value pairs representing translated strings. Can be flat or nested; `locale-utils` normalizes to flat for diff/merge operations.

### Glossary
A JSON mapping of source terms to dialect-specific translations. Enforced during translation when `--glossary-mode=strict`.

### Translation Memory
In-memory cache of previous translations keyed by SHA-256 of `(sourceText, dialect, register)`. TTL eviction and max-size caps are configurable.

### Dead-Letter Queue (DLQ)
A JSONL file capturing failed translation items during bulk jobs for later inspection.

### Checkpoint
A resumable state file for long-running bulk translation jobs. Written atomically (temp + rename) at configurable intervals.

---

## Build & Test conventions

- **Language:** TypeScript, target ES2022, module Node16.
- **Imports:** Use `.js` extensions for all local imports.
- **Scripts:** Keep thin. Shared logic goes in `packages/cli/src/lib/`.
- **Unit tests:** `vitest` per package, named `*.test.ts`.
- **Script contract tests:** `node --test` for public-claim, discovery, and workflow verification.
- **Dictionary edits:** Change `packages/types/src/dialectal-dictionary.json`, not the `.ts` wrapper.
