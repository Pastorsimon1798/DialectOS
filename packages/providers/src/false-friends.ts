/**
 * Spanish-English false friend detector.
 *
 * Detects common false friends (deceptive cognates) that LLMs sometimes
 * produce in English→Spanish translation. Returns warnings, not errors,
 * to preserve LLM latitude.
 *
 * A "false friend" is a word that looks similar in both languages
 * but has different meanings (e.g., embarrassed ≠ embarazada).
 */

export interface FalseFriendWarning {
  /** The word found in the text */
  found: string;
  /** What it means in Spanish (if different from intended) */
  spanishMeaning: string;
  /** What the English source word likely intended */
  englishIntended: string;
  /** The correct Spanish word */
  correctWord: string;
}

// Common false friends: English word → Spanish false friend → correct translation
const FALSE_FRIENDS: ReadonlyArray<{
  english: string;
  falseFriend: string;
  spanishMeaning: string;
  correctWord: string;
}> = [
  { english: "embarrassed", falseFriend: "embarazada", spanishMeaning: "pregnant", correctWord: "avergonzado/a" },
  { english: "embarrassing", falseFriend: "embarazoso", spanishMeaning: "troublesome/awkward", correctWord: "vergonzoso" },
  { english: "constipated", falseFriend: "constipado", spanishMeaning: "having a cold", correctWord: "estreñido" },
  { english: "constipation", falseFriend: "constipación", spanishMeaning: "cold/flu", correctWord: "estreñimiento" },
  { english: "success", falseFriend: "suceso", spanishMeaning: "event/incident", correctWord: "éxito" },
  { english: "successful", falseFriend: "suceso", spanishMeaning: "event/incident", correctWord: "exitoso" },
  { english: "actually", falseFriend: "actualmente", spanishMeaning: "currently", correctWord: "en realidad" },
  { english: "assist", falseFriend: "asistir", spanishMeaning: "to attend", correctWord: "ayudar" },
  { english: "attendance", falseFriend: "asistencia", spanishMeaning: "presence/help", correctWord: "asistencia" },
  { english: "billion", falseFriend: "billón", spanishMeaning: "trillion (10^12)", correctWord: "mil millones" },
  { english: "carpet", falseFriend: "carpeta", spanishMeaning: "folder", correctWord: "alfombra" },
  { english: "college", falseFriend: "colegio", spanishMeaning: "school (K-12)", correctWord: "universidad" },
  { english: "deception", falseFriend: "decepción", spanishMeaning: "disappointment", correctWord: "engaño" },
  { english: "disappointed", falseFriend: "decepcionado", spanishMeaning: "disappointed (correct!) → but often overused", correctWord: "decepcionado" },
  { english: "discuss", falseFriend: "discutir", spanishMeaning: "to argue/fight", correctWord: "debatir / hablar de" },
  { english: "discussion", falseFriend: "discusión", spanishMeaning: "argument/fight", correctWord: "debate / conversación" },
  { english: "exit", falseFriend: "éxito", spanishMeaning: "success", correctWord: "salida" },
  { english: "fabric", falseFriend: "fábrica", spanishMeaning: "factory", correctWord: "tela" },
  { english: "lecture", falseFriend: "lectura", spanishMeaning: "reading", correctWord: "conferencia" },
  { english: "library", falseFriend: "librería", spanishMeaning: "bookstore", correctWord: "biblioteca" },
  { english: "parents", falseFriend: "parientes", spanishMeaning: "relatives", correctWord: "padres" },
  { english: "pretend", falseFriend: "pretender", spanishMeaning: "to intend/attempt", correctWord: "fingir" },
  { english: "qualify", falseFriend: "calificar", spanishMeaning: "to grade/rate", correctWord: "cualificar" },
  { english: "realize", falseFriend: "realizar", spanishMeaning: "to carry out", correctWord: "darse cuenta" },
  { english: "remove", falseFriend: "remover", spanishMeaning: "to stir", correctWord: "quitar" },
  { english: "resume", falseFriend: "resumir", spanishMeaning: "to summarize", correctWord: "reanudar" },
  { english: "sensible", falseFriend: "sensible", spanishMeaning: "sensitive", correctWord: "sensato" },
  { english: "sensitive", falseFriend: "sensible", spanishMeaning: "sensitive (actually correct in some contexts)", correctWord: "sensible" },
  { english: "soup", falseFriend: "sopa", spanishMeaning: "soup (correct!)", correctWord: "sopa" },
  { english: "topic", falseFriend: "tópico", spanishMeaning: "cliché", correctWord: "tema" },
  { english: "tuna", falseFriend: "tuna", spanishMeaning: "prickly pear", correctWord: "atún" },
  { english: "vision", falseFriend: "visión", spanishMeaning: "vision (correct!)", correctWord: "visión" },
];

// Build a lookup map from Spanish false friend word → entry
const FALSE_FRIEND_LOOKUP: ReadonlyMap<string, typeof FALSE_FRIENDS[number]> = new Map(
  FALSE_FRIENDS.filter((ff) => ff.english !== "attendance" && ff.english !== "disappointed" && ff.english !== "soup" && ff.english !== "vision")
    .map((ff) => [ff.falseFriend.toLowerCase(), ff])
);

/**
 * Check text for potential false friend usage.
 * Returns warnings for any false friend words found.
 *
 * This is a heuristic check — it flags the word but doesn't know the
 * original English context, so the LLM or user should verify.
 */
export function detectFalseFriends(spanishText: string): FalseFriendWarning[] {
  const warnings: FalseFriendWarning[] = [];
  const words = spanishText.split(/\s+/);

  for (const word of words) {
    const clean = word.toLowerCase().replace(/[^a-záéíóúüñ]/g, "");
    const entry = FALSE_FRIEND_LOOKUP.get(clean);
    if (entry) {
      // Avoid duplicate warnings for the same cleaned word
      if (!warnings.some((w) => w.found.toLowerCase() === clean)) {
        warnings.push({
          found: clean,
          spanishMeaning: entry.spanishMeaning,
          englishIntended: entry.english,
          correctWord: entry.correctWord,
        });
      }
    }
  }

  return warnings;
}
