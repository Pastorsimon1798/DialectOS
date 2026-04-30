/**
 * Spanish punctuation normalizer.
 *
 * Adds opening ¿ and ¡ to questions and exclamations where the LLM
 * omitted them. Pure regex-based — fully deterministic.
 */

/**
 * Add missing ¿ and ¡ to Spanish questions and exclamations.
 * Only adds when the opening mark is clearly absent.
 */
export function normalizePunctuation(text: string): string {
  let result = text;

  // Fix questions: find sentences ending with ? that don't already have ¿
  // Match: start of string or after [.!?] + space, then words ending with ?
  const questions = [...text.matchAll(/(?:^|(?<=[.!?]\s))([A-ZÁÉÍÓÚÑÜ][^.?!\n]*\?)/gm)];
  // Process in reverse to preserve positions
  for (let i = questions.length - 1; i >= 0; i--) {
    const sentence = questions[i][1];
    // Skip if already has opening ¿ anywhere in the sentence
    if (sentence.includes("¿")) continue;
    result = result.replace(sentence, `¿${sentence}`);
  }

  // Fix exclamations: same pattern for !
  const exclamations = [...result.matchAll(/(?:^|(?<=[.!?]\s))([A-ZÁÉÍÓÚÑÜ][^.?!]*\!)/gm)];
  for (let i = exclamations.length - 1; i >= 0; i--) {
    const sentence = exclamations[i][1];
    if (sentence.includes("¡")) continue;
    result = result.replace(sentence, `¡${sentence}`);
  }

  return result;
}
