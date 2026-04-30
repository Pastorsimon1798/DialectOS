/**
 * Automatic sentinel extraction for the translation pipeline.
 *
 * Extracts verbatim content (URLs, code blocks, emails, file paths, technical
 * identifiers) from source text and replaces them with short sentinel tokens
 * before LLM inference, then restores them after.
 *
 * Design principle: only extract items that must be preserved CHARACTER-FOR-CHARACTER.
 * Product names, proper nouns, and anything the LLM might productively adapt are
 * left in place — the LLM keeps latitude to make smart choices.
 */

export interface ExtractionResult {
  text: string;
  sentinels: Map<string, string>;
}

const FENCED_CODE_RE = /```[\s\S]*?```/g;
const INLINE_CODE_RE = /`[^`\n]+`/g;
const URL_RE = /https?:\/\/[^\s)\]}'"<>]+/g;
const EMAIL_RE = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
const FILE_PATH_RE = /(?:^|[\s(=[{,;])([a-zA-Z0-9._\-/]+\.[a-zA-Z]{1,5})(?:$|[\s)\]},;:!?])/g;

const CODE_EXTENSIONS = new Set([
  "json", "js", "ts", "jsx", "tsx", "md", "txt", "yml", "yaml", "xml", "html",
  "css", "scss", "toml", "ini", "cfg", "conf", "sh", "bash", "zsh", "py", "go",
  "rs", "java", "kt", "swift", "cpp", "c", "h", "hpp", "cs", "php", "rb", "sql",
  "env", "lock", "wasm", "map",
]);

const IMG_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "ico", "svg", "bmp", "tiff",
]);

function looksLikeTechnicalPath(path: string): boolean {
  if (path.length < 4 || path.length > 120) return false;
  const dot = path.lastIndexOf(".");
  if (dot <= 0 || dot === path.length - 1) return false;
  const ext = path.slice(dot + 1).toLowerCase();
  return CODE_EXTENSIONS.has(ext) || IMG_EXTENSIONS.has(ext);
}

function extractMatches(
  text: string,
  re: RegExp,
  label: string,
  sentinels: Map<string, string>,
  counter: { n: number },
  filter?: (match: string) => boolean,
): string {
  const matches = [...text.matchAll(re)];
  if (matches.length === 0) return text;

  const sorted = matches
    .map((m) => ({ match: m[0], index: m.index ?? 0, groups: m.slice(1) }))
    .reverse();

  let result = text;
  for (const { match, index, groups } of sorted) {
    const value = groups[0] !== undefined ? groups[0] : match;
    if (filter && !filter(value)) continue;
    if (/^\{\{[A-Z_]+\d+\}\}$/.test(value)) continue;

    const key = `{{${label}_${counter.n++}}}`;
    sentinels.set(key, value);
    if (groups[0] !== undefined) {
      const offset = match.indexOf(groups[0]);
      result = result.slice(0, index + offset) + key + result.slice(index + offset + groups[0].length);
    } else {
      result = result.slice(0, index) + key + result.slice(index + match.length);
    }
  }
  return result;
}

export function extractSentinels(text: string): ExtractionResult {
  const sentinels = new Map<string, string>();
  const counter = { n: 0 };
  let result = text;

  result = extractMatches(result, FENCED_CODE_RE, "CODE", sentinels, counter);
  result = extractMatches(result, INLINE_CODE_RE, "CODE", sentinels, counter);
  result = extractMatches(result, URL_RE, "URL", sentinels, counter);
  result = extractMatches(result, EMAIL_RE, "EMAIL", sentinels, counter);
  result = extractMatches(result, FILE_PATH_RE, "FILE", sentinels, counter, looksLikeTechnicalPath);

  return { text: result, sentinels };
}

export function restoreSentinels(text: string, sentinels: Map<string, string>): string {
  if (sentinels.size === 0) return text;

  let result = text;
  const entries = [...sentinels.entries()].reverse();
  for (const [key, value] of entries) {
    result = result.split(key).join(value);
  }

  for (const [key, value] of entries) {
    const inner = key.replace(/^\{\{|\}\}$/g, "").trim();
    const escaped = inner.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`\\{\\{\\s*${escaped}\\s*\\}\\}`, "g"),
      new RegExp(`\\{\\s*\\{\\s*${escaped}\\s*\\}\\s*\\}`, "g"),
    ];
    for (const pat of patterns) {
      result = result.replace(pat, value);
    }
  }

  return result;
}
