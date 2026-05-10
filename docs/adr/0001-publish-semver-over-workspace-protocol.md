# ADR 0001: Publishable Packages Use Concrete Semver, Not `workspace:*`

## Status

Accepted — implementation pending.

## Context

DialectOS is a pnpm workspace monorepo. Internal packages currently declare cross-dependencies with `workspace:*`:

```json
"@dialectos/types": "workspace:*"
```

This is idiomatic for pnpm development: it guarantees the local version is always used and prevents version drift during active development.

However, `workspace:*` is **not resolvable by npm**. When consumers run `npm install @dialectos/cli` from a published tarball, npm encounters `workspace:*` in the transitive dependency tree and fails.

The project intends to publish packages to the npm registry. The `npm pack --dry-run` check in CI verifies tarball contents but does not attempt installation, so the `workspace:*` leakage was not caught.

## Decision

Replace all `workspace:*` dependency specifiers with concrete semver ranges (initially `^0.3.0` or exact `0.3.0`) in every `packages/*/package.json`.

Keep pnpm workspace linking via the existing `pnpm-workspace.yaml` and lockfile; pnpm will still prefer the local copy during development.

## Consequences

### Positive
- Published tarballs are installable by npm, yarn, and pnpm consumers.
- `scripts/package-smoke.mjs` can prove end-to-end installability from a clean temp project.
- Version bumps become an explicit, reviewable step in the release workflow.

### Negative
- Releasing a coordinated change across multiple packages requires bumping versions in multiple `package.json` files simultaneously.
- Risk of local development accidentally resolving a registry copy instead of the local workspace copy if versions are not kept in sync. Mitigation: enforce `pnpm install --frozen-lockfile` in CI and run `pnpm build` before any publish step.

## Alternatives Considered

1. **Keep `workspace:*` and rely on pnpm publish rewrite.**
   - pnpm can rewrite `workspace:*` to the actual version during `pnpm publish`.
   - Rejected because the project uses `npm pack` and manual tarball verification; we want the tarball itself to be correct without requiring pnpm-specific publish tooling.

2. **Use `workspace:^0.3.0`.**
   - Still workspace-protocol; npm cannot resolve it.
   - Rejected for the same consumer-compatibility reason.
