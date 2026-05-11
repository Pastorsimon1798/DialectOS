# @dialectos/security

Security utilities for input validation, sanitization, and rate limiting.

## Features

- **Path Validation** — Prevent path traversal attacks
- **Content Length Validation** — Enforce maximum payload sizes
- **Rate Limiting** — Token bucket rate limiter with configurable windows
- **HTML Sanitization** — DOMPurify-based HTML stripping and sanitization
- **Error Sanitization** — Redact API keys, tokens, and file paths from error messages
- **URL Protocol Validation** — Reject dangerous URL protocols (`javascript:`, `data:`, etc.)

## What lives elsewhere

- **SSRF protection** (private-IP blocking, localhost guards, per-redirect validation) is implemented in `@dialectos/providers` (`fetch-utils.ts`, `libre-translate.ts`, `llm.ts`, `deepl.ts`).
- **ANSI escape stripping** for terminal output lives in `@dialectos/cli` (`output.ts`).

## Usage

```typescript
import { validateFilePath, RateLimiter, SecurityError, ErrorCode } from "@dialectos/security";

// Validate file path
try {
  const safePath = validateFilePath("../../../etc/passwd");
} catch (e) {
  // Throws: Path traversal detected
}

// Rate limiting
const limiter = new RateLimiter(60, 60000); // 60 requests per minute
await limiter.acquire(); // Throws if rate exceeded

// Structured errors
throw new SecurityError("Invalid input", ErrorCode.INVALID_INPUT);
```
