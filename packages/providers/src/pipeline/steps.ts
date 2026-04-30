import type { SpanishDialect } from "@dialectos/types";
import { getVocabularyForDialect } from "@dialectos/types";
import { restoreSentinels } from "../sentinel-extraction.js";
import { applyAgreementFixes } from "../agreement-validator.js";
import { normalizePunctuation } from "../punctuation-normalizer.js";
import { fixAccentuation } from "../accentuation.js";
import { normalizeCapitalization } from "../capitalization.js";
import { normalizeTypography } from "../typography.js";
import { applyLexicalSubstitution } from "../lexical-substitution.js";
import { applyVoseo } from "../voseo-adapter.js";
import type { PipelineStep } from "./types.js";

// ── Lexical substitution ───────────────────────────────────────────────────

export const lexicalSubstitutionStep: PipelineStep = {
  name: "lexical-substitution",
  requiresDialect: true,
  process(text, context) {
    return applyLexicalSubstitution(text, context.dialect!);
  },
};

// ── Untranslated-word fallback ─────────────────────────────────────────────
// Weak models sometimes leave English nouns untranslated (e.g. "elevator").
// Only replaces exact concept-name matches to avoid false positives.

const conceptCache = new Map<string, Map<string, string>>();

function getConceptMap(dialect: SpanishDialect): Map<string, string> {
  const key = dialect;
  if (conceptCache.has(key)) return conceptCache.get(key)!;
  const map = new Map<string, string>();
  const swaps = getVocabularyForDialect(dialect);
  for (const s of swaps) {
    map.set(s.concept.toLowerCase(), s.preferredTerm);
  }
  conceptCache.set(key, map);
  return map;
}

function fixUntranslatedWords(text: string, dialect: SpanishDialect): string {
  const conceptMap = getConceptMap(dialect);
  if (conceptMap.size === 0) return text;

  return text.replace(/\b([a-zA-Z]+)\b/g, (match) => {
    const lower = match.toLowerCase();
    const replacement = conceptMap.get(lower);
    if (!replacement) return match;
    if (match === match.toUpperCase()) return replacement.toUpperCase();
    if (match[0] === match[0].toUpperCase()) {
      return replacement[0].toUpperCase() + replacement.slice(1);
    }
    return replacement;
  });
}

export const untranslatedWordsStep: PipelineStep = {
  name: "untranslated-words",
  requiresDialect: true,
  process(text, context) {
    return fixUntranslatedWords(text, context.dialect!);
  },
};

// ── Voseo adapter ──────────────────────────────────────────────────────────

export const voseoStep: PipelineStep = {
  name: "voseo",
  requiresDialect: true,
  process(text, context) {
    return applyVoseo(text, context.dialect!, context.formality);
  },
};

// ── Universal steps (run regardless of dialect) ────────────────────────────

export const agreementStep: PipelineStep = {
  name: "agreement",
  requiresDialect: false,
  process(text) {
    return applyAgreementFixes(text);
  },
};

export const punctuationStep: PipelineStep = {
  name: "punctuation",
  requiresDialect: false,
  process(text) {
    return normalizePunctuation(text);
  },
};

export const accentuationStep: PipelineStep = {
  name: "accentuation",
  requiresDialect: false,
  process(text) {
    return fixAccentuation(text);
  },
};

export const capitalizationStep: PipelineStep = {
  name: "capitalization",
  requiresDialect: false,
  process(text) {
    return normalizeCapitalization(text);
  },
};

export const typographyStep: PipelineStep = {
  name: "typography",
  requiresDialect: false,
  process(text) {
    return normalizeTypography(text);
  },
};

export const sentinelRestoreStep: PipelineStep = {
  name: "sentinel-restore",
  requiresDialect: false,
  process(text, context) {
    return restoreSentinels(text, context.sentinels);
  },
};
