import { promises as fs } from "node:fs";

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

  const raw = await fs.readFile(filePath, "utf-8");
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

export function restoreProtectedTokens(text: string, replacements: Map<string, string>): string {
  let restored = text;
  replacements.forEach((token, placeholder) => {
    restored = restored.split(placeholder).join(token);
  });
  return restored;
}
