/**
 * Shared morphology utilities for Spanish text post-processing.
 *
 * Extracted from accentuation, agreement-validator, voseo-adapter, and
 * lexical-substitution to eliminate duplicated implementations.
 */

/**
 * Preserve the original casing pattern when swapping a word.
 *
 * - all-lowercase  → lowercase replacement
 * - ALL-UPPERCASE  → uppercase replacement
 * - Capitalized    → Capitalized replacement
 * - Other patterns → preserve first-letter casing, rest unchanged
 */
export function applyCase(sourceWord: string, targetWord: string): string {
  if (sourceWord === sourceWord.toLowerCase()) return targetWord.toLowerCase();
  if (sourceWord === sourceWord.toUpperCase()) return targetWord.toUpperCase();
  if (
    sourceWord[0] === sourceWord[0].toUpperCase() &&
    sourceWord.slice(1) === sourceWord.slice(1).toLowerCase()
  ) {
    return targetWord[0].toUpperCase() + targetWord.slice(1).toLowerCase();
  }
  if (sourceWord[0] === sourceWord[0].toUpperCase()) {
    return targetWord[0].toUpperCase() + targetWord.slice(1);
  }
  return targetWord;
}

/**
 * Apply Spanish pluralization rules to a singular noun.
 * Covers the common cases: vowel + s, consonant + es, z → ces.
 */
export function spanishPluralize(word: string): string {
  const lower = word.toLowerCase();
  if (lower.endsWith("z")) {
    return (
      word.slice(0, -1) +
      "c" +
      word.slice(-1).replace("z", "es").replace("Z", "ES")
    );
  }
  if (lower.endsWith("ón") || lower.endsWith("ion")) {
    // -ión / -ion endings → add -es
    return word + "es";
  }
  if (/[aeiouáéíóú]$/i.test(word)) {
    return word + "s";
  }
  // Default: consonant ending → add -es
  return word + "es";
}
