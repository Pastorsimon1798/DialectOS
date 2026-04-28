import type { SpanishDialect } from "@dialectos/types";

export interface CorpusEntry {
  source: string;
  translated: string;
  dialect: SpanishDialect;
  formality?: string;
  provider?: string;
  qualityScore: number;
  timestamp: string;
  accepted: boolean;
}

export interface CorrectionEntry {
  source: string;
  original: string;
  corrected: string;
  dialect: SpanishDialect;
  timestamp: string;
}

export interface CorpusStats {
  totalEntries: number;
  totalCorrections: number;
  byDialect: Record<string, number>;
  qualityDistribution: {
    high: number;
    medium: number;
    low: number;
  };
}
