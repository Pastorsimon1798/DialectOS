# DialectOS UX & Operator Journey Audit
**Date:** 2026-05-11  
**Auditor:** Kimi Code CLI  
**Scope:** Every user-facing surface — CLI, MCP, web demo, docs, README, Docker, CI, error handling

---

## Executive Summary

DialectOS is technically sound (100% detection accuracy, all CI green) but has significant UX friction across every user touchpoint. The core issues are:

1. **Misleading claims** in README (test counts, "30-second setup")
2. **Confusing demo** — input language mismatch, dead backend URL, silent fallbacks
3. **No CLI progress feedback** — long operations feel frozen
4. **Error messages are raw stack traces** — not actionable
5. **MCP tool descriptions lack examples** — LLMs struggle to use them correctly
6. **Missing onboarding guardrails** — no validation of env vars, no setup wizard

**Severity breakdown:**
- 🔴 **Critical** (blocks users): 4 issues
- 🟡 **High** (major friction): 11 issues
- 🟢 **Medium** (polish): 8 issues

---

## 1. README & Onboarding

### 🔴 Critical: "1034 tests" claim is false
**Location:** README.md line 361, docs/index.html line 361  
**Issue:** Claims "1034 tests" but actual count is 662 (93 MCP + 569 CLI + static checks).  
**Impact:** Users distrust other claims when basic facts are wrong.  
**Fix:** Update to actual count or use dynamic badge.

### 🔴 Critical: "30-second MCP setup" is misleading
**Location:** README.md line 108  
**Issue:** Requires cloning repo, `pnpm install`, `pnpm build` — ~2-5 minutes on first run.  
**Impact:** Frustrated users abandon setup.  
**Fix:** Rename to "Local MCP setup" and add timing estimate.

### 🟡 High: Duplicate comparison table
**Location:** README.md lines 56-70 and 382-394  
**Issue:** Identical feature comparison table appears twice.  
**Impact:** Looks like copy-paste slop, reduces credibility.  
**Fix:** Remove second instance.

### 🟡 High: MCP config comment is negative
**Location:** README.md line 118  
**Issue:** `"comment": "Package publishing is not enabled yet..."` — tells user the project is unfinished.  
**Fix:** Remove comment or reframe positively.

### 🟡 High: No `.env.example` reference in setup
**Location:** README.md Quick Start section  
**Issue:** `.env.example` exists but README never mentions it. Users must guess env vars.  
**Fix:** Add "Copy `.env.example` to `.env` and configure" step.

### 🟢 Medium: Model recommendation is overly specific
**Location:** README.md lines 133-140  
**Issue:** Recommends `glm-4.5-air` via Z.ai — niche provider most users won't have.  
**Fix:** Lead with OpenAI/Anthropic as primary, mention Z.ai as certified alternative.

---

## 2. CLI Experience

### 🔴 Critical: No progress indicators for long operations
**Location:** `translate-api-docs`, `batch-translate`, `translate-website`  
**Issue:** Commands can take minutes with LLM providers but show zero progress. Users think process is frozen.  
**Impact:** Users Ctrl+C and retry, causing duplicate API calls and costs.  
**Fix:** Add progress bars (e.g., `cli-progress`) or section-by-section output.

### 🟡 High: Error messages are raw Error.message strings
**Location:** packages/cli/src/index.ts — every command catch block  
**Issue:** `writeError(message)` just prints the raw error string. No context, no suggested fix, no docs link.  
**Example:** `Error: No provider configured` — doesn't tell user to set LLM_API_URL.  
**Fix:** Map error codes to actionable messages with env var hints.

### 🟡 High: `writeInfo` writes to stderr
**Location:** packages/cli/src/lib/output.ts line 91  
**Issue:** `writeInfo` uses `process.stderr.write`. Piping output (`dialectos translate ... > out.md`) includes info messages in the file.  
**Fix:** Use stdout for info, stderr only for errors.

### 🟡 High: No validation of env vars at startup
**Location:** packages/cli/src/index.ts  
**Issue:** Commands fail mid-execution with cryptic errors instead of validating env vars upfront.  
**Fix:** Add `--check-config` flag or validate on first provider call with helpful message.

### 🟡 High: Default dialect is es-ES but product is LatAm-focused
**Location:** packages/cli/src/index.ts line 49  
**Issue:** `--dialect` defaults to `es-ES` (Spain) but most users will want `es-MX` or `es-AR`.  
**Fix:** Change default to `es-MX` or require explicit dialect.

### 🟡 High: `dialects detect` register option unexplained
**Location:** packages/cli/src/index.ts line 382  
**Issue:** `--register formal|slang|any` has no help text explaining what "register" means.  
**Fix:** Add examples and description.

### 🟢 Medium: No copy-to-clipboard hint
**Location:** CLI output  
**Issue:** Translation output is printed raw — users must manually select and copy.  
**Fix:** Add `--copy` flag or hint about piping.

### 🟢 Medium: `translate` command accepts stdin but doesn't document it
**Location:** packages/cli/src/index.ts line 48  
**Issue:** "can also be provided via stdin" but no example shows `echo "..." | dialectos translate`.  
**Fix:** Add stdin example to help text.

---

## 3. MCP Server Experience

### 🔴 Critical: `list_dialects` says 20 dialects, not 25
**Location:** packages/mcp/src/tools/translator.ts line 155  
**Issue:** Tool description: "List all 20 Spanish dialects with metadata" — there are 25.  
**Impact:** LLM tells user only 20 dialects exist. Confusion and lost trust.  
**Fix:** Update to "25 Spanish dialects".

### 🟡 High: Tool descriptions lack examples
**Location:** All MCP tools in packages/mcp/src/tools/translator.ts  
**Issue:** LLMs struggle with abstract descriptions. No example inputs/outputs.  
**Example:** `translate_text` — no example of what `text` should contain.  
**Fix:** Add rich examples to descriptions using the MCP SDK's `examples` field if supported, or embed in description.

### 🟡 High: `research_regional_term` uses comma-separated string
**Location:** packages/mcp/src/tools/translator.ts line 144  
**Issue:** `dialects: z.string()` expects `"es-PR,es-MX"` but LLMs may pass arrays or malformed strings.  
**Fix:** Accept array of strings or validate format better.

### 🟡 High: No rate limit feedback in tool responses
**Location:** packages/mcp/src/tools/translator-handlers.ts (implied)  
**Issue:** Rate limiter exists but user doesn't know they're being throttled.  
**Fix:** Include `rateLimitRemaining` in response metadata.

### 🟢 Medium: `detect_dialect` description undersells capability
**Location:** packages/mcp/src/tools/translator.ts line 87  
**Issue:** "using keyword matching" — sounds primitive. Doesn't mention grammar detection or 25 dialects.  
**Fix:** "Detect Spanish dialect from text using keyword matching, grammar analysis, and IDF-weighted scoring across 25 regional variants."

---

## 4. Web Demo Experience

### 🔴 Critical: Demo expects Spanish input, placeholder says English
**Location:** docs/index.html line 419  
**Issue:** Placeholder: `"Try: Orange juice is ready."` but the demo is a Spanish→Spanish dialect adapter. Inputting English breaks detection.  
**Impact:** First-time user experience is broken immediately.  
**Fix:** Change placeholder to Spanish: `"Try: El zumo de naranja está listo."`

### 🔴 Critical: Remote API URL is dead
**Location:** docs/index.html line 517  
**Issue:** `REMOTE_API = 'https://dialectos.kyanitelabs.tech'` — this domain doesn't resolve.  
**Impact:** Demo always falls back to client mode, never shows LLM-powered translation.  
**Fix:** Remove remote API or configure it correctly.

### 🟡 High: Client mode fallback is silent
**Location:** docs/index.html lines 621-626  
**Issue:** Backend error shows briefly then auto-falls back to client mode. User doesn't understand why quality changed.  
**Fix:** Show persistent warning banner: "Backend unavailable — using vocabulary engine only."

### 🟡 High: No copy-to-clipboard for output
**Location:** docs/index.html output box  
**Issue:** Users must manually select translated text.  
**Fix:** Add copy button.

### 🟡 High: Receipt pills are unreadable
**Location:** docs/index.html receipt display  
**Issue:** Monospace pills with `key: value` format are cramped and hard to scan.  
**Fix:** Use table or card layout for receipts.

### 🟢 Medium: No loading skeleton
**Location:** docs/index.html output area  
**Issue:** During translation, output shows static "Processing…" placeholder.  
**Fix:** Add animated skeleton or typing indicator.

### 🟢 Medium: Mobile nav completely hidden
**Location:** docs/index.html line 327  
**Issue:** Below 640px, `.navlinks { display: none; }` with no hamburger menu. Mobile users can't navigate.  
**Fix:** Add hamburger menu or keep navlinks visible.

### 🟢 Medium: Metrics claim "0 hidden fallbacks" but client mode is a fallback
**Location:** docs/index.html line 390  
**Issue:** The fourth metric says "0 hidden fallbacks" but the demo literally has a hidden fallback to client mode.  
**Fix:** Rephrase to "fallbacks are receipt-visible" or remove metric.

---

## 5. Documentation Site

### 🟡 High: `full-app-demo.md` link is relative
**Location:** docs/index.html line 354  
**Issue:** Links to `full-app-demo.md` (relative) but on GitHub Pages this downloads the file instead of rendering it.  
**Fix:** Link to rendered version or inline content.

### 🟢 Medium: No search on docs site
**Location:** docs/index.html  
**Issue:** Single-page docs with no search — hard to find specific features.  
**Fix:** Add anchor links table of contents or simple in-page search.

---

## 6. Error Handling

### 🟡 High: Demo server leaks raw errors
**Location:** scripts/demo-server.mjs line 306  
**Issue:** `sendJson(res, 500, { ok: false, error: safeError(error) })` — `safeError` just calls `.message` which may contain stack traces or internal paths.  
**Fix:** Sanitize error messages in production mode.

### 🟡 High: MAX_JSON_BYTES too small
**Location:** scripts/demo-server.mjs line 13  
**Issue:** 128KB limit prevents translating medium-length documents via API.  
**Fix:** Increase to 1MB or make configurable.

### 🟢 Medium: No structured error codes
**Location:** All error responses  
**Issue:** Errors are strings, not codes. Clients can't handle them programmatically.  
**Fix:** Add `errorCode` field to all error responses.

---

## 7. Operator/DevOps Journey

### 🟡 High: Docker Compose has hardcoded Traefik labels
**Location:** docker-compose.yml lines 16-21  
**Issue:** Traefik labels hardcode `dialectos.kyanitelabs.tech` and Let's Encrypt. Won't work for other operators.  
**Fix:** Move to `.env` or separate override file.

### 🟡 High: Demo server whitelist blocks new docs files
**Location:** scripts/demo-server.mjs lines 42-50  
**Issue:** `PUBLIC_STATIC_FILES` is a hardcoded Map. Adding new docs files requires code changes.  
**Fix:** Serve entire `docs/` directory with path traversal protection.

### 🟢 Medium: `ensureAllBuilt()` slows startup
**Location:** scripts/demo-server.mjs line 9  
**Issue:** Runs `pnpm build` check on every server start. Adds seconds to cold start.  
**Fix:** Skip in production Docker image where build is guaranteed.

### 🟢 Medium: No request logging
**Location:** scripts/demo-server.mjs  
**Issue:** No access logs for operators to debug issues.  
**Fix:** Add structured request logging.

---

## 8. Translation Output Quality

### 🟡 High: Quality score is often "not reported"
**Location:** docs/index.html line 608  
**Issue:** Demo shows `quality: not reported` for most translations. Users can't judge output quality.  
**Fix:** Always compute and display quality score, even in client mode.

### 🟢 Medium: No explanation of receipt fields
**Location:** docs/index.html receipt panel  
**Issue:** "fallbacks: 0", "backstop: ok" — jargon without explanation.  
**Fix:** Add tooltips or legend.

---

## Recommended Priority Order

### Immediate (this session)
1. Fix README test count claim
2. Fix `list_dialects` "20 dialects" → "25"
3. Fix demo placeholder to Spanish
4. Remove dead remote API from demo
5. Add progress indicators to CLI
6. Fix `writeInfo` to use stdout

### Next sprint
7. Improve CLI error messages with actionable hints
8. Add MCP tool examples
9. Fix mobile nav
10. Add copy-to-clipboard to demo
11. Increase MAX_JSON_BYTES
12. Sanitize demo server errors

### Polish
13. Restructure receipt display
14. Add request logging
15. Docker Compose flexibility
16. In-page docs search
