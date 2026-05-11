/**
 * Deterministic lexical substitution post-processor.
 *
 * Scans Spanish text for words that are wrong for the target dialect
 * and swaps them to the correct dialect-specific term.
 *
 * Also fixes article gender when a noun swap changes gender
 * (e.g. "la computadora" → "el ordenador").
 */

import type { SpanishDialect } from "@dialectos/types";
import { getVocabularyForDialect, resolveNounGender } from "@dialectos/types";
import { applyCase, spanishPluralize } from "./morphology.js";

interface SwapRule {
  wrongTerm: string;
  preferredTerm: string;
  concept: string;
}

// Cache: dialect → array of swap rules
const swapCache = new Map<SpanishDialect, SwapRule[]>();

function buildSwapRules(dialect: SpanishDialect): SwapRule[] {
  const swaps = getVocabularyForDialect(dialect);

  // Collect all preferred terms for this dialect to detect collisions.
  // If a term is the preferred term for concept A, it should NOT be
  // treated as a wrong term for concept B in the same dialect.
  // (e.g. "guagua" = bus in es-CU, but also a variant for baby in es-CL)
  const preferredTerms = new Set(swaps.map((s) => s.preferredTerm.toLowerCase()));

  const rules: SwapRule[] = [];
  for (const s of swaps) {
    for (const avoid of s.avoidTerms) {
      const avoidLower = avoid.toLowerCase();
      // Skip if this avoid term is itself a preferred term for another
      // concept in the same dialect — it's ambiguous, don't swap.
      if (preferredTerms.has(avoidLower)) continue;
      rules.push({
        wrongTerm: avoidLower,
        preferredTerm: s.preferredTerm,
        concept: s.concept,
      });
    }
  }
  return rules;
}

function getSwapRules(dialect: SpanishDialect): SwapRule[] {
  let rules = swapCache.get(dialect);
  if (!rules) {
    rules = buildSwapRules(dialect);
    swapCache.set(dialect, rules);
  }
  return rules;
}

/**
 * Given a potentially plural word, try to find its singular form in the rule map.
 * Returns the rule and a flag indicating if the original was plural.
 */
function findRuleForWord(word: string, ruleMap: Map<string, SwapRule>): { rule: SwapRule; wasPlural: boolean } | null {
  // Direct match (singular or uncountable)
  const direct = ruleMap.get(word.toLowerCase());
  if (direct) return { rule: direct, wasPlural: false };

  // Try stripping plural suffixes
  const lower = word.toLowerCase();

  // -s plural (vowel endings: carro → carros, coche → coches)
  // Check this FIRST because words ending in vowel + s look like they end in "es"
  if (lower.endsWith("s")) {
    const singularMinusS = lower.slice(0, -1);
    const rule = ruleMap.get(singularMinusS);
    if (rule) return { rule, wasPlural: true };
  }

  // -es plural (consonant endings: flor → flores, camión → camiones)
  if (lower.endsWith("es")) {
    const singularMinusEs = lower.slice(0, -2);
    const rule = ruleMap.get(singularMinusEs);
    if (rule) return { rule, wasPlural: true };

    // Special case: -z → -ces (e.g. luz → luces)
    // If the stem ends in "c", try replacing it with "z"
    if (singularMinusEs.endsWith("c")) {
      const zForm = singularMinusEs.slice(0, -1) + "z";
      const ruleZ = ruleMap.get(zForm);
      if (ruleZ) return { rule: ruleZ, wasPlural: true };
    }
  }

  return null;
}

/**
 * Tokenize text into words (Unicode letters) and non-words.
 * Each word is evaluated for substitution exactly once, preventing
 * chained replacements (e.g. autobús → guagua → bebé).
 */
function tokenize(text: string): Array<{ type: "word" | "nonword"; value: string }> {
  const tokens: Array<{ type: "word" | "nonword"; value: string }> = [];
  const regex = /\p{L}+/gu;
  let lastIndex = 0;
  for (const match of text.matchAll(regex)) {
    if (match.index! > lastIndex) {
      tokens.push({ type: "nonword", value: text.slice(lastIndex, match.index) });
    }
    tokens.push({ type: "word", value: match[0] });
    lastIndex = match.index! + match[0].length;
  }
  if (lastIndex < text.length) {
    tokens.push({ type: "nonword", value: text.slice(lastIndex) });
  }
  return tokens;
}

/** Fix article gender when a noun swap changes gender. */
function fixArticleGender(text: string, oldNoun: string, newNoun: string): string {
  const oldGender = resolveNounGender(oldNoun);
  const newGender = resolveNounGender(newNoun);
  if (!oldGender || !newGender || oldGender === newGender) return text;

  const nounLower = newNoun.toLowerCase();
  const pairs: Array<[string, string]> = [
    ["el", "la"],
    ["un", "una"],
    ["los", "las"],
    ["este", "esta"],
    ["ese", "esa"],
    ["aquel", "aquella"],
    ["ningún", "ninguna"],
    ["algún", "alguna"],
  ];

  for (const [masc, fem] of pairs) {
    const from = newGender === "m" ? fem : masc;
    const to = newGender === "m" ? masc : fem;
    const pattern = new RegExp(
      `(^|[^\\p{L}\\p{N}])${from}([\\s]+)${nounLower}([^\\p{L}\\p{N}]|$)`,
      "giu"
    );
    text = text.replace(pattern, (match, before, spaces, after) => {
      const m = match.match(new RegExp(`\\b${from}\\b`, "i"));
      const cased = m ? applyCase(m[0], to) : to;
      return `${before}${cased}${spaces}${nounLower}${after}`;
    });
  }

  if (newGender === "m") {
    text = text.replace(
      new RegExp(`(^|[^\\p{L}\\p{N}])de\\s+la\\s+(${nounLower})([^\\p{L}\\p{N}]|$)`, "giu"),
      "$1del $2$3"
    );
    text = text.replace(
      new RegExp(`(^|[^\\p{L}\\p{N}])a\\s+la\\s+(${nounLower})([^\\p{L}\\p{N}]|$)`, "giu"),
      "$1al $2$3"
    );
  } else {
    text = text.replace(
      new RegExp(`(^|[^\\p{L}\\p{N}])del\\s+(${nounLower})([^\\p{L}\\p{N}]|$)`, "giu"),
      "$1de la $2$3"
    );
    text = text.replace(
      new RegExp(`(^|[^\\p{L}\\p{N}])al\\s+(${nounLower})([^\\p{L}\\p{N}]|$)`, "giu"),
      "$1a la $2$3"
    );
  }

  return text;
}

/**
 * Apply deterministic lexical substitution to Spanish text.
 *
 * Each word is checked against the dialect dictionary exactly once,
 * preventing chained replacements.
 *
 * @param text - Spanish text to process
 * @param dialect - Target Spanish dialect
 * @returns Text with dialect-appropriate vocabulary
 */
export function applyLexicalSubstitution(text: string, dialect: SpanishDialect): string {
  if (!text || !dialect) return text;
  const rules = getSwapRules(dialect);
  if (rules.length === 0) return text;

  // Build a lookup map for O(1) word checks
  const ruleMap = new Map<string, SwapRule>();
  for (const rule of rules) {
    if (!ruleMap.has(rule.wrongTerm)) {
      ruleMap.set(rule.wrongTerm, rule);
    }
  }

  const tokens = tokenize(text);
  let result = "";
  const swapped: Array<{ old: string; preferred: string }> = [];

  for (const token of tokens) {
    if (token.type === "nonword") {
      result += token.value;
      continue;
    }
    const found = findRuleForWord(token.value, ruleMap);
    if (found) {
      const { rule, wasPlural } = found;
      let replacement = applyCase(token.value, rule.preferredTerm);
      if (wasPlural) {
        replacement = applyCase(token.value, spanishPluralize(rule.preferredTerm));
      }
      swapped.push({ old: token.value, preferred: replacement });
      result += replacement;
    } else {
      result += token.value;
    }
  }

  // Fix article gender for any swaps that changed noun gender
  for (const { old, preferred } of swapped) {
    result = fixArticleGender(result, old, preferred);
  }

  return result;
}
