import { promises as fs } from "node:fs";
import { validateFilePath } from "@espanol/security";

export interface TokenProtectionFile {
  tokens: string[];
}

export interface ProtectedTextResult {
  text: string;
  replacements: Map<string, string>;
}

export async function loadProtectedTokens(filePath?: string): Promise<string[]> {
  if (!filePath) {
    return [];
  }

  const validatedPath = validateFilePath(filePath);
  const raw = await fs.readFile(validatedPath, "utf-8");
  const parsed = JSON.parse(raw) as TokenProtectionFile | string[];

  const tokens = Array.isArray(parsed) ? parsed : parsed.tokens;
  if (!Array.isArray(tokens)) {
    throw new Error("Invalid protect-tokens file format: expected array or { tokens: [] }");
  }

  return tokens
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
}

export function protectTokensInText(text: string, tokens: string[]): ProtectedTextResult {
  let protectedText = text;
  const replacements = new Map<string, string>();

  tokens.forEach((token, idx) => {
    if (!token || !protectedText.includes(token)) {
      return;
    }
    const placeholder = `__ESPANOL_TOKEN_${idx}__`;
    replacements.set(placeholder, token);
    protectedText = protectedText.split(token).join(placeholder);
  });

  return { text: protectedText, replacements };
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeReplacementString(str: string): string {
  // In String.prototype.replace, $ has special meaning ($&, $1, $$, etc.)
  // To use a literal string as replacement, we must escape $ as $$
  return str.replace(/\$/g, "$$$$");
}

export function restoreProtectedTokens(text: string, replacements: Map<string, string>): string {
  let restored = text;
  replacements.forEach((token, placeholder) => {
    restored = restored.split(placeholder).join(token);
    // Some providers normalize placeholders (e.g. "__ESPANOL_GLOSS_6__" -> "ESPANOL GLOSS 6")
    const base = escapeRegExp(placeholder.replace(/^_+|_+$/g, ""));
    const normalized = base.replace(/_/g, "[_\\s]*");
    const regex = new RegExp(`\\b${normalized}\\b`, "g");
    restored = restored.replace(regex, escapeReplacementString(token));
  });
  return restored;
}

const COMMON_FILE_EXTENSIONS = new Set([
  "json", "js", "ts", "jsx", "tsx", "md", "txt", "yml", "yaml", "xml", "html",
  "css", "scss", "sass", "less", "svg", "png", "jpg", "jpeg", "gif", "webp",
  "ico", "pdf", "zip", "tar", "gz", "lock", "toml", "ini", "cfg", "conf",
  "sh", "bash", "zsh", "fish", "ps1", "bat", "cmd", "exe", "dll", "so",
  "dylib", "wasm", "rb", "py", "go", "rs", "java", "kt", "swift", "cpp",
  "c", "h", "hpp", "cs", "php", "lua", "r", "pl", "pm",
]);

function isFilePath(match: string): boolean {
  const lastDot = match.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === match.length - 1) return false;
  const ext = match.slice(lastDot + 1).toLowerCase();
  return COMMON_FILE_EXTENSIONS.has(ext);
}

export function detectIdentityTokens(text: string): string[] {
  const tokens = new Set<string>();

  const patterns: RegExp[] = [
    /@[a-zA-Z0-9_.-]{3,}/g, // handles
    /\b[a-zA-Z0-9_.-]+\.[a-zA-Z]{2,}\b/g, // domains
    /\b[a-zA-Z0-9_-]{3,}\/[a-zA-Z0-9_.-]{2,}\b/g, // repo-like owner/name
    /(?:^|[^\w])([a-zA-Z0-9_-]{6,}\d{2,})(?:$|[^\w])/g, // usernames with numeric suffixes
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern) || [];
    matches.forEach((match) => {
      const trimmed = match.trim();
      // Skip matches that look like file paths (e.g., config.json, package.lock)
      if (!isFilePath(trimmed)) {
        tokens.add(trimmed);
      }
    });
  }

  return Array.from(tokens).sort((a, b) => b.length - a.length);
}
