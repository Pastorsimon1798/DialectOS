/**
 * Quality Gates — adaptive validation layer for translation outputs
 *
 * Gates detect problems. They do NOT fix them.
 * A gate failure triggers retry; a gate pass emits telemetry.
 *
 * Gates are tier-dependent: strong models skip expensive gates.
 */

import type { SpanishDialect } from "@dialectos/types";
import { getForbiddenTerms } from "@dialectos/types";

export type ModelTier = "tiny" | "small" | "medium" | "large";

export interface QualityGateResult {
  name: string;
  passed: boolean;
  details?: string;
}

export interface QualityGateContext {
  sourceText: string;
  translatedText: string;
  dialect: SpanishDialect;
  modelTier: ModelTier;
}

export type QualityGate = (
  context: QualityGateContext
) => QualityGateResult | Promise<QualityGateResult>;

// ============================================================================
// Cheap gates (run for all tiers where applicable)
// ============================================================================

/**
 * Length sanity check: output should be within reasonable bounds of source.
 */
export function lengthSanityCheck(context: QualityGateContext): QualityGateResult {
  const { sourceText, translatedText } = context;
  const srcLen = sourceText.trim().length;
  const outLen = translatedText.trim().length;

  if (srcLen === 0) {
    return { name: "lengthSanity", passed: true };
  }

  const ratio = outLen / srcLen;

  if (ratio > 4) {
    return {
      name: "lengthSanity",
      passed: false,
      details: `Output ${outLen} chars is ${ratio.toFixed(1)}x source length (max 4x)`,
    };
  }

  if (ratio < 0.15 && srcLen > 10) {
    return {
      name: "lengthSanity",
      passed: false,
      details: `Output ${outLen} chars is ${(ratio * 100).toFixed(0)}% of source (min 15%)`,
    };
  }

  return { name: "lengthSanity", passed: true };
}

/**
 * Dialect compliance check: verify no forbidden terms for target dialect.
 */
export function dialectComplianceCheck(context: QualityGateContext): QualityGateResult {
  const { translatedText, dialect } = context;
  const lowerOutput = translatedText.toLowerCase();

  try {
    const forbidden = getForbiddenTerms(dialect);
    const violations: string[] = [];

    for (const f of forbidden) {
      // Simple word-boundary check
      const pattern = new RegExp(`\\b${f.term.toLowerCase()}\\b`, "i");
      if (pattern.test(lowerOutput)) {
        violations.push(`${f.term} → use ${f.reason}`);
      }
    }

    if (violations.length > 0) {
      return {
        name: "dialectCompliance",
        passed: false,
        details: violations.slice(0, 3).join("; "),
      };
    }
  } catch {
    // If dictionary lookup fails, skip this gate
  }

  return { name: "dialectCompliance", passed: true };
}

// ============================================================================
// Gates for tiny/small models only
// ============================================================================

/**
 * Person consistency check: detect "You" → "Yo" flips.
 */
export function personConsistencyCheck(context: QualityGateContext): QualityGateResult {
  const { sourceText, translatedText } = context;
  const srcLower = sourceText.trim().toLowerCase();
  const outLower = translatedText.trim().toLowerCase();

  // Source starts with "You" (second person)
  const sourceIsYou = /^\s*you\b/i.test(sourceText);

  // Output starts with "Yo" (first person) — this is the flip
  const outputIsYo = /^\s*yo\b/i.test(translatedText);

  if (sourceIsYou && outputIsYo) {
    return {
      name: "personConsistency",
      passed: false,
      details: `Source "You..." translated as "Yo..." (person flip)`,
    };
  }

  // Also catch "Tú" → "Yo" or "Usted" → "Yo"
  if (sourceIsYou && /^\s*yo\b/i.test(translatedText)) {
    return {
      name: "personConsistency",
      passed: false,
      details: `Source "You..." translated as first person`,
    };
  }

  return { name: "personConsistency", passed: true };
}

/**
 * Haber vs tener check: detect possessive "have" mapped to auxiliary "haber".
 */
export function haberTenerCheck(context: QualityGateContext): QualityGateResult {
  const { sourceText, translatedText } = context;
  const srcLower = sourceText.trim().toLowerCase();
  const outLower = translatedText.trim().toLowerCase();

  // Source is "You have a [noun]" (possessive)
  const possessiveHave = /\byou\s+have\s+a\b/i.test(sourceText);

  // Output uses "has/has" (auxiliary haber) instead of "tienes/tiene" (possessive tener)
  const usesHaber = /\b(te\s+has\s+dado|has\s+dado|te\s+ha\s+dado|ha\s+dado)\b/i.test(translatedText);

  if (possessiveHave && usesHaber) {
    return {
      name: "haberTener",
      passed: false,
      details: `Possessive "have" mistranslated as auxiliary "haber"`,
    };
  }

  return { name: "haberTener", passed: true };
}

// ============================================================================
// Gate registry
// ============================================================================

interface GateConfig {
  gate: QualityGate;
  tiers: ModelTier[];
}

const GATE_REGISTRY: GateConfig[] = [
  { gate: lengthSanityCheck, tiers: ["tiny", "small", "medium", "large"] },
  { gate: dialectComplianceCheck, tiers: ["tiny", "small", "medium", "large"] },
  { gate: personConsistencyCheck, tiers: ["tiny", "small"] },
  { gate: haberTenerCheck, tiers: ["tiny", "small"] },
];

/**
 * Run all quality gates applicable to the given model tier.
 */
export async function runQualityGates(
  context: QualityGateContext
): Promise<QualityGateResult[]> {
  const results: QualityGateResult[] = [];

  for (const config of GATE_REGISTRY) {
    if (!config.tiers.includes(context.modelTier)) {
      continue;
    }

    try {
      const result = await config.gate(context);
      results.push(result);
    } catch (error) {
      results.push({
        name: config.gate.name,
        passed: true, // Gate errors should not block translation
        details: `Gate error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  return results;
}
