/**
 * Spanish verb conjugation expander.
 *
 * The verb-conjugations.ts file has 165 verbs but only present_2s and
 * imperative_2s are populated. This module generates the missing forms:
 *   - present_subj_2s (present subjunctive, 2nd person singular)
 *   - preterite_1s (preterite, 1st person singular)
 *   - preterite_3s (preterite, 3rd person singular)
 *
 * Used at build time to expand conjugation data for prompt hints and
 * validation.
 */

import type { VerbConjugation, VerbConjugationForms } from "./verb-conjugations.js";
import { VERB_CONJUGATIONS } from "./verb-conjugations.js";

// Irregular preterite forms for common verbs
const IRREGULAR_PRETERITE: ReadonlyMap<string, { preterite_1s: string; preterite_3s: string }> = new Map([
  ["ser", { preterite_1s: "fui", preterite_3s: "fue" }],
  ["ir", { preterite_1s: "fui", preterite_3s: "fue" }],
  ["tener", { preterite_1s: "tuve", preterite_3s: "tuvo" }],
  ["estar", { preterite_1s: "estuve", preterite_3s: "estuvo" }],
  ["poder", { preterite_1s: "pude", preterite_3s: "pudo" }],
  ["saber", { preterite_1s: "supe", preterite_3s: "supo" }],
  ["poner", { preterite_1s: "puse", preterite_3s: "puso" }],
  ["hacer", { preterite_1s: "hice", preterite_3s: "hizo" }],
  ["venir", { preterite_1s: "vine", preterite_3s: "vino" }],
  ["querer", { preterite_1s: "quise", preterite_3s: "quiso" }],
  ["decir", { preterite_1s: "dije", preterite_3s: "dijo" }],
  ["dar", { preterite_1s: "di", preterite_3s: "dio" }],
  ["ver", { preterite_1s: "vi", preterite_3s: "vio" }],
  ["conducir", { preterite_1s: "conduje", preterite_3s: "condujo" }],
  ["traer", { preterite_1s: "traje", preterite_3s: "trajo" }],
  ["traducir", { preterite_1s: "traduje", preterite_3s: "tradujo" }],
  ["producir", { preterite_1s: "produje", preterite_3s: "produjo" }],
  ["deducir", { preterite_1s: "deduje", preterite_3s: "dedujo" }],
  ["instruir", { preterite_1s: "instruí", preterite_3s: "instruyó" }],
  ["caer", { preterite_1s: "caí", preterite_3s: "cayó" }],
  ["leer", { preterite_1s: "leí", preterite_3s: "leyó" }],
  ["oír", { preterite_1s: "oí", preterite_3s: "oyó" }],
  ["creer", { preterite_1s: "creí", preterite_3s: "creyó" }],
  ["construir", { preterite_1s: "construí", preterite_3s: "construyó" }],
  ["destruir", { preterite_1s: "destruí", preterite_3s: "destruyó" }],
  ["incluir", { preterite_1s: "incluí", preterite_3s: "incluyó" }],
  ["haber", { preterite_1s: "hube", preterite_3s: "hubo" }],
  ["caber", { preterite_1s: "cupe", preterite_3s: "cupo" }],
  ["andar", { preterite_1s: "anduve", preterite_3s: "anduvo" }],
  ["estar", { preterite_1s: "estuve", preterite_3s: "estuvo" }],
  ["tener", { preterite_1s: "tuve", preterite_3s: "tuvo" }],
  ["poder", { preterite_1s: "pude", preterite_3s: "pudo" }],
  ["poner", { preterite_1s: "puse", preterite_3s: "puso" }],
  ["saber", { preterite_1s: "supe", preterite_3s: "supo" }],
  ["querer", { preterite_1s: "quise", preterite_3s: "quiso" }],
  ["venir", { preterite_1s: "vine", preterite_3s: "vino" }],
]);

// Irregular present subjunctive for verbs where the stem changes
const IRREGULAR_SUBJ: ReadonlyMap<string, string> = new Map([
  ["ser", "seas"],
  ["ir", "vayas"],
  ["estar", "estés"],
  ["saber", "sepas"],
  ["dar", "des"],
  ["haber", "hayas"],
  ["ir", "vayas"],
  ["decir", "digas"],
  ["hacer", "hagas"],
  ["poder", "puedas"],
  ["poner", "pongas"],
  ["querer", "quieras"],
  ["tener", "tengas"],
  ["venir", "vengas"],
  ["traer", "traigas"],
  ["conducir", "conduzcas"],
  ["traducir", "traduzcas"],
  ["producir", "produzcas"],
  ["parecer", "parezcas"],
  ["conocer", "conozcas"],
  ["crecer", "crezcas"],
  ["nacer", "nazcas"],
  ["estar", "estés"],
]);

/**
 * Generate regular preterite forms from infinitive.
 */
function regularPreterite(inf: string): { preterite_1s: string; preterite_3s: string } | undefined {
  if (inf.endsWith("-ar") || inf.endsWith("ar")) {
    const stem = inf.slice(0, -2);
    return {
      preterite_1s: `${stem}é`,
      preterite_3s: `${stem}ó`,
    };
  }
  if (inf.endsWith("er") || inf.endsWith("ir")) {
    const stem = inf.slice(0, -2);
    return {
      preterite_1s: `${stem}í`,
      preterite_3s: `${stem}ió`,
    };
  }
  return undefined;
}

/**
 * Generate regular present subjunctive (2s) from infinitive.
 */
function regularSubj2s(inf: string): string | undefined {
  if (inf.endsWith("ar")) {
    const stem = inf.slice(0, -2);
    return `${stem}es`;
  }
  if (inf.endsWith("er") || inf.endsWith("ir")) {
    const stem = inf.slice(0, -2);
    return `${stem}as`;
  }
  return undefined;
}

// Stem-changing verbs: e→ie, e→i, o→ue in present subjunctive
const STEM_CHANGES: ReadonlyArray<{ pattern: RegExp; stemChange: (stem: string, ending: string) => string }> = [
  // o→ue: dormir→duermas, poder→puedas (already handled as irregular)
  { pattern: /(.*)olar/, stemChange: (stem, _end) => `${stem}ueles` },
  // e→ie: pensar→pienses, cerrar→cierres
  { pattern: /(.*)ensar/, stemChange: (stem, _end) => `${stem}ienses` },
  { pattern: /(.*)errar/, stemChange: (stem, _end) => `${stem}ierras` },
  { pattern: /(.*)mentar/, stemChange: (stem, _end) => `${stem}ientas` },
  // e→i: pedir→pidas, seguir→sigas
  { pattern: /(.*)edir/, stemChange: (stem, _end) => `${stem}idas` },
  { pattern: /(.*)eguir/, stemChange: (stem, _end) => `${stem}igas` },
  { pattern: /(.*)entir/, stemChange: (stem, _end) => `${stem}intas` },
];

/**
 * Expand VERB_CONJUGATIONS with missing conjugation forms.
 * Returns a new array with all forms populated.
 */
export function expandConjugations(): VerbConjugation[] {
  return VERB_CONJUGATIONS.map((entry) => {
    // Deep clone to avoid mutating the original
    const expanded = { ...entry, forms: { ...entry.forms } } as VerbConjugation;

    const inf = expanded.infinitive;

    // Get preterite forms
    const pret = IRREGULAR_PRETERITE.get(inf) ?? regularPreterite(inf);

    // Get subjunctive form
    const subj = IRREGULAR_SUBJ.get(inf) ?? regularSubj2s(inf);

    // Add missing forms to each dialect's entry
    for (const [dialect, existingForms] of Object.entries(expanded.forms)) {
      if (!existingForms) continue;
      const forms = { ...existingForms } as VerbConjugationForms;
      if (!forms.present_subj_2s && subj) forms.present_subj_2s = subj;
      if (!forms.preterite_1s && pret) forms.preterite_1s = pret.preterite_1s;
      if (!forms.preterite_3s && pret) forms.preterite_3s = pret.preterite_3s;
      expanded.forms[dialect as keyof typeof expanded.forms] = forms;
    }

    return expanded;
  });
}

/**
 * Quick lookup: get the expanded conjugation for a verb infinitive.
 */
export function getExpandedConjugation(infinitive: string): VerbConjugation | undefined {
  return expandConjugations().find((v) => v.infinitive === infinitive);
}

/**
 * Build a compact conjugation hint string for LLM prompts.
 * Only includes the most critical forms for dialect accuracy.
 */
export function buildConjugationHint(infinitive: string, dialect: string): string {
  const expanded = expandConjugations();
  const entry = expanded.find((v) => {
    if (v.infinitive === infinitive) return true;
    // Check regional infinitives
    const regional = v.regionalInfinitive?.[dialect as keyof typeof v.regionalInfinitive];
    return regional === infinitive;
  });
  if (!entry) return "";

  const forms = entry.forms[dialect as keyof typeof entry.forms];
  if (!forms) return "";

  // Get the actual infinitive for this dialect
  const effectiveInf = entry.regionalInfinitive?.[dialect as keyof typeof entry.regionalInfinitive] ?? entry.infinitive;

  const parts: string[] = [effectiveInf];
  if (forms.present_2s) parts.push(`→ ${forms.present_2s}`);
  if (forms.imperative_2s) parts.push(`(imp: ${forms.imperative_2s})`);
  if (forms.preterite_3s) parts.push(`(pret: ${forms.preterite_3s})`);

  return parts.join(" ");
}
