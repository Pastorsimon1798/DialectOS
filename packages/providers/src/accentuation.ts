/**
 * Spanish accentuation corrector.
 *
 * Lookup table of common Spanish words where LLMs frequently omit the
 * needed accent. Applied as a post-processing step — fully deterministic.
 *
 * Only fixes unambiguous cases where the unaccented form is a different
 * word (e.g., "si" → "sí" when used as "yes", "mas" → "más" when
 * meaning "more").
 *
 * IMPORTANT: context matters for many of these. This module uses positional
 * heuristics, not full NLP. When in doubt, it does NOT add an accent.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface SimpleFixEntry {
  source: string;
  flags?: string;
  replacement: string;
}

interface DiacriticStringFix {
  type: "string";
  source: string;
  flags?: string;
  replacement: string;
  description: string;
}

interface DiacriticFunctionFix {
  type: "function";
  source: string;
  flags?: string;
  functionBody: string;
  description: string;
}

type DiacriticFixEntry = DiacriticStringFix | DiacriticFunctionFix;

interface AccentFixData {
  simpleFixes: SimpleFixEntry[];
  diacriticFixes: DiacriticFixEntry[];
}

const accentData: AccentFixData = JSON.parse(
  readFileSync(join(__dirname, "data", "accent-fixes.json"), "utf-8")
);

// Simple accent fixes: words where the unaccented form is simply wrong
const SIMPLE_FIXES: ReadonlyArray<[RegExp, string]> = accentData.simpleFixes.map(
  (e) => [new RegExp(e.source, e.flags || ""), e.replacement] as const
);

// Diacritic fixes: compiled at load time
type DiacriticFix = {
  pattern: RegExp;
  replacement: string | ((match: string) => string);
  description: string;
};

const DIACRITIC_FIXES: ReadonlyArray<DiacriticFix> = accentData.diacriticFixes.map((entry) => {
  const pattern = new RegExp(entry.source, entry.flags || "");
  if (entry.type === "string") {
    return { pattern, replacement: entry.replacement, description: entry.description };
  }
  // Function-type: reconstruct the replacement function from stored body
  const fn = new Function("match", (entry as DiacriticFunctionFix).functionBody) as (match: string) => string;
  return { pattern, replacement: fn, description: entry.description };
});

/**
 * Fix common missing Spanish accents in LLM output.
 */
export function fixAccentuation(text: string): string {
  let result = text;

  // Apply simple word-level fixes
  for (const [pattern, replacement] of SIMPLE_FIXES) {
    result = result.replace(pattern, replacement);
  }

  // Apply diacritic fixes with context
  for (const fix of DIACRITIC_FIXES) {
    if (typeof fix.replacement === "string") {
      result = result.replace(fix.pattern, fix.replacement);
    } else {
      result = result.replace(fix.pattern, fix.replacement as (substring: string, ...args: unknown[]) => string);
    }
  }

  return result;
}
