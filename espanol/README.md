# Espanol — Spanish Translation Toolkit

A secure, modular monorepo for Spanish translation with CLI tools and MCP server adapter.

## Architecture

```
espanol/
├── packages/
│   ├── types/           # Shared types (dialects, entries, results, Zod schemas)
│   ├── security/        # Path validation, sanitization, rate limiting
│   ├── providers/       # Translation providers (DeepL, LibreTranslate, MyMemory)
│   ├── markdown-parser/ # Safe markdown parsing (marked-based, ReDoS-safe)
│   ├── locale-utils/    # i18n file operations (flatten, diff, atomic write)
│   ├── cli/             # CLI tool (16 commands via commander.js)
│   └── mcp/             # MCP adapter (16 tools for AI assistants)
└── pnpm-workspace.yaml
```

## Packages

| Package | Tests | Description |
|---------|-------|-------------|
| `@espanol/types` | 41 | Shared type definitions and Zod schemas |
| `@espanol/security` | 65 | Path validation, sanitization, rate limiting |
| `@espanol/providers` | 35 | Translation providers with circuit breaker |
| `@espanol/markdown-parser` | 73 | Safe markdown parsing, URL validation |
| `@espanol/locale-utils` | 55 | i18n file operations, atomic writes |
| `@espanol/cli` | 158 | CLI tool with 16 commands |
| `@espanol/mcp` | 48+ | MCP adapter with 16 tools |

**Total: 475+ tests**

## Quick Start

### CLI

```bash
# Install
pnpm install -g @espanol/cli

# Translate text
espanol translate "Hello world" --dialect es-MX

# Translate README
espanol translate-readme ./README.md --dialect es-ES

# i18n operations
espanol i18n detect-missing ./locales/en.json ./locales/es.json
espanol i18n batch-translate ./locales --base en --targets es-MX,es-AR

# List dialects
espanol dialects list

# Search glossary
espanol glossary search "computer"
```

### MCP Server

Add to your AI assistant's MCP configuration (see [packages/mcp/README.md](packages/mcp/README.md) for details).

## Security

All packages share the `@espanol/security` module providing:

- **Path traversal protection**: Symlink resolution, null byte rejection, control character validation
- **Content limits**: 512KB files, 50KB content, 10K locale keys
- **Rate limiting**: Configurable sliding window (default: 60 req/min)
- **Input sanitization**: HTML sanitization (DOMPurify), URL protocol validation
- **Error sanitization**: No API keys, stack traces, or internal paths in responses
- **Atomic writes**: Secure temp files with crypto-random suffixes, TOCTOU protection

## Translation Providers

| Provider | Auth | Cost | Quality |
|----------|------|------|---------|
| DeepL | `DEEPL_AUTH_KEY` | Paid | Excellent |
| LibreTranslate | `LIBRETRANSLATE_URL` | Self-hosted | Good |
| MyMemory | None | Free (500B) | Basic |

All providers use circuit breaker pattern with automatic failover. Authentication is always via headers (never URL params).

## Development

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm -r test

# Build all packages
pnpm -r build

# Run a single package's tests
pnpm --filter @espanol/mcp test
```

## License

MIT
