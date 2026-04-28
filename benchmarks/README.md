# DialectOS Dialect Quality Benchmark

## Methodology

The benchmark evaluates translation quality across 25 Spanish dialects using adversarial test fixtures. Each fixture contains:

- **Source text** in English (or mixed Spanish)
- **Dialect-specific constraints**: forbidden terms, required output groups, preferred vocabulary
- **Severity level**: critical, high, medium
- **Category**: over-localization, under-localization, taboo-copy, false-friend, register-trap, structure-preservation

## Running

```bash
# Dry-run with mock provider (no API keys needed)
node scripts/benchmark.mjs

# With CLI
pnpm build && dialectos benchmark run

# Filter by dialect/category
node scripts/benchmark.mjs --dialects=es-MX,es-AR --categories=taboo-copy

# Live evaluation with a real provider
node scripts/benchmark.mjs --live --provider=deepl

# View a report
dialectos benchmark report benchmarks/results-YYYY-MM-DD/results.json
```

## Score Interpretation

| Metric | Description |
|--------|-------------|
| Pass rate | % of fixtures with zero failures (forbidden terms, missing required groups, judge blocks) |
| Avg quality score | Mean `validateTranslation()` quality score (0-100) across all samples |
| By category | Breakdown by over-localization, taboo-copy, false-friend, etc. |
| By dialect | Per-dialect pass rate across all categories |

## Contributing

Add new test cases to `packages/cli/src/__tests__/fixtures/dialect-adversarial/es-{CODE}.json` following the existing schema. Each sample needs:

- `id`: unique identifier (e.g., `mx-food-hotpink`)
- `category`: one of over-localization, under-localization, taboo-copy, false-friend, register-trap, structure-preservation
- `severity`: critical, high, medium
- `source`: English text to translate
- `forbiddenOutputTerms`: terms that must NOT appear in the output
- `requiredOutputGroups`: groups of terms where at least one must appear
- `notes`: explanation of what this fixture tests

Results are published quarterly in this directory.
