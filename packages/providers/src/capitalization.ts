/**
 * Spanish capitalization normalizer.
 *
 * Fixes common LLM capitalization errors by applying Spanish-specific rules:
 * 1. Lowercase days of the week, months, languages, nationalities as adjectives
 * 2. Uppercase sentence starts (after `. ? ! ¿ ¡`)
 * 3. Uppercase proper nouns that LLMs sometimes lowercase
 *
 * English-trained LLMs tend to capitalize days/months/languages
 * (Monday, January, English) which is wrong in Spanish.
 */

// Words that must be lowercase in Spanish (but English capitalizes them)
const ALWAYS_LOWERCASE: ReadonlySet<string> = new Set([
  // Days of the week
  "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo",
  "lunes,", "martes,", "miércoles,", "jueves,", "viernes,", "sábado,", "domingo,",
  // Months
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  // Languages (when used as nouns, not proper names)
  "español", "inglés", "francés", "alemán", "italiano", "portugués",
  "chino", "japonés", "coreano", "árabe", "ruso", "holandés",
  "catalán", "gallego", "vasco", "euskera",
]);

// Languages that should stay lowercase when used as language names
// but may appear capitalized at sentence start — we only fix mid-sentence
const LANGUAGE_WORDS: ReadonlySet<string> = new Set([
  "español", "inglés", "francés", "alemán", "italiano", "portugués",
  "chino", "japonés", "coreano", "árabe", "ruso", "holandés",
  "catalán", "gallego", "vasco", "euskera",
]);

/**
 * Check if a word is at the start of a sentence.
 * Position 0 or preceded by `. `, `? `, `! `, `¿`, `¡`, `\n`.
 */
function isSentenceStart(text: string, wordStart: number): boolean {
  if (wordStart === 0) return true;
  const before = text.slice(Math.max(0, wordStart - 2), wordStart);
  if (/^[.?!]\s$/.test(before)) return true;
  if (before.endsWith("¿") || before.endsWith("¡")) return true;
  if (before.endsWith("\n") || before.endsWith(":")) return true;
  return false;
}

/**
 * Normalize capitalization in Spanish text.
 *
 * - Lowercases days/months/languages that English-trained LLMs capitalize
 * - Preserves sentence-start capitalization (El lunes... stays)
 * - Fixes I/yo pronoun capitalization
 */
export function normalizeCapitalization(text: string): string {
  let result = text;

  // Fix days/months that are capitalized but NOT at sentence start
  // Match capitalized versions of our lowercase-required words
  for (const word of ALWAYS_LOWERCASE) {
    const clean = word.replace(/,$/, "");
    const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1);
    if (capitalized === clean) continue; // already lowercase-only chars

    // Find all occurrences of the capitalized form
    const re = new RegExp(`\\b${escapeRegex(capitalized)}\\b`, "g");
    let match: RegExpExecArray | null;
    while ((match = re.exec(result)) !== null) {
      const start = match.index;
      // Skip if at sentence start — keep it capitalized there
      if (isSentenceStart(result, start)) continue;
      // Replace with lowercase
      result = result.slice(0, start) + clean + result.slice(start + clean.length);
      // Adjust regex index since we shortened the string
      re.lastIndex = start + clean.length;
    }
  }

  // Fix standalone "Yo" that's mid-sentence (should be "yo")
  // Only in contexts where it's clearly the pronoun, not a sentence start
  const yoRe = /\bYo\b/g;
  let yoMatch: RegExpExecArray | null;
  while ((yoMatch = yoRe.exec(result)) !== null) {
    if (!isSentenceStart(result, yoMatch.index)) {
      result = result.slice(0, yoMatch.index) + "yo" + result.slice(yoMatch.index + 2);
      yoRe.lastIndex = yoMatch.index + 2;
    }
  }

  return result;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
