/**
 * Post-processing agreement validator for Spanish LLM output.
 *
 * Scans translated text for:
 * - Article-noun gender mismatches (el computadora → la computadora)
 * - Article-noun number mismatches (los libro → los libros)
 * - Adjective-noun number mismatches (las casas rojo → las casas rojas)
 *
 * Returns warnings, not errors — the LLM keeps latitude to make
 * stylistic choices. This is a CHECK layer, not a constraint layer.
 */

import { resolveNounGender, type NounGender } from "@dialectos/types";

export interface AgreementWarning {
  type: "gender" | "number";
  found: string;
  suggestion: string;
}

export interface AgreementResult {
  warnings: AgreementWarning[];
  passed: boolean;
}

const MASC_SINGULAR = new Set(["el", "un", "del", "al", "ese", "aquel", "este"]);
const FEM_SINGULAR = new Set(["la", "una", "esa", "aquella", "esta"]);
const PLURAL_ARTICLES = new Set(["los", "las", "unos", "unas"]);
const MASC_PLURAL = new Set(["los", "unos"]);
const FEM_PLURAL = new Set(["las", "unas"]);

const ARTICLE_NOUN_RE = /\b(el|la|los|las|un|una|unos|unas|del|al)\s+([a-záéíóúñü][a-záéíóúñü]*)/gi;

// Plural nouns end in -s or -es. Check if a noun looks plural.
const PLURAL_ENDING_RE = /[ses]$/;

// Regex to find noun + adjective pairs: article + noun + adjective
// Spanish adjectives typically follow the noun
const NOUN_ADJ_RE = /\b(?:el|la|los|las|un|una|unos|unas|del|al)\s+([a-záéíóúñü]+)\s+([a-záéíóúñü]{3,})/gi;

/**
 * Validate article-noun gender and number agreement, plus adjective-noun
 * number agreement in Spanish text.
 */
export function validateAgreement(text: string): AgreementResult {
  const warnings: AgreementWarning[] = [];

  const articleMatches = [...text.matchAll(ARTICLE_NOUN_RE)];

  for (const match of articleMatches) {
    const article = match[1].toLowerCase();
    const noun = match[2].toLowerCase();

    if (_looksLikeNonNoun(noun)) continue;

    const gender = resolveNounGender(noun);
    if (!gender) continue;

    // --- Gender agreement ---
    const isPluralArticle = PLURAL_ARTICLES.has(article);

    if (!isPluralArticle) {
      if (MASC_SINGULAR.has(article) && gender === "f") {
        warnings.push({
          type: "gender",
          found: `${match[1]} ${match[2]}`,
          suggestion: `la ${match[2]}`,
        });
      } else if (FEM_SINGULAR.has(article) && gender === "m") {
        warnings.push({
          type: "gender",
          found: `${match[1]} ${match[2]}`,
          suggestion: `el ${match[2]}`,
        });
      }
    } else {
      // Plural articles: check gender + number
      const nounIsPlural = PLURAL_ENDING_RE.test(noun);

      if (MASC_PLURAL.has(article) && gender === "f" && nounIsPlural) {
        warnings.push({
          type: "gender",
          found: `${match[1]} ${match[2]}`,
          suggestion: `las ${match[2]}`,
        });
      } else if (FEM_PLURAL.has(article) && gender === "m" && nounIsPlural) {
        warnings.push({
          type: "gender",
          found: `${match[1]} ${match[2]}`,
          suggestion: `los ${match[2]}`,
        });
      }

      // --- Number agreement ---
      // Plural article + singular noun = likely number mismatch
      if (!nounIsPlural && isPluralArticle) {
        // Only flag if the noun is clearly singular (doesn't end in s)
        // Some nouns are invariant (e.g., "crisis", "lunes")
        if (!_isInvariantNoun(noun)) {
          const pluralNoun = _makePlural(noun);
          if (pluralNoun !== noun) {
            warnings.push({
              type: "number",
              found: `${match[1]} ${match[2]}`,
              suggestion: `${match[1]} ${pluralNoun}`,
            });
          }
        }
      }
    }
  }

  // --- Adjective-noun number agreement ---
  const nounAdjMatches = [...text.matchAll(NOUN_ADJ_RE)];
  for (const match of nounAdjMatches) {
    const noun = match[1].toLowerCase();
    const adj = match[2].toLowerCase();

    if (_looksLikeNonNoun(noun) || _looksLikeNonNoun(adj)) continue;

    const nounIsPlural = PLURAL_ENDING_RE.test(noun);
    const adjIsPlural = PLURAL_ENDING_RE.test(adj);

    // If noun is plural but adjective is singular → number mismatch
    if (nounIsPlural && !adjIsPlural && adj.length > 3) {
      // Don't flag invariable adjectives (e.g., "verde", "joven", "grande")
      if (!_isInvariantAdjective(adj)) {
        const pluralAdj = _makePlural(adj);
        if (pluralAdj !== adj) {
          warnings.push({
            type: "number",
            found: `${noun} ${adj}`,
            suggestion: `${noun} ${pluralAdj}`,
          });
        }
      }
    }
  }

  return {
    warnings,
    passed: warnings.length === 0,
  };
}

/**
 * Apply agreement corrections to text.
 */
export function applyAgreementFixes(text: string): string {
  const { warnings } = validateAgreement(text);
  if (warnings.length === 0) return text;

  let result = text;
  for (const w of warnings) {
    if (w.type !== "gender") continue;
    result = result.replace(w.found, w.suggestion);
  }
  return result;
}

// --- Helpers ---

function _looksLikeNonNoun(word: string): boolean {
  if (word.length <= 2) return true;

  const commonNonNouns = new Set([
    "que", "de", "en", "y", "a", "es", "se", "no", "por", "con",
    "para", "como", "pero", "su", "mas", "si", "yo", "el", "lo",
    "le", "me", "te", "nos", "les", "ya", "esta", "ese", "aquel",
    "todo", "cada", "otro", "mismo", "mucho", "poco", "tanto",
    "donde", "cuando", "aqui", "alli", "hoy", "ayer", "manana",
    "siempre", "nunca", "tambien", "muy", "bien", "mal", "puede",
    "tiene", "hace", "sido", "visto", "dado", "hecho", "dicho",
    "puesto", "primero", "segundo", "tercero", "ultimo", "nuevo",
    "viejo", "grande", "pequeno", "bueno", "malo", "mejor", "peor",
    "principal", "general", "total", "social", "debe", "quiere",
    "sabe", "viene", "creo", "parece", "dice", "haz", "pon",
    "anda", "ando", "iendo", "ado", "ido",
  ]);

  if (commonNonNouns.has(word)) return true;
  if (word.endsWith("mente")) return true;

  return false;
}

// Nouns that don't change form in plural
const INVARIANT_NOUNS = new Set([
  "crisis", "lunes", "martes", "miercoles", "jueves", "viernes",
  "paraguas", "tijeras", "gafas", "pijama", "especies", "series",
  "analysis", "sis", "bus",
]);

function _isInvariantNoun(noun: string): boolean {
  return INVARIANT_NOUNS.has(noun);
}

// Adjectives that don't change form in plural
const INVARIANT_ADJECTIVES = new Set([
  "verde", "joven", "grande", "fuerte", "dulce", "salada",
  "cortes", "modales", "simple", "inteligible",
]);

function _isInvariantAdjective(adj: string): boolean {
  return INVARIANT_ADJECTIVES.has(adj);
}

function _makePlural(word: string): string {
  if (word.endsWith("s") || word.endsWith("es")) return word;

  // Words ending in a vowel → add -s
  if (/[aeiouáéíóú]$/.test(word)) return word + "s";

  // Words ending in -z → change to -ces
  if (word.endsWith("z")) return word.slice(0, -1) + "ces";

  // Words ending in consonant → add -es
  return word + "es";
}
