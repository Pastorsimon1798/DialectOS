# ADR 0003: Use `node --test` for Script-Level Public Contract Verification

## Status

Accepted — implementation pending.

## Context

DialectOS has two testing layers:
1. **Unit tests** (`vitest`) inside each package for logic, algorithms, and provider behavior.
2. **Script contract tests** that verify public-facing claims: README copy, SECURITY accuracy, package metadata, workflow structure, and discovery file existence.

The script contract tests live in `docs/__tests__/` and `scripts/__tests__/` and are run with `node --test`.

Using vitest for everything would unify the runner, but script contract tests have different needs:
- They must run **without building** the TypeScript packages (they operate on raw markdown, YAML, and JSON).
- They must use **only Node built-ins** so they can catch issues before `pnpm install` or build steps complete.
- They are integration/contract tests, not unit tests, and benefit from Node's native test runner simplicity.

## Decision

Keep script-level public contract tests in `node --test` (`.mjs` files).
Keep package-level unit tests in `vitest` (`.test.ts` files).

The top-level `pnpm test` script will run both suites in sequence.

## Consequences

### Positive
- Contract tests can run immediately on checkout without build or dependency install.
- They are immune to breakage in vitest, TypeScript, or third-party dependencies.
- They serve as a first line of defense against false public claims.

### Negative
- Two test runners means two configuration surfaces and two reporting formats.
- Developers must remember which layer to extend when adding a new contract check.

## Alternatives Considered

1. **Use vitest for everything, including script contracts.**
   - Rejected because vitest requires `pnpm install` and build tooling; contract tests should catch false claims even if the build is broken.

2. **Use a single shell script instead of `node --test`.**
   - Rejected because `node --test` provides structured assertions, TAP output, and built-in parallelism without adding dependencies.
