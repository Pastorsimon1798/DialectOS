/**
 * Compiled garbage-pattern and common-English-word matchers.
 *
 * Reads pattern definitions from `garbage-patterns.json` (array of objects
 * with `pattern` and optional `flags` fields) and compiles them into RegExp
 * objects at module load time so downstream quality-gate checks pay zero
 * compilation cost per invocation.
 *
 * The JSON file is created separately; this loader just imports and compiles.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface PatternEntry {
  pattern: string;
  flags?: string;
}

const raw: PatternEntry[] = JSON.parse(
  readFileSync(join(__dirname, "garbage-patterns.json"), "utf-8"),
);

/**
 * Pre-compiled garbage patterns. Each pattern is tested against translated
 * output to detect LLM artifacts (markdown fences, meta-commentary, etc.).
 */
export const GARBAGE_PATTERNS: readonly RegExp[] = raw.map(
  (entry) => new RegExp(entry.pattern, entry.flags ?? ""),
);

/**
 * Single regex that matches common English words. Used to detect
 * mostly-untranslated output from the LLM.
 */
export const COMMON_ENGLISH_WORDS: RegExp =
  /\b(the|is|are|was|were|have|has|had|do|does|did|will|would|could|should|may|might|can|this|that|these|those|with|from|into|through|during|before|after|above|below|between|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|just|now|also|back|down|off|over|out|up|about|because|but|if|or|since|though|while|although|unless|until|whether|either|neither|both|and|yet|still|however|therefore|moreover|furthermore|nevertheless|otherwise|meanwhile|instead|besides|actually|probably|certainly|definitely|absolutely|completely|totally|exactly|precisely|specifically|particularly|especially|generally|usually|normally|typically|frequently|often|sometimes|occasionally|rarely|seldom|never|always|constantly|continuously|repeatedly|regularly|daily|weekly|monthly|yearly|early|late|soon|recently|already|yet|still|before|after|later|earlier|formerly|previously|currently|presently|immediately|instantly|directly|straight|slowly|quickly|rapidly|suddenly|gradually|eventually|finally|initially|originally|primarily|mainly|mostly|largely|partly|slightly|somewhat|fairly|pretty|rather|quite|very|extremely|incredibly|unbelievably|amazingly|surprisingly|remarkably|notably|significantly|substantially|considerably|greatly|deeply|strongly|weakly|hardly|barely|scarcely|nearly|almost|practically|virtually|essentially|basically|fundamentally|ultimately|absolutely|relatively|comparatively|exceptionally|extraordinarily|tremendously|enormously|hugely|vastly|widely|narrowly|closely|loosely|tightly|firmly|softly|gently|roughly|smoothly|easily|difficultly|simply|complexly|plainly|clearly|obviously|evidently|apparently|seemingly|presumably|supposedly|allegedly|reportedly|supposedly|theoretically|hypothetically|potentially|possibly|perhaps|maybe|likely|probably|presumably|undoubtedly|unquestionably|indisputably|incontrovertibly|indefinitely|permanently|temporarily|briefly|shortly)\b/gi;
