import type { CorrectionEntry } from "@dialectos/providers";
import type { SpanishDialect } from "@dialectos/types";

export interface GlossarySuggestion {
  sourceTerm: string;
  suggestedTarget: string;
  confidence: number;
  evidence: {
    correctionCount: number;
    uniqueDialects: SpanishDialect[];
  };
}

export function generateGlossarySuggestions(
  corrections: CorrectionEntry[],
  options?: { minOccurrences?: number; minConfidence?: number }
): GlossarySuggestion[] {
  const minOccurrences = options?.minOccurrences ?? 3;
  const minConfidence = options?.minConfidence ?? 0.6;

  // Group by (source key phrase, corrected term)
  const groups = new Map<string, { count: number; dialects: Set<SpanishDialect>; corrected: string }>();

  for (const entry of corrections) {
    // Find word-level diffs between original and corrected
    const diffs = wordDiff(entry.original, entry.corrected);
    if (diffs.length === 0) continue;

    // Use the source text as the grouping key (normalized)
    const sourceKey = normalizePhrase(entry.source);

    for (const { original: orig, corrected: corr } of diffs) {
      const key = `${sourceKey}→${corr}`;
      const existing = groups.get(key);
      if (existing) {
        existing.count++;
        existing.dialects.add(entry.dialect);
      } else {
        groups.set(key, {
          count: 1,
          dialects: new Set([entry.dialect]),
          corrected: corr,
        });
      }
    }
  }

  const suggestions: GlossarySuggestion[] = [];

  for (const [key, data] of groups) {
    if (data.count < minOccurrences) continue;

    const arrowIdx = key.indexOf("→");
    const sourceTerm = key.slice(0, arrowIdx);

    const dialectFactor = Math.min(data.dialects.size / 5, 1);
    const frequencyFactor = Math.min(data.count / 10, 1);
    const confidence = Math.round((0.4 * dialectFactor + 0.6 * frequencyFactor) * 100) / 100;

    if (confidence < minConfidence) continue;

    suggestions.push({
      sourceTerm,
      suggestedTarget: data.corrected,
      confidence,
      evidence: {
        correctionCount: data.count,
        uniqueDialects: [...data.dialects],
      },
    });
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

function normalizePhrase(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ");
}

interface WordChange {
  original: string;
  corrected: string;
}

function wordDiff(original: string, corrected: string): WordChange[] {
  const origWords = original.split(/\s+/);
  const corrWords = corrected.split(/\s+/);
  const changes: WordChange[] = [];

  const maxLen = Math.max(origWords.length, corrWords.length);
  for (let i = 0; i < maxLen; i++) {
    const ow = (origWords[i] || "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
    const cw = (corrWords[i] || "").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
    if (ow && cw && ow !== cw) {
      changes.push({ original: ow, corrected: cw });
    }
  }
  return changes;
}
