import type { SpanishDialect } from "@espanol/types";
import { ALL_SPANISH_DIALECTS } from "@espanol/types";

export type ResearchConfidence = "low" | "medium" | "high";

export interface RegionalResearchSource {
  title: string;
  link: string;
  snippet?: string;
}

export interface RegionalLexemeProposal {
  dialect: SpanishDialect;
  preferred: string[];
  accepted: string[];
  forbidden: string[];
  confidence: ResearchConfidence;
  rationale: string;
  sources: RegionalResearchSource[];
}

export interface RegionalResearchResult {
  concept: string;
  semanticField: string;
  dialects: SpanishDialect[];
  generatedAt: string;
  mode: "research-proposal";
  mutationPolicy: "never-mutates-runtime-data";
  proposals: RegionalLexemeProposal[];
  suggestedFixtures: Array<{
    dialect: SpanishDialect;
    source: string;
    requiredOutputGroups: string[][];
    forbiddenOutputTerms: string[];
  }>;
  warnings: string[];
}

export interface RegionalResearchOptions {
  concept: string;
  dialects: SpanishDialect[];
  semanticField?: string;
  search?: (query: string) => Promise<RegionalResearchSource[]>;
  maxSourcesPerDialect?: number;
}

const ORANGE_JUICE_PRIORS: Record<string, Omit<RegionalLexemeProposal, "sources">> = {
  "es-PR": {
    dialect: "es-PR",
    preferred: ["jugo de china"],
    accepted: ["jugo de naranja"],
    forbidden: [],
    confidence: "high",
    rationale: "Puerto Rican citrus usage commonly maps china to sweet orange, so orange juice is jugo de china.",
  },
  "es-DO": {
    dialect: "es-DO",
    preferred: ["jugo de china", "jugo de naranja"],
    accepted: ["jugo de naranja"],
    forbidden: [],
    confidence: "medium",
    rationale: "Dominican usage may also use china for orange, but jugo de naranja remains broadly accepted.",
  },
  "default": {
    dialect: "es-MX",
    preferred: ["jugo de naranja"],
    accepted: ["zumo de naranja"],
    forbidden: ["jugo de china"],
    confidence: "medium",
    rationale: "Outside Puerto Rican/Dominican citrus contexts, naranja is the safer default for orange.",
  },
};

function validateDialect(dialect: string): SpanishDialect {
  if (!ALL_SPANISH_DIALECTS.includes(dialect as SpanishDialect)) {
    throw new Error(`Invalid dialect: ${dialect}`);
  }
  return dialect as SpanishDialect;
}

function normalizeConcept(value: string): string {
  return value.trim().toLowerCase();
}

function builtInPrior(concept: string, dialect: SpanishDialect): Omit<RegionalLexemeProposal, "sources"> {
  if (/orange juice|jugo de china|jugo de naranja/i.test(concept)) {
    const prior = ORANGE_JUICE_PRIORS[dialect] || ORANGE_JUICE_PRIORS.default;
    return { ...prior, dialect };
  }
  return {
    dialect,
    preferred: [],
    accepted: [],
    forbidden: [],
    confidence: "low",
    rationale: "No built-in prior for this concept yet; use gathered sources for review before promoting data.",
  };
}

export function parseDialectList(value: string): SpanishDialect[] {
  return value.split(",").map((item) => validateDialect(item.trim())).filter(Boolean);
}

export async function researchRegionalTerm(options: RegionalResearchOptions): Promise<RegionalResearchResult> {
  const concept = normalizeConcept(options.concept);
  if (!concept) throw new Error("concept is required");
  if (options.dialects.length === 0) throw new Error("at least one dialect is required");

  const warnings: string[] = [];
  const proposals: RegionalLexemeProposal[] = [];
  const maxSources = options.maxSourcesPerDialect ?? 4;

  for (const dialect of options.dialects) {
    const prior = builtInPrior(concept, dialect);
    const query = `${options.concept} ${dialect} regional Spanish term`;
    let sources: RegionalResearchSource[] = [];
    if (options.search) {
      sources = (await options.search(query)).slice(0, maxSources);
    } else {
      warnings.push("No search adapter configured; using built-in priors only.");
    }
    proposals.push({ ...prior, sources });
  }

  return {
    concept,
    semanticField: options.semanticField || "general",
    dialects: options.dialects,
    generatedAt: new Date().toISOString(),
    mode: "research-proposal",
    mutationPolicy: "never-mutates-runtime-data",
    proposals,
    suggestedFixtures: proposals.map((proposal) => ({
      dialect: proposal.dialect,
      source: options.concept,
      requiredOutputGroups: proposal.preferred.length > 0 ? [proposal.preferred] : [],
      forbiddenOutputTerms: proposal.forbidden,
    })),
    warnings: [...new Set(warnings)],
  };
}
