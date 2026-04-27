# Changelog

All notable changes to DialectOS are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-04-27

### Added

#### Grammar & Semantic Analysis
- Grammar detection pipeline: voseo, leísmo/laísmo/loísmo, yeísmo detection with exact bigram matching
- Semantic backstop with negation preservation, keyword overlap, and structural parity checking
- Negation detection: 15 English contractions (`dont`, `cant`, `cannot`, `wont`, etc.) + apostrophe stripping
- Spanish negation coverage expanded with `ningún`, `nunca`, `jamás`, `nadie`, and 18 other markers
- Abbreviation-protected sentence splitting (e.g. "Dr.", "Sr.") to prevent false grammar boundaries
- NFC Unicode normalization for consistent text processing

#### Translation Memory
- Persistent translation cache with TTL, LRU eviction, and serialized atomic writes
- `get()` returns shallow clones to prevent caller mutation
- `clear()` is generation-safe against concurrent persist operations
- `load()` validates all entries before hydration
- `maxSize <= 0` guard and null-safe `computeKey()`

#### Adversarial Hardening
- Expanded adversarial certification suite: 125 samples across all 25 dialects
- Torture tests: +27 memory, +42 backstop, +41 grammar detection tests
- Public demo adversarial hardening: source exposure prevention, malformed path handling, dirty JSON rejection, non-string field validation
- Security headers (`x-content-type-options: nosniff`, `referrer-policy`) on static and JSON responses

#### Provider Quality
- LLM promoted to primary translation provider with dialect-specific semantic prompts
- Anthropic-compatible API support for cloud LLM providers
- LM Studio local model certification and JIT provider support
- Provider-agnostic output judge for quality gating
- Web demo output judge to prevent static fallback presentation
- Semantic ambiguity matrix and regional polysemy gates
- Dialect quality contracts embedded in LLM prompts

#### Certification & Reporting
- Long-document certification harness (README, API docs, locale JSON flows)
- Incremental dialect certification runner (`dialect:certify`)
- Expanded adversarial dialect certification (`dialect:certify-adversarial`)
- Customer certification report generator with MQM-aligned metrics
- Spanish launch audit offer documentation

#### Launch & Documentation
- Complete launch kit: 24 files (~15K words) across Product Hunt, HN, Dev.to, Medium, Reddit, Twitter, Stack Overflow, and more
- SEO/AI SEO hardening: OG tags, schema.org JSON-LD, FAQ section, comparison table, `.llm` crawler file
- Landing page redesign with SVG logo, real-time dialect detection demo, and register classification
- Interactive browser demo exercising the full translation backend (not static fallbacks)
- CITATION.cff updated with BSL-1.1 license and 25 dialect variants

### Changed

#### Dependencies
- `vitest` 3.2.4 → 4.1.5 (major bump; constructor mocks converted to `function()` syntax for compatibility)
- `isomorphic-dompurify` 3.9.0 → 3.10.0 (dompurify 3.4.0 → 3.4.1)

### Fixed
- Translation memory race condition during concurrent persist/clear operations
- Cross-dialect false positive reduction via co-occurrence weighting in grammar detection
- Provider registry balancing and dialect validation edge cases
- Semantic scorer edge cases from post-merge review
- MCP test compatibility with vitest 4 constructor-mock requirements

## [0.1.0] - 2026-04-20

### Added

#### Security & Resilience
- Adversarial fixture corpus for CI regression testing (4 fixtures, 6 tests)
- Adversarial CI lane with pass/fail thresholds
- Provider capability negotiation with language normalization
- Provider chaos harness with 7 deterministic failure modes
- Versioned checkpoint schema (v1) with migration and retention
- Operator policy profiles: strict, balanced, permissive
- Semantic drift quality gate with heuristic similarity scoring
- Reliability telemetry collector with health reports

#### Infrastructure
- SSRF protection on all provider endpoints
- Circuit breaker with half-open probe locks
- Atomic checkpoint writes using temp-file + rename pattern
- HTML injection detection in translated output
- Prototype pollution protection in checkpoint loading
- Rate limiting with configurable windows per provider

#### Quality
- Word overlap, length ratio, and entity preservation semantic scoring
- Structure validation for markdown (tables, code blocks, links)
- Glossary enforcement with strict mode
- Protected token preservation for brand names and identifiers
- Quality score now includes semantic similarity component

#### Providers
- DeepL provider with formality mapping and context support
- LibreTranslate provider with endpoint SSRF validation
- MyMemory provider with grapheme-aware chunking
- Provider registry with capability-based validation

#### Dialect Expansion (20 → 25)
- Added 5 new dialects: `es-GQ` (Equatorial Guinea), `es-US` (U.S. Spanish), `es-PH` (Philippine/Chavacano), `es-BZ` (Belize), `es-AD` (Andorra)
- Expanded keyword sets from ~13 to 20–30 verified lexical items per dialect
- Full `DIALECT_ADAPTATIONS` coverage for all 25 dialects in `manage-variants`
- Verified keywords via web research to avoid false positives (e.g. replaced Tagalog words with Chavacano markers for `es-PH`)

#### Register Differentiation (Formal vs Slang)
- `DialectMetadata` now includes `formalMarkers`, `slangMarkers`, and `grammarFeatures`
- `detectRegister(text)` classifies input as `"formal" | "neutral" | "slang"` via marker scoring
- `getRegisterMarkers(dialect)` returns per-dialect formal/slang marker sets
- CLI `--register <formal|neutral|slang>` flag on `translate` and `translate-api-docs`
- MCP `register` parameter on `translate_missing_keys` and `batch_translate_locales`
- `dialects detect` command outputs register classification alongside dialect code

#### CLI
- `translate-readme` with checkpoint resumption
- `translate-api-docs` with partial failure policies
- `i18n detect-missing` for locale file comparison
- `i18n batch-translate` for multi-dialect workflows
- `i18n manage-variants` with 200+ vocabulary adaptation rules across 25 dialects
- `dialects list` with metadata for all 25 variants
- `dialects detect` with register classification

#### MCP
- 16 MCP tools for markdown, i18n, and translation operations
- `register` parameter on translation tools for formal/slang/neutral output
- Structured JSON error handling
- Graceful shutdown on SIGINT/SIGTERM

[0.1.0]: https://github.com/Pastorsimon1798/DialectOS/releases/tag/v0.1.0
