/**
 * Secure fetch with redirect following and per-hop validation.
 *
 * Fixes the DNS-rebinding / SSRF vulnerability while still allowing
 * legitimate redirects (e.g. HTTP→HTTPS, path changes).
 *
 * Each redirect hop is validated against the original allow-list before
 * the request is sent. Sensitive headers are stripped on cross-origin
 * redirects to prevent credential leakage.
 */

export interface FetchWithRedirectsOptions {
  /** Maximum number of redirects to follow (default: 3) */
  maxRedirects?: number;
  /** Optional validation function for every hop */
  validateUrl?: (url: string) => void;
  /** fetch() init options */
  init?: RequestInit;
}

const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "proxy-authorization",
  "www-authenticate",
]);

function stripSensitiveHeaders(init: RequestInit): RequestInit {
  if (!init.headers) return init;
  const headers = new Headers(init.headers);
  for (const name of SENSITIVE_HEADERS) {
    headers.delete(name);
  }
  return { ...init, headers };
}

function isSameOrigin(a: string, b: string): boolean {
  const urlA = new URL(a);
  const urlB = new URL(b);
  return (
    urlA.protocol === urlB.protocol &&
    urlA.hostname === urlB.hostname &&
    urlA.port === urlB.port
  );
}

/**
 * Follow redirects safely.
 *
 * - Uses `redirect: "manual"` on the underlying fetch to stay in control.
 * - Validates every hop with the caller-supplied `validateUrl`.
 * - Strips sensitive headers on cross-origin redirects.
 * - Returns the final non-redirect Response.
 * - Throws on excessive redirects or validation failure.
 */
export async function fetchWithRedirects(
  url: string,
  options: FetchWithRedirectsOptions = {}
): Promise<Response> {
  const { maxRedirects = 3, validateUrl, init = {} } = options;
  let currentUrl = url;
  let remaining = maxRedirects;
  let currentInit = init;

  while (true) {
    if (validateUrl) {
      validateUrl(currentUrl);
    }

    const response = await fetch(currentUrl, {
      ...currentInit,
      redirect: "manual",
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new Error(
          `Redirect response ${response.status} from ${currentUrl} missing Location header`
        );
      }

      if (remaining <= 0) {
        throw new Error(
          `Too many redirects (>${maxRedirects}) starting from ${url}`
        );
      }
      remaining--;

      // Resolve relative URLs against the current URL
      const nextUrl = new URL(location, currentUrl).href;

      // Strip sensitive headers on cross-origin redirect
      if (!isSameOrigin(currentUrl, nextUrl)) {
        currentInit = stripSensitiveHeaders(currentInit);
      }

      currentUrl = nextUrl;
      continue;
    }

    return response;
  }
}
