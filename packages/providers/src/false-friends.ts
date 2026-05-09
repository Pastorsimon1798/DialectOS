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

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

interface FalseFriendEntry {
  english: string;
  falseFriend: string;
  spanishMeaning: string;
  correctWord: string;
}

const FALSE_FRIENDS: readonly FalseFriendEntry[] = JSON.parse(
  readFileSync(join(__dirname, "data", "false-friends.json"), "utf-8")
);

// Build a lookup map from Spanish false friend word → entry
const FALSE_FRIEND_LOOKUP: ReadonlyMap<string, FalseFriendEntry> = new Map(
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
