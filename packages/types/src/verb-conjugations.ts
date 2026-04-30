import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { SpanishDialect } from "./index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface VerbConjugationForms {
  present_2s?: string;
  imperative_2s?: string;
  present_subj_2s?: string;
  preterite_1s?: string;
  preterite_3s?: string;
}

export interface VerbConjugation {
  infinitive: string;
  meaning: string;
  category: "lemma-change" | "conjugation-pattern";
  regionalInfinitive?: Partial<Record<SpanishDialect, string>>;
  forms: Partial<Record<SpanishDialect, VerbConjugationForms>>;
  usageNotes?: Partial<Record<SpanishDialect, string>>;
}

const conjugationData = JSON.parse(
  readFileSync(join(__dirname, "verb-conjugations.json"), "utf-8")
) as VerbConjugation[];

export const VERB_CONJUGATIONS: readonly VerbConjugation[] = conjugationData;
