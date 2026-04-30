# Linguist Contributor Guide

## Editing the Dialectal Dictionary

The master dictionary lives in:

```
packages/types/src/dialectal-dictionary.json
```

This is a **JSON file** — you can edit it directly on GitHub's web interface or in any text editor. **Do not edit** `packages/types/src/dialectal-dictionary.ts` (that's just the TypeScript types and loader).

## Entry Format

Each entry is an object with this shape:

```json
{
  "field": "food",
  "concept": "avocado",
  "englishGloss": "avocado fruit",
  "panHispanic": "aguacate",
  "variants": {
    "es-CL": { "term": "palta", "frequency": 1, "register": "universal" },
    "es-MX": { "term": "aguacate", "frequency": 1, "register": "universal" }
  }
}
```

### Fields

| Field | Required? | Description |
|-------|-----------|-------------|
| `field` | Yes | Semantic category: `technology`, `transport`, `food`, `household`, `clothing`, `actions`, `social`, `people`, `education`, `body_parts`, `nature`, `medicine_health`, `family_kinship`, `finance_banking`, `accessibility`, `core_vocabulary` |
| `concept` | Yes | Stable English identifier (snake_case) |
| `englishGloss` | Yes | Human-readable English description |
| `panHispanic` | No | Term used across most dialects. If present, individual dialects only need `variants` when they differ. |
| `variants` | No | Per-dialect overrides. Keys are dialect codes like `es-MX`, `es-AR`, etc. |

### Variant object

```json
{
  "term": "palta",
  "frequency": 1,
  "register": "universal",
  "notes": "Chile and parts of Peru"
}
```

- `term` — the actual word in that dialect
- `frequency` — `1` (primary), `2` (common alternative), `3` (rare/known but uncommon)
- `register` — `formal`, `informal`, or `universal`
- `notes` — optional context (region, usage notes, etymology)

## Dialect Codes

All 25 Spanish dialects are supported:

`es-ES` (Spain), `es-AD` (Andorra), `es-MX` (Mexico), `es-AR` (Argentina), `es-CO` (Colombia), `es-CL` (Chile), `es-PE` (Peru), `es-VE` (Venezuela), `es-EC` (Ecuador), `es-BO` (Bolivia), `es-PY` (Paraguay), `es-UY` (Uruguay), `es-CU` (Cuba), `es-DO` (Dominican Republic), `es-PR` (Puerto Rico), `es-CR` (Costa Rica), `es-NI` (Nicaragua), `es-HN` (Honduras), `es-SV` (El Salvador), `es-GT` (Guatemala), `es-PA` (Panama), `es-BZ` (Belize), `es-GQ` (Equatorial Guinea), `es-PH` (Philippines), `es-US` (US Latino)

## Fallback Chain

When the system looks up a term for a dialect:

1. `variants[dialect]` → if exists, use it
2. `panHispanic` → if exists, use it
3. `variants["es-ES"]` → fallback to Peninsular Spanish
4. `undefined` — no term found

This means you don't need to add every dialect to `variants`. Only add entries where the dialect genuinely uses a different term.

## Adding a New Concept

1. Pick the right `field`
2. Use `snake_case` for `concept`
3. Add `panHispanic` if the term is the same across most dialects
4. Add `variants` only for dialects that differ
5. Keep `frequency: 1` for the primary term, `2` or `3` for alternatives
6. Run `pnpm test` in `packages/types` to verify

## Validation

The test suite enforces:
- Every entry has `field`, `concept`, `englishGloss`
- Every entry has at least one term (via `panHispanic` or `variants`)
- All dialect codes in `variants` are valid
- All `frequency` values are 1, 2, or 3
- All `register` values are `formal`, `informal`, or `universal`

## Before Submitting

1. Pretty-print the JSON (2-space indentation) — the file is kept formatted for readability
2. Run `cd packages/types && pnpm test` to validate
3. Run `pnpm build` at the root to ensure TypeScript compiles
