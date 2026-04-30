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

// Map: unaccented form → accented form + context rule
// "always" = always correct (unaccented form is never valid Spanish in this position)
// "start" = only at start of sentence/clause
// "before_verb" = only when followed by a verb
type AccentRule = { accented: string; when: "always" | "start" | "after_comma" };

const ACCENT_LOOKUP: ReadonlyMap<string, AccentRule> = new Map([
  // adverbs — always take accent
  ["mas", { accented: "más", when: "always" }],
  ["tambien", { accented: "también", when: "always" }],
  ["ademas", { accented: "además", when: "always" }],
  ["siempre", { accented: "siempre", when: "always" }],  // no accent needed
  ["rapido", { accented: "rápido", when: "always" }],
  ["facil", { accented: "fácil", when: "always" }],
  ["dificil", { accented: "difícil", when: "always" }],
  ["util", { accented: "útil", when: "always" }],
  ["publico", { accented: "público", when: "always" }],  // ambiguous but common
  ["unico", { accented: "único", when: "always" }],
  ["logico", { accented: "lógico", when: "always" }],
  ["practico", { accented: "práctico", when: "always" }],
  ["basico", { accented: "básico", when: "always" }],
  ["comun", { accented: "común", when: "always" }],
  ["util", { accented: "útil", when: "always" }],
  [" angel", { accented: " ángel", when: "always" }],
]);

// Words that ALWAYS need an accent (the unaccented form IS a different word)
const ALWAYS_ACCENT: ReadonlyMap<string, string> = new Map([
  ["mas", "más"],          // mas = but, más = more
  ["tambien", "también"],   // not a word without accent
  ["ademas", "además"],     // not a word without accent
  ["porque", "porque"],     // actually valid both ways — skip
]);

// Diacritic words: same spelling with/without accent, different meaning
// Only fix when context is clear
const DIACRITIC_FIXES: ReadonlyArray<{
  pattern: RegExp;
  replacement: string | ((match: string) => string);
  description: string;
}> = [
  // "si" at start of sentence or after comma/period when used as "yes" → "sí"
  // Heuristic: "si" followed by comma is "yes" (sí, claro)
  { pattern: /\bSi\b,\s/g, replacement: "Sí, ", description: "Sí at start before comma" },
  { pattern: /\bsi\b,\s/g, replacement: "sí, ", description: "sí before comma" },

  // "el" when it's a pronoun (he) not an article (the) — too ambiguous, skip
  // "tu" when it's a pronoun (you) not an adjective (your)
  { pattern: /\bTu\s+(puedes|quieres|necesitas|tienes|sabes|vas|eres|estas|has|debes|crees|sientes)\b/gi,
    replacement: (match) => match === match.toUpperCase() ? match : match.replace(/^Tu/, "Tú"),
    description: "Tú before common verbs" },
];

// Simple accent fixes: words where the unaccented form is simply wrong
// (not a valid Spanish word, or the accented form is far more common)
const SIMPLE_FIXES: ReadonlyArray<[RegExp, string]> = [
  [/\btambien\b/g, "también"],
  [/\bTambien\b/g, "También"],
  [/\bademas\b/g, "además"],
  [/\bAdemas\b/g, "Además"],
  [/\bporfavor\b/gi, "por favor"],
  [/\bquizas\b/g, "quizás"],
  [/\bQuizas\b/g, "Quizás"],
  [/\btambien\b/g, "también"],
  [/\bTambien\b/g, "También"],
  [/\bjamas\b/g, "jamás"],
  [/\bJamas\b/g, "Jamás"],
  [/\balgun\b/g, "algún"],
  [/\bAlgun\b/g, "Algún"],
  [/\bningun\b/g, "ningún"],
  [/\bNingun\b/g, "Ningún"],
];

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
