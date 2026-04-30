import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { SpanishDialect } from "./index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dictionaryData = JSON.parse(
  readFileSync(join(__dirname, "dialectal-dictionary.json"), "utf-8")
);

export type SemanticField =
  | "technology" | "transport" | "food" | "household" | "clothing"
  | "actions" | "social" | "people" | "education" | "body_parts" | "nature"
  | "medicine_health" | "family_kinship" | "finance_banking" | "accessibility"
  | "core_vocabulary";

export interface Variant {
  term: string;
  frequency: 1 | 2 | 3;
  register: "formal" | "informal" | "universal";
  notes?: string;
}

export interface DictionaryEntry {
  field: SemanticField;
  concept: string;
  englishGloss: string;
  panHispanic?: string;
  variants?: Partial<Record<SpanishDialect, Variant>>;
}

export const DICTIONARY: readonly DictionaryEntry[] = dictionaryData as readonly DictionaryEntry[];
