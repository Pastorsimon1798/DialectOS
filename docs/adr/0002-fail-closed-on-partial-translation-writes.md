# ADR 0002: Fail Closed on Partial Translation Writes

## Status

Accepted — implementation pending.

## Context

Several DialectOS tools write locale or markdown files as a side effect of translation:
- `translate_missing_keys` (MCP)
- `batch_translate_locales` (MCP)
- `translate-website` (CLI)

Current behavior: if a provider fails on one key or one page, the tool writes whatever succeeded to disk and returns a result that may not be marked as an error. This leaves the target file in a **mixed source/translated state** — some keys are translated, others are missing or stale.

For agents using MCP tools, a partial write is dangerous: the locale file appears complete (it exists and has content) but is actually corrupt. The agent may proceed to commit or deploy it.

## Decision

Change the default behavior to **fail closed**:
1. Collect all translations in memory (or a temp directory).
2. Only write to the final target path if **all items succeed**, or if the caller explicitly passes `allowPartial: true`.
3. When `allowPartial: true` is used, the response must clearly indicate partial success and the locations of any dead-letter queue files.

This applies to:
- MCP i18n tools (`packages/mcp/src/tools/i18n.ts`)
- CLI `translate-website` (`packages/cli/src/commands/translate-website.ts`)
- Any future bulk write command

## Consequences

### Positive
- Agents and CI pipelines cannot accidentally ship mixed translations.
- Partial failures are explicit: the caller sees `isError: true` or a non-zero exit code.

### Negative
- A single failing key blocks the entire batch. Users must fix the failure or opt into partial mode.
- Slightly higher memory usage because results are staged in memory before writing.

## Alternatives Considered

1. **Write partial + DLQ as sufficient safety.**
   - Rejected because the written file is still corrupt. DLQ is only useful if someone inspects it.

2. **Auto-rollback on failure.**
   - More complex; requires snapshotting original files. Staging in memory is simpler and avoids touching the target until success is guaranteed.
