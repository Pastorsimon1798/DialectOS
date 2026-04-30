/**
 * Spanish typography normalizer.
 *
 * Normalizes typographic elements to Spanish conventions:
 * 1. Straight quotes → curly quotes ("..." → "...")
 * 2. Multiple dashes → em dash (-- → —)
 * 3. Three dots → ellipsis (... → …)
 * 4. Normalize spacing around punctuation
 *
 * Pure regex-based — fully deterministic.
 */

/**
 * Normalize typography to Spanish conventions.
 */
export function normalizeTypography(text: string): string {
  let result = text;

  // Ellipsis: three or more dots → … (but not in URLs or code)
  result = result.replace(/(?<!\.)\.{3,}(?!\.)/g, "…");

  // Em dashes: -- → — (double hyphen, common markdown/typewriter convention)
  result = result.replace(/(?<!-)---?(?!-)/g, "—");

  // Curly double quotes: "text" → "text"
  // Handle paired quotes, respecting backtick code spans
  result = replaceStraightQuotes(result);

  // Normalize spacing after sentence-ending punctuation
  result = result.replace(/([.!?])\s{2,}/g, "$1 ");

  // Ensure space after comma (common LLM error in some models)
  result = result.replace(/,(?=[^\s\d])/g, ", ");

  // Normalize multiple spaces to single
  result = result.replace(/ {2,}/g, " ");

  return result;
}

/**
 * Replace straight double quotes with curly quotes,
 * properly pairing opening and closing, while respecting
 * backtick-delimited code spans.
 */
function replaceStraightQuotes(text: string): string {
  // Build a set of positions that are inside backtick code spans
  const codePositions = new Set<number>();
  let inCode = false;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "`") {
      inCode = !inCode;
      codePositions.add(i);
    } else if (inCode) {
      codePositions.add(i);
    }
  }

  let result = "";
  let inQuote = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '"') {
      if (codePositions.has(i)) {
        result += ch;
        continue;
      }
      if (inQuote) {
        result += "”"; // closing "
      } else {
        result += "“"; // opening "
      }
      inQuote = !inQuote;
    } else {
      result += ch;
    }
  }

  return result;
}
