# Data Quality Glossary Corpus Implementation Plan

**Goal:** Replace thin duplicated glossary surfaces with a richer source-attributed glossary corpus and regression tests that keep MCP/CLI data aligned.

**Architecture:** Keep dependencies unchanged. Expand the existing CLI glossary data as the canonical runtime source, add optional source metadata to glossary entries, and import that data from the MCP tool surface instead of maintaining a second smaller glossary. Add tests for coverage counts, source attribution, MCP/CLI parity, and known domain term coverage.

**Tech Stack:** TypeScript, pnpm workspaces, Vitest, existing @espanol packages.

---

## Tasks

1. Add tests proving glossary corpus size/source coverage and MCP parity.
2. Extend `GlossaryEntry` with optional source metadata.
3. Expand `GLOSSARY_DATA` to 250+ entries across programming, technical, business, general, localization, security, AI, and web categories.
4. Remove MCP duplicate glossary list and use CLI glossary helpers.
5. Update docs to describe source-attributed built-in glossary honestly.
6. Run `pnpm build`, `pnpm -r exec tsc --noEmit`, `pnpm test`, `pnpm audit --audit-level low`, and package dry-run checks.
