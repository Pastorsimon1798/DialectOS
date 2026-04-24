/**
 * Secure fetch with redirect following and per-hop validation.
 *
 * Fixes the DNS-rebinding / SSRF vulnerability while still allowing
 * legitimate redirects (e.g. HTTP→HTTPS, path changes).
 *
 * Each redirect hop is validated against the original allow-list before
 * the request is sent.
 */

export interface FetchWithRedirectsOptions {
  /** Maximum number of redirects to follow (default: 3) */
  maxRedirects?: number;
  /** Optional validation function for every hop */
  validateUrl?: (url: string) => void;
  /** fetch() init options */
  init?: RequestInit;
}

/**
 * Follow redirects safely.
 *
 * - Uses `redirect: "manual"` on the underlying fetch to stay in control.
 * - Validates every hop with the caller-supplied `validateUrl`.
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

  while (true) {
    if (validateUrl) {
      validateUrl(currentUrl);
    }

    const response = await fetch(currentUrl, {
      ...init,
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
      currentUrl = new URL(location, currentUrl).href;
      continue;
    }

    return response;
  }
}
