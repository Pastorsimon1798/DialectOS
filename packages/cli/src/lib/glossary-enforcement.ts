import { promises as fs } from "node:fs";
import { validateFilePath } from "@espanol/security";

export type GlossaryMode = "off" | "strict";

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface GlossaryFile {
  mappings?: Record<string, string>;
  critical?: string[];
}

export interface GlossaryPreparedResult {
  text: string;
  replacements: Map<string, string>;
}

export async function loadGlossary(filePath?: string): Promise<GlossaryFile | null> {
  if (!filePath) {
    return null;
  }
  const validatedPath = validateFilePath(filePath);
  const raw = await fs.readFile(validatedPath, "utf-8");
  const parsed = JSON.parse(raw) as unknown;

  if (
    typeof parsed === "object" &&
    parsed !== null &&
    ("mappings" in parsed || "critical" in parsed)
  ) {
    const p = parsed as GlossaryFile;
    return {
      mappings: (p.mappings || {}) as Record<string, string>,
      critical: (p.critical || []) as string[],
    };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(
      "Invalid glossary file format: expected { mappings, critical? } or mapping object"
    );
  }

  return {
    mappings: parsed as Record<string, string>,
    critical: [],
  };
}

export function prepareGlossaryProtectedText(
  text: string,
  glossary: GlossaryFile | null,
  mode: GlossaryMode
): GlossaryPreparedResult {
  if (!glossary || !glossary.mappings || mode === "off") {
    return { text, replacements: new Map() };
  }

  const mappings = Object.entries(glossary.mappings).sort(
    (a, b) => b[0].length - a[0].length
  );

  if (mode === "strict" && Array.isArray(glossary.critical)) {
    for (const term of glossary.critical) {
      if (text.includes(term) && !glossary.mappings[term]) {
        throw new Error(`Strict glossary violation: missing mapping for critical term "${term}"`);
      }
    }
  }

  let protectedText = text;
  const replacements = new Map<string, string>();

  mappings.forEach(([sourceTerm, targetTerm], idx) => {
    if (!sourceTerm || !targetTerm) {
      return;
    }
    // Use case-insensitive matching. For single-word terms, use Unicode-aware
    // word boundaries to avoid matching inside other words (e.g. "bug" in "debug").
    const isMultiWord = /\s/.test(sourceTerm);
    if (isMultiWord) {
      if (!protectedText.toLowerCase().includes(sourceTerm.toLowerCase())) {
        return;
      }
      const regex = new RegExp(
        escapeRegExp(sourceTerm),
        "gi"
      );
      const placeholder = `__ESPANOL_GLOSS_${idx}__`;
      replacements.set(placeholder, targetTerm);
      protectedText = protectedText.replace(regex, placeholder);
    } else {
      const regex = new RegExp(
        `(?<![\\p{L}\\p{N}_])${escapeRegExp(sourceTerm)}(?![\\p{L}\\p{N}_])`,
        "giu"
      );
      if (!regex.test(protectedText)) {
        return;
      }
      const placeholder = `__ESPANOL_GLOSS_${idx}__`;
      replacements.set(placeholder, targetTerm);
      protectedText = protectedText.replace(regex, placeholder);
    }
  });

  return { text: protectedText, replacements };
}
